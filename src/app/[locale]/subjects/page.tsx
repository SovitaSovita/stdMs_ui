"use client";

import {
  StudentCountType,

} from "@/app/constants/type";
import { SubjectTabPanel } from "@/app/dashboard/components/Common/Classroom/SubjectTabPanel";
import { Box, Button, Typography } from "@mui/material";
import { useTranslations } from "next-intl";

declare module "@mui/x-data-grid" {
  interface FooterPropsOverrides {
    studentInfoCount?: StudentCountType;
    extraControls?: React.ReactNode;
  }
}

export default function Page() {
  const t = useTranslations();

  return (
    <>
      <Box sx={{ width: "100%", maxWidth: { sm: "100%", md: "1700px" } }}>
        <SubjectTabPanel />
      </Box>
    </>
  );
}
