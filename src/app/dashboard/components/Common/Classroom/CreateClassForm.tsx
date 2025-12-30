import * as React from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import FormGroup from "@mui/material/FormGroup";
import Grid from "@mui/material/Grid";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import dayjs, { Dayjs } from "dayjs";
import { useRouter } from "next/navigation";
import { useAtom } from "jotai";
import { useFormik } from "formik";
import { useUpsertClassSchema } from "@/app/libs/hooks/Validation";
import { ClassInitform, DialogModeType } from "@/app/constants/type";
import CustomDatePicker from "../../CustomDatePicker";
import { showAlertAtom } from "@/app/libs/jotai/alertAtom";
import { useLocale, useTranslations } from "next-intl";
import ClassroomService from "@/app/service/ClassroomService";

type CreateClassFormProps = {
  mode?: DialogModeType;
  handleClose: () => void;
};
export default function CreateClassForm(props: CreateClassFormProps) {
  const { mode, handleClose } = props;
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [classroom, setClassroom] = React.useState<ClassInitform>();
  const navigate = useRouter();
  const t = useTranslations("Classroom");
  const tCommon = useTranslations("Common");
  const locale = useLocale();
  const [, showAlert] = useAtom(showAlertAtom);
  const validationSchema = useUpsertClassSchema();

  const formik = useFormik({
    initialValues: {
      id: classroom?.id || undefined,
      name: classroom?.name || "",
      grade: classroom?.grade || "",
      year: classroom?.year || "",
      startYear: classroom?.startYear || dayjs().year().toString(),
      endYear: classroom?.endYear || dayjs().add(1, "year").year().toString(),
    },
    validationSchema: validationSchema,
    enableReinitialize: false,
    onSubmit: (values: ClassInitform) => {
      handleSubmit(values);
    },
  });

  React.useEffect(() => {
    const { startYear, endYear } = formik.values;
    if (startYear && endYear) {
      formik.setFieldValue(
        "year",
        `${startYear}-${endYear}`,
        false // avoid infinite loop
      );
    }
  }, [formik.values.startYear, formik.values.endYear]);

  const handleSubmit = React.useCallback(async (values: ClassInitform) => {
    const { startYear, endYear, ...sendData }: ClassInitform = values;

    // Include id if we're updating
    if (classroom?.id) {
      sendData.id = classroom.id;
    }

    setIsSubmitting(true);
    try {
      const result = await ClassroomService.upsert(sendData);
      if (result?.status == 200) {
        showAlert({
          message: result?.message,
          severity: "success",
        });
        handleClose();
      }
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.detail ||
        error?.message ||
        "An error occurred while creating the class";

      showAlert({
        message: errorMessage,
        severity: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  const handleReset = React.useCallback(() => {
    formik.resetForm();
  }, []);

  return (
    <Box
      component="form"
      onSubmit={formik.handleSubmit}
      noValidate
      autoComplete="off"
      onReset={handleReset}
      sx={{ width: "100%", p: 2.5 }}
    >
      <FormGroup>
        <Grid container spacing={2} sx={{ mb: 2, width: "100%" }}>
          <Grid size={{ xs: 12, sm: 6 }} sx={{ display: "flex" }}>
            <TextField
              name="name"
              placeholder={t("className")}
              fullWidth
              variant="outlined"
              value={formik.values.name}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.name && Boolean(formik.errors.name)}
              helperText={formik.touched.name && formik.errors.name}
            />
          </Grid>
          <Grid
            size={{ xs: 12, sm: 6 }}
            sx={{ display: "flex", alignItems: "self-start", gap: 1 }}
          >
            <CustomDatePicker
              name="startYear"
              label={t("startYear")}
              value={formik.values.startYear}
              onChange={(val) => {
                if (!val) return;
                formik.setFieldValue("startYear", val);
                formik.setFieldTouched("startYear", true);
              }}
              views={["year"]}
              minDate={dayjs().subtract(1, "year")}
              maxDate={dayjs().add(2, "year")}
            />

            <span className="mt-2.5"> ~ </span>
            <CustomDatePicker
              name="endYear"
              label={t("endYear")}
              value={formik.values.endYear}
              onChange={(val) => {
                if (!val) return;
                formik.setFieldValue("endYear", val);
                formik.setFieldTouched("endYear", true);
              }}
              views={["year"]}
              minDate={dayjs().subtract(1, "year")}
              maxDate={dayjs().add(3, "year")}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }} sx={{ display: "flex" }}>
            <TextField
              name="grade"
              placeholder={t("gradeName")}
              fullWidth
              type="number"
              variant="outlined"
              value={formik.values.grade}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.grade && Boolean(formik.errors.grade)}
              helperText={formik.touched.grade && formik.errors.grade}
            />
          </Grid>
        </Grid>
      </FormGroup>
      <Stack direction="row" spacing={2} justifyContent="space-between">
        <Button
          sx={{ visibility: mode === "INIT" ? "hidden" : "visible" }}
          variant="contained"
          startIcon={<ArrowBackIcon />}
          onClick={handleClose}
        >
          Back
        </Button>
        <Button
          type="submit"
          variant="contained"
          size="medium"
          color="primary"
          loading={isSubmitting}
        >
          {mode === "CREATE" || mode === "INIT" ? tCommon("create") : tCommon("update")}
        </Button>
      </Stack>
    </Box>
  );
}
