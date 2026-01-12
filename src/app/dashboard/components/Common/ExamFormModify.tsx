// import * as React from "react";
// import Box from "@mui/material/Box";
// import Button from "@mui/material/Button";
// import Checkbox from "@mui/material/Checkbox";
// import FormControl from "@mui/material/FormControl";
// import FormControlLabel from "@mui/material/FormControlLabel";
// import FormGroup from "@mui/material/FormGroup";
// import FormHelperText from "@mui/material/FormHelperText";
// import Grid from "@mui/material/Grid";
// import InputLabel from "@mui/material/InputLabel";
// import MenuItem from "@mui/material/MenuItem";
// import Select, { SelectChangeEvent, SelectProps } from "@mui/material/Select";
// import Stack from "@mui/material/Stack";
// import TextField from "@mui/material/TextField";
// import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
// import { DatePicker } from "@mui/x-date-pickers/DatePicker";
// import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
// import ArrowBackIcon from "@mui/icons-material/ArrowBack";
// import dayjs, { Dayjs } from "dayjs";
// import { useRouter } from "next/navigation";
// import { useAtom, useAtomValue } from "jotai";
// import { ScreenExamAtom } from "@/app/libs/jotai/commonAtom";
// import { useFormik } from "formik";
// import { useUpsertExamSchema } from "@/app/libs/hooks/Validation";
// import { classroomAtom } from "@/app/libs/jotai/classroomAtom";
// import { ExamUpsertRequest } from "@/app/constants/type";
// import CustomDatePicker from "../CustomDatePicker";
// import ExamService from "@/app/service/ExamService";
// import { showAlertAtom } from "@/app/libs/jotai/alertAtom";
// import { FormLabel } from "@mui/material";
// import { useLocale, useTranslations } from "next-intl";

// export type FormFieldValue = string | string[] | number | boolean | File | null;

// export default function ExamFormModify() {
//   const [isSubmitting, setIsSubmitting] = React.useState(false);
//   const navigate = useRouter();
//   const t = useTranslations("Common");
//   const locale = useLocale();
//   const [, showAlert] = useAtom(showAlertAtom);

//   const [activeView, setActiveView] = useAtom(ScreenExamAtom);
//   const classroom = useAtomValue(classroomAtom);
//   const validationSchema = useUpsertExamSchema();

//   const formik = useFormik({
//     initialValues: {
//       // id: "string",
//       title: "monthly ",
//       examType: "MONTHLY",
//       examDate: "",
//       classId: "",
//     },
//     validationSchema: validationSchema,
//     onSubmit: (values: ExamUpsertRequest) => {
//       handleSubmit(values);
//     },
//   });

//   const handleSubmit = React.useCallback(async (values: ExamUpsertRequest) => {
//     const sendData: ExamUpsertRequest = {
//       ...values,
//       classId: classroom?.id,
//     };
//     if (!sendData.classId) return;

//     setIsSubmitting(true);
//     try {
//       const result = await ExamService.upsert(sendData);
//       console.log(result);
//       if (result?.status == 200) {
//         showAlert({
//           message: "Created successfully.",
//           severity: "success",
//         });
//         handleBack();
//       } else {
//         showAlert({
//           message: "Failed to create",
//           severity: "error",
//         });
//       }
//     } catch (error: any) {
//       const errorMessage =
//         error?.response?.data?.detail ||
//         error?.message ||
//         "An error occurred while creating the exam";

//       showAlert({
//         message: errorMessage,
//         severity: "error",
//       });
//     } finally {
//       setIsSubmitting(false);
//     }
//   }, []);

//   const handleReset = React.useCallback(() => {
//     formik.resetForm();
//   }, []);

//   const handleBack = React.useCallback(() => {
//     setActiveView("default");
//   }, [navigate]);

//   // ------------------------------------------------------------
//   // Helper: generate the title from the current values
//   // ------------------------------------------------------------
//   const generateTitle = (examType: string, examDate: dayjs.Dayjs | null) => {
//     if (!examType || !examDate?.isValid()) return examType.toLowerCase();
//     const monthYear = examDate.format("MMMM YYYY");
//     // “MONTHLY Exam of October 2025”  or  “SEMESTER Exam of October 2025”
//     if (locale === "en") {
//       return `${examType.charAt(0)}${examType
//         .slice(1)
//         .toLowerCase()} Exam of ${monthYear}`;
//     } else {
//       return `ប្រលង${
//         examType === "SEMESTER" ? "ប្រចាំឆមាស" : "ប្រចាំខែ "
//       } នៃ ${monthYear}`;
//     }
//   };

//   return (
//     <Box
//       component="form"
//       onSubmit={formik.handleSubmit}
//       noValidate
//       autoComplete="off"
//       onReset={handleReset}
//       sx={{ width: "100%" }}
//     >
//       <FormGroup>
//         <Grid container spacing={2} sx={{ mb: 2, width: "100%" }}>
//           <Grid size={{ xs: 12, sm: 6 }} sx={{ display: "flex" }}>
//             <FormControl error={!!formik?.values.examType} fullWidth>
//               <Select
//                 value={formik?.values.examType ?? ""}
//                 onChange={(e) => {
//                   const val = e.target.value;
//                   formik.setFieldValue("examType", val);
//                   formik.setFieldTouched("examType", true);
//                   const newTitle = generateTitle(
//                     val,
//                     dayjs(formik.values.examDate)
//                   );
//                   formik.setFieldValue("title", newTitle);
//                 }}
//                 onBlur={formik.handleBlur}
//                 name="examType"
//                 defaultValue=""
//                 fullWidth
//                 variant="outlined"
//               >
//                 <MenuItem value="MONTHLY">{t("monthly")}</MenuItem>
//                 <MenuItem value="SEMESTER">{t("semester")}</MenuItem>
//               </Select>
//               <FormHelperText>{formik?.errors.examType ?? " "}</FormHelperText>
//             </FormControl>
//           </Grid>
//           <Grid size={{ xs: 12, sm: 6 }} sx={{ display: "flex" }}>
//             <CustomDatePicker
//               name="examDate"
//               label={"Exam Date"}
//               value={formik.values.examDate}
//               onChange={(val) => {
//                 formik.setFieldValue("examDate", val);
//                 formik.setFieldTouched("examDate", true);
//                 const newTitle = generateTitle(
//                   formik.values.examType,
//                   dayjs(val)
//                 );
//                 formik.setFieldValue("title", newTitle);
//               }}
//               error={formik.errors.examDate}
//               views={["month", "year"]}
//               minDate={dayjs().subtract(3, "month")}
//               maxDate={dayjs().add(3, "month")}
//             />
//           </Grid>
//           <Grid size={{ xs: 12, sm: 6 }} sx={{ display: "flex" }}>
//             <TextField
//               name="title"
//               placeholder="Exam Name"
//               fullWidth
//               variant="outlined"
//               disabled
//               value={formik.values.title}
//               onChange={formik.handleChange}
//               onBlur={formik.handleBlur}
//               error={formik.touched.title && Boolean(formik.errors.title)}
//               helperText={formik.touched.title && formik.errors.title}
//             />
//           </Grid>
//         </Grid>
//       </FormGroup>
//       <Stack direction="row" spacing={2} justifyContent="space-between">
//         <Button
//           variant="contained"
//           startIcon={<ArrowBackIcon />}
//           onClick={handleBack}
//         >
//           Back
//         </Button>
//         <Button
//           type="submit"
//           variant="contained"
//           size="medium"
//           loading={isSubmitting}
//         >
//           Create
//         </Button>
//       </Stack>
//     </Box>
//   );
// }
