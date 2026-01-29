import React from "react";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import {
  Box,
  FormControl,
  FormHelperText,
  InputLabel,
  MenuItem,
  Select,
} from "@mui/material";
import { useFormik } from "formik";
import { useInsertOneStutSchema } from "@/app/libs/hooks/Validation";
import CustomDatePicker from "../CustomDatePicker";
import { StudentsRequestUpsertType } from "@/app/constants/type";
import StudentService from "@/app/service/StudentService";
import { classroomAtom } from "@/app/libs/jotai/classroomAtom";
import { useAtomValue } from "jotai";
import { useTranslations } from "next-intl";
import PersonAddAlt1Icon from '@mui/icons-material/PersonAddAlt1';
import useClassroomData from "@/app/libs/hooks/useClassroomData";

type InsertOneStudentDialogProps = {};

export const InsertOneStudentDialog = (props: InsertOneStudentDialogProps) => {
  const {} = props;
  const [open, setOpen] = React.useState(false);
  const classroom = useAtomValue(classroomAtom);
  const { refetch } = useClassroomData(classroom);
  const t = useTranslations();
  const validationSchema = useInsertOneStutSchema();

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const formik = useFormik({
    initialValues: {
      // id: "",
      classId: classroom?.id,
      fullName: "",
      gender: "M",
      dateOfBirth: "",
      fatherName: "",
      fatherOccupation: "",
      montherName: "",
      montherOccupation: "",
      placeOfBirth: "",
      address: "",
    },
    validationSchema: validationSchema,
    onSubmit: (values: StudentsRequestUpsertType) => {
      // handleSubmit(values)
      handleAddRow(values);
    },
  });

  const handleAddRow = async (values: StudentsRequestUpsertType) => {
    const sendData: StudentsRequestUpsertType = {
      ...values,
      classId: classroom?.id
    };

    if (!sendData.classId) return;

    const result = await StudentService.upsertStudent(sendData);
    if (result?.status == 200) {
      refetch.fetchStudents();
      handleClose();
    }
  };

  return (
    <>
      <Button onClick={handleClickOpen} variant="contained" size="small"   startIcon={<PersonAddAlt1Icon />}
>
        {t("Student.btn.singleAdd")}
      </Button>
      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>{t("Student.DialogInsert.title")}</DialogTitle>
        <form onSubmit={formik.handleSubmit}>
          <DialogContent>
            <TextField
              autoFocus
              required
              margin="dense"
              name="fullName"
              placeholder={t("CommonField.fullName")}
              type="text"
              fullWidth
              variant="outlined"
              value={formik.values.fullName}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.fullName && Boolean(formik.errors.fullName)}
              helperText={formik.touched.fullName && formik.errors.fullName}
            />

            <Box display={"flex"} gap={1} alignItems={"center"} mt={1}>
              <FormControl>
                <Select
                  labelId="select-gender-label"
                  value={formik.values.gender}
                  name="gender"
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  variant="outlined"
                >
                  <MenuItem value="M">{t("CommonField.gender", {gender: "M"})}</MenuItem>
                  <MenuItem value="F">{t("CommonField.gender", {gender: "F"})}</MenuItem>
                </Select>
              </FormControl>
              <CustomDatePicker
                name="dateOfBirth"
                label={t("CommonField.dateOfBirth")}
                value={formik.values.dateOfBirth}
                onChange={(val) => {
                  formik.setFieldValue("dateOfBirth", val);
                  formik.setFieldTouched("dateOfBirth", true);
                }}
                error={formik.errors.dateOfBirth}
              />
            </Box>

            <Box display={"flex"} gap={4}>
              <TextField
                autoFocus
                margin="dense"
                name="fatherName"
                placeholder={t("CommonField.fatherName")}
                type="text"
                fullWidth
                variant="outlined"
                value={formik.values.fatherName}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
              />
              <TextField
                autoFocus
                margin="dense"
                name="fatherOccupation"
                placeholder={t("CommonField.occupation")}
                type="text"
                fullWidth
                variant="outlined"
                value={formik.values.fatherOccupation}
                onChange={formik.handleChange}
              />
            </Box>

            <Box display={"flex"} gap={4}>
              <TextField
                autoFocus
                margin="dense"
                name="montherName"
                placeholder={t("CommonField.montherName")}
                type="text"
                fullWidth
                variant="outlined"
                value={formik.values.montherName}
                onChange={formik.handleChange}
              />
              <TextField
                autoFocus
                margin="dense"
                name="montherOccupation"
                placeholder={t("CommonField.occupation")}
                type="text"
                fullWidth
                variant="outlined"
                value={formik.values.montherOccupation}
                onChange={formik.handleChange}
              />
            </Box>

            <TextField
              multiline
              rows={3}
              margin="dense"
              name="placeOfBirth"
              placeholder={t("CommonField.placeOfBirth")}
              type="placeOfBirth"
              fullWidth
              variant="outlined"
              value={formik.values.placeOfBirth}
              onChange={formik.handleChange}
            />

            <TextField
              multiline
              rows={3}
              margin="dense"
              name="address"
              placeholder={t("CommonField.address")}
              type="address"
              fullWidth
              variant="outlined"
              value={formik.values.address}
              onChange={formik.handleChange}
            />
          </DialogContent>

          <DialogActions>
            <Button onClick={handleClose}>{t("Common.cancel")}</Button>
            <Button type="submit">{t("Common.done")}</Button>
          </DialogActions>
        </form>
      </Dialog>
    </>
  );
};
