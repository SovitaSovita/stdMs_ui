import React, { useEffect, useMemo } from "react";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import { Box, FormControl, MenuItem, Select } from "@mui/material";
import { useFormik } from "formik";
import { useUpsertSubjectSchema } from "@/app/libs/hooks/Validation";
import { classroomAtom, subjectsAtom } from "@/app/libs/jotai/classroomAtom";
import { useAtom, useAtomValue } from "jotai";
import { useLocale, useTranslations } from "next-intl";
import AddIcon from "@mui/icons-material/Add";
import useClassroomData from "@/app/libs/hooks/useClassroomData";
import { SubjectUpsertRequest } from "@/app/constants/type/SubjectType";
import SubjectService from "@/app/service/SubjectService";

type AddSubjectDialogProps = {};

export const AddSubjectDialog = (props: AddSubjectDialogProps) => {
  const {} = props;
  const locale = useLocale();
  const [subjects, setSubjects] = useAtom(subjectsAtom);

  const [open, setOpen] = React.useState(false);
  const classroom = useAtomValue(classroomAtom);
  const { refetch } = useClassroomData(classroom);
  const t = useTranslations();
  const validationSchema = useUpsertSubjectSchema();
  const subjectsSelect = [
    { code: "K", name: "Khmer", nameKh: "ភាសាខ្មែរ" },
    { code: "M", name: "Math", nameKh: "គណិតវិទ្យា" },
    { code: "P", name: "Physics", nameKh: "រូបវិទ្យា" },
    { code: "C", name: "Chemistry", nameKh: "គីមីវិទ្យា" },
    { code: "B", name: "Biology", nameKh: "ជីវវិទ្យា" },
    { code: "Es", name: "Earth Science", nameKh: "វិទ្យាសាស្ត្រផែនដី" },
    { code: "H", name: "History", nameKh: "ប្រវត្តិសាស្ត្រ" },
    { code: "G", name: "Geography", nameKh: "ភូមិសាស្ត្រ" },
    { code: "I", name: "Informatics", nameKh: "ព័ត៌មានវិទ្យា" },
    { code: "HE", name: "Health Education", nameKh: "អប់រំសុខភាព" },
    { code: "EN", name: "English", nameKh: "អង់គ្លេស" },
    { code: "ED", name: "Civic Education", nameKh: "អប់រំពលរដ្ឋ" },
    { code: "SI", name: "Social Studies", nameKh: "សង្គមវិទ្យា" },
    { code: "IT", name: "Information Tech", nameKh: "បច្ចេកវិទ្យាព័ត៌មាន" },
  ];

  const subjectExists = useMemo(() => {
    const existingSubject = new Set(subjects?.map((sub) => sub.name));
    return subjectsSelect.map((s) => ({
      ...s,
      isExist: existingSubject.has(s.code),
    }));
  }, [subjects]);

  const defaultSubjectCode = useMemo(() => {
    return subjectExists.find((sub) => !sub.isExist)?.code ?? "";
  }, [subjectExists]);

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const formik = useFormik({
    initialValues: {
      // id: "",
      name: defaultSubjectCode || "",
      nameKh:
        subjectExists.find((s) => s.code === defaultSubjectCode)?.nameKh || "",
      classId: "",
      teacherName: "",
      maxScore: 0,
      credit: "",
      description: "",
    },
    validationSchema: validationSchema,
    enableReinitialize: true,
    onSubmit: (values: SubjectUpsertRequest) => {
      handleAddRow(values);
    },
  });

  const handleAddRow = async (values: SubjectUpsertRequest) => {
    const sendData: SubjectUpsertRequest = {
      ...values,
      classId: classroom?.id,
    };

    if (!sendData.classId) return;

    const result = await SubjectService.upsert(sendData);
    if (result?.status == 200) {
      refetch.fetchSubjects();
      handleClose();
    }
  };

  return (
    <>
      <Button
        onClick={handleClickOpen}
        variant="contained"
        size="small"
        startIcon={<AddIcon />}
      >
        {t("Common.add")}
      </Button>
      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>{t("Subject.AddTitle")}</DialogTitle>
        <form onSubmit={formik.handleSubmit}>
          <DialogContent>
            <Box display={"flex"} alignItems={"center"} gap={2}>
              <FormControl fullWidth>
                <Select
                  labelId="select-code-label"
                  value={formik.values.name}
                  name="name"
                  onChange={(e) => {
                    const code = e.target.value;
                    const subject = subjectExists.find((s) => s.code === code);
                    formik.setFieldValue("name", subject?.code || "");
                    formik.setFieldValue("nameKh", subject?.nameKh || "");
                  }}
                  variant="outlined"
                  onBlur={formik.handleBlur}
                >
                  {subjectExists.map((sub) => (
                    <MenuItem value={sub.code} disabled={sub?.isExist}>
                      {locale === "km" ? sub.nameKh : sub.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField
                disabled
                margin="dense"
                name="name"
                placeholder={"Code " + t("Common.subject")}
                type="text"
                fullWidth
                variant="outlined"
                onChange={formik.handleChange}
                value={formik.values.name}
              />
            </Box>

            <Box display={"flex"} gap={2}>
              <TextField
                autoFocus
                margin="dense"
                name="teacherName"
                placeholder={t("CommonField.teacherName")}
                type="text"
                fullWidth
                variant="outlined"
                value={formik.values.teacherName}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
              />
            </Box>

            <Box display={"flex"} gap={2}>
              <TextField
                autoFocus
                margin="dense"
                name="credit"
                placeholder={t("Common.mekun")}
                type="text"
                fullWidth
                variant="outlined"
                value={formik.values.credit}
                onChange={formik.handleChange}
              />
              <TextField
                autoFocus
                margin="dense"
                name="maxScore"
                placeholder={t("CommonField.maxScore")}
                type="text"
                fullWidth
                variant="outlined"
                // value={formik.values.maxScore}
                onChange={formik.handleChange}
              />
            </Box>

            <TextField
              multiline
              rows={3}
              margin="dense"
              name="description"
              placeholder={t("CommonField.description")}
              type="description"
              fullWidth
              variant="outlined"
              value={formik.values.description}
              onChange={formik.handleChange}
            />
          </DialogContent>

          <DialogActions>
            <Button onClick={handleClose}>{t("Common.cancel")}</Button>
            <Button
              disabled={
                !defaultSubjectCode ||
                (formik.touched.name && Boolean(formik.errors.name))
              }
              type="submit"
            >
              {t("Common.done")}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </>
  );
};
