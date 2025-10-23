import { useTranslations } from "next-intl";
import { insertOneStuSchema } from "../formik/ValidationSchema";
import { useMemo } from "react";

// Custom hook to provide the schema with translations
export const useInsertOneStutSchema = () => {
  const t = useTranslations("CommonValidate");
  return useMemo(() => insertOneStuSchema(t), [t]);
};