import { useTranslations } from "next-intl";
import { insertOneStuSchema, upsertClassSchema, upsertExamSchema, upsertSubjectSchema } from "../formik/ValidationSchema";
import { useMemo } from "react";

// Custom hook to provide the schema with translations
export const useInsertOneStutSchema = () => {
  const t = useTranslations("CommonValidate");
  return useMemo(() => insertOneStuSchema(t), [t]);
};

export const useUpsertExamSchema = () => {
  const t = useTranslations("CommonValidate");
  return useMemo(() => upsertExamSchema(t), [t]);
};

export const useUpsertClassSchema = () => {
  const t = useTranslations("CommonValidate");
  return useMemo(() => upsertClassSchema(t), [t]);
};

export const useUpsertSubjectSchema = () => {
  const t = useTranslations("CommonValidate");
  return useMemo(() => upsertSubjectSchema(t), [t]);
};