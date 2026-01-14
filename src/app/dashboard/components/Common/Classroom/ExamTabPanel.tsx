import React from "react";
import {
  Box,
  Button,
  Typography,
} from "@mui/material";
import { useTranslations } from "next-intl";
import ManageAccountsIcon from "@mui/icons-material/ManageAccounts";
import { useRouter } from "next/navigation";
import ExamListCard from "../ExamListCard";

export const ExamTabPanel = () => {
  const t = useTranslations();
  const router = useRouter();
  return (
    <>
      <Box display={"flex"} mb={2} gap={1} justifyContent={"space-between"}>
        <Typography
          component="h2"
          variant="h6"
          sx={{ display: { xs: "none", sm: "block" } }}
        >
          {t("Common.exam")}
        </Typography>
        <Button
          onClick={() => router.push("/exam")}
          variant="contained"
          size="small"
          startIcon={<ManageAccountsIcon />}
        >
          {t("Common.manage")}
        </Button>
      </Box>
      <ExamListCard enableEdit="hidden" />
    </>
  );
};
