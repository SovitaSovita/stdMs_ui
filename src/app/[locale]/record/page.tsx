"use client";

import React, { useCallback, useEffect } from "react";
import {
  examAtom,
  classroomAtom,
  top5StudentsAtom,
} from "@/app/libs/jotai/classroomAtom";
import { Box, Tab, Tabs, Typography, useTheme } from "@mui/material";
import { useAtomValue, useSetAtom } from "jotai";
import { useTranslations } from "next-intl";
import { useState } from "react";
import useNotifications from "@/app/libs/hooks/useNotifications/useNotifications";
import AnnualReport from "@/app/dashboard/components/annual/AnnualReport";
import { HonorRollChart } from "@/app/dashboard/components/examType/HonorRollChart";
import { StudentAnnualAvgResponse } from "@/app/constants/type";
import ClassroomService from "@/app/service/ClassroomService";
import { BookRecordResponse } from "@/app/constants/type/Record";

export default function page() {
  const t = useTranslations();
  const exam = useAtomValue(examAtom);

  const [rows, setRows] = useState<BookRecordResponse>();
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const classroom = useAtomValue(classroomAtom);
  const notification = useNotifications();

  const fetchBookRecord = useCallback(async () => {
    try {
      if (!classroom?.id) return;
      setIsLoading(true);
      const request = {
        classId: classroom.id,
        stuId: "0aef5d91-b408-4849-8f98-3d9992917d4e",
      };
      const result = await ClassroomService.getBookRocord(request);
      if (result) {
        setRows(result);
      }
    } catch {
      // swallow – we just show “no data”
    } finally {
      setIsLoading(false);
    }
  }, [classroom?.id]);

  useEffect(() => {
    if (classroom) {
      fetchBookRecord();
    }
  }, [fetchBookRecord, classroom?.id]);

  console.log("rows >>", rows);

  return (
    <>
      <Box sx={{ width: "100%", maxWidth: { sm: "100%", md: "1700px" } }}>
        <div className="flex justify-between">
          <Typography
            component="h2"
            variant="h6"
            sx={{ mb: 2, textTransform: "capitalize" }}
          >
            {t("BookRecord.title")}
          </Typography>
        </div>

        <Box></Box>
      </Box>
    </>
  );
}
