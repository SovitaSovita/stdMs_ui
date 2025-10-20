import * as Yup from "yup";

export const insertOneStuSchema = Yup.object({
  fullName: Yup.string()
    .required("ឈ្មោះពេញ ត្រូវបានទាមទារ")
    .min(2, "ឈ្មោះពេញ ត្រូវមានយ៉ាងហោចណាស់ ២ តួអក្សរ"),
  gender: Yup.string().required("ភេទ ត្រូវបានទាមទារ"),
  email: Yup.string()
    .required("អ៊ីមែល ត្រូវបានទាមទារ"),
});
