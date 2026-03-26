"use client";

import React, { useCallback, useEffect } from "react";
import {
  examAtom,
  classroomAtom,
  top5StudentsAtom,
  studentsAtom,
} from "@/app/libs/jotai/classroomAtom";
import { Box, Tab, Tabs, Typography, useTheme } from "@mui/material";
import { useAtomValue, useSetAtom } from "jotai";
import { useTranslations } from "next-intl";
import { useState } from "react";
import useNotifications from "@/app/libs/hooks/useNotifications/useNotifications";
import AnnualReport from "@/app/dashboard/components/annual/AnnualReport";
import { HonorRollChart } from "@/app/dashboard/components/examType/HonorRollChart";
import {
  StudentsInfo,
  StudyBookTrackerResponse,
} from "@/app/constants/type";
import ClassroomService from "@/app/service/ClassroomService";
import { BookRecordResponse } from "@/app/constants/type/Record";
import useClassroomData from "@/app/libs/hooks/useClassroomData";

export default function page() {
  const t = useTranslations();
  const exam = useAtomValue(examAtom);

  const [rows, setRows] = useState<StudyBookTrackerResponse>();
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const classroom = useAtomValue(classroomAtom);
  const notification = useNotifications();
  const { students, subjects, exams } = useClassroomData(classroom);

  const fetchBookTracker = useCallback(async (stuId: string, examId: string) => {
    try {
      if (!classroom?.id) return;
      setIsLoading(true);
      const request = {
        classId: classroom.id,
        stuId: stuId,
        examId: examId,
      };
      const result = await ClassroomService.getBookTracker(request);
      if (result) {
        setRows(result);
      }
    } catch {
      // swallow – we just show “no data”
    } finally {
      setIsLoading(false);
    }
  }, [classroom?.id]);

  console.log("rows >>", rows);

  const handleClickStudentDetail = (stuId: string) => {
    fetchBookTracker(stuId, "607f85b1-e2be-4c6c-8f2e-09bf8dfb507e")
  }

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

        <Box display={"flex"} justifyContent={"space-between"}>
          <Box>
            {students?.student?.map((stu) => (
              <div key={stu?.id} className="cursor-pointer py-2" onClick={() => handleClickStudentDetail(stu.id)}>{stu?.fullName}</div>
            ))}
          </Box>

          <Box>
              <div>Exam name : {rows?.exam.title}</div>
              <div>Student Name : {rows?.student?.fullName}</div>
              <div>{rows?.subjects.map((sub) => (
                <div key={sub.id} className="border-y border p-2">
                  <div>Subject name : {sub.name}</div>
                  <div>max score : {sub.maxScore || 0}</div>
                  <div>score : {sub.score || 0}</div>
                </div>
              ))}
              </div>
              <div>Total Score : {rows?.totalScore}</div>
              <div>Total Avg : {rows?.totalAverage}</div>
              <div>Grade : {rows?.grade}</div>
          </Box>
        </Box>
      </Box>
    </>
  );
}
