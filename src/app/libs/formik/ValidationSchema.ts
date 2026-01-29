import { useTranslations } from "next-intl";
import { useMemo } from "react";
import * as Yup from "yup";

export const insertOneStuSchema = (t: (key: string) => string) =>
  Yup.object({
    fullName: Yup.string().required(t("require")).min(2, t("minText2")),
    gender: Yup.string().required(t("require")),
    // dateOfBirth: Yup.string().required(t("require")),
    // fatherName: Yup.string().required(t("require")),
    // fatherOccupation: Yup.string().required(t("require")),
    // montherName: Yup.string().required(t("require")),
    // montherOccupation: Yup.string().required(t("require")),
    // placeOfBirth: Yup.string().required(t("require")),
    // address: Yup.string().required(t("require")),
  });

export const upsertExamSchema = (t: (key: string) => string) =>
  Yup.object({
    title: Yup.string().required(t("require")).min(2, t("minText2")),
    examType: Yup.string().required(t("require")),
    examDate: Yup.string().required(t("require")),
  });

export const upsertClassSchema = (t: (key: string) => string) =>
  Yup.object({
    name: Yup.string().required(t("require")).min(2, t("minText2")),
    grade: Yup.string().required(t("require")),
    year: Yup.string().required(t("require")),
    startYear: Yup.string().required(t("require")),
    endYear: Yup.string().required(t("require")),
  });

export const upsertSubjectSchema = (t: (key: string) => string) =>
  Yup.object({
    name: Yup.string().required(t("require")),
    nameKh: Yup.string().required(t("require")),
  });
