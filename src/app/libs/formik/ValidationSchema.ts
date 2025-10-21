import * as Yup from "yup";

export const insertOneStuSchema = Yup.object({
  fullName: Yup.string()
    .required("ឈ្មោះពេញ ត្រូវបានទាមទារ")
    .min(2, "ឈ្មោះពេញ ត្រូវមានយ៉ាងហោចណាស់ ២ តួអក្សរ"),
  gender: Yup.string().required("ភេទ ត្រូវបានទាមទារ"),
  dateOfBirth: Yup.string().required("ត្រូវបានទាមទារ"),
  fatherName: Yup.string().required("ត្រូវបានទាមទារ"),
  fatherOccupation: Yup.string().required("ត្រូវបានទាមទារ"),
  montherName: Yup.string().required("ត្រូវបានទាមទារ"),
  montherOccupation: Yup.string().required("ត្រូវបានទាមទារ"),
  placeOfBirth: Yup.string().required("ត្រូវបានទាមទារ"),
  address: Yup.string().required("ត្រូវបានទាមទារ"),
});
