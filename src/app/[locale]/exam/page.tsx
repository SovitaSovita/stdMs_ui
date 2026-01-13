"use client";

import { ExamResponse, ModeType } from "@/app/constants/type";
import ExamForm from "@/app/dashboard/components/Common/ExamForm";
import ExamListCard from "@/app/dashboard/components/Common/ExamListCard";
import { classroomAtom, examsAtom } from "@/app/libs/jotai/classroomAtom";
import { ScreenExamAtom } from "@/app/libs/jotai/commonAtom";
import ExamService from "@/app/service/ExamService";
import { Box, Button, Grid, Typography } from "@mui/material";
import { useAtom, useAtomValue } from "jotai";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import AddIcon from "@mui/icons-material/Add";
import { useTranslations } from "next-intl";

export default function Page() {
  const classroom = useAtomValue(classroomAtom);
  const router = useRouter();
  const t = useTranslations();
  const searchParams = useSearchParams();

  const [activeView, setActiveView] = useAtom(ScreenExamAtom);
  const [exams, setExams] = useAtom(examsAtom);

  // Get screen from URL query
  const queryScreen = searchParams.get("screen") as ModeType | null;

  useEffect(() => {
    if (!queryScreen) {
      setActiveView("default");
      router.replace("?screen=default", { scroll: false });
    }
  }, []);

  // Sync URL to state on mount and query change
  useEffect(() => {
    if (queryScreen && queryScreen !== activeView) {
      setActiveView(queryScreen);
    }
  }, [queryScreen]);

  // Sync state to URL when activeView changes
  useEffect(() => {
    const currentQuery = searchParams.get("screen");

    if (activeView !== currentQuery) {
      const params = new URLSearchParams(searchParams.toString());
      params.set("screen", activeView);
      router.push(`?${params.toString()}`, { scroll: false });
    }
  }, [activeView]);

  const handleGetExams = async () => {
    const id = classroom?.id;
    if (!id) return;
    const result = await ExamService.getByClassId(id);
    if (result.length > 0) setExams(result);
    else setExams([]);
  };

  useEffect(() => {
    if (classroom && activeView === "default") {
      handleGetExams();
    }
  }, [classroom, activeView]);

  const renderComponent = () => {
    switch (activeView) {
      case "default":
        return (
          <>
            <Box
              display={"flex"}
              mb={2}
              gap={1}
              justifyContent={"space-between"}
              alignItems={"center"}
            >
              <Typography
                component="h2"
                variant="h6"
                sx={{ display: { xs: "none", sm: "block" } }}
              >
                Exam Overview
              </Typography>
              <Button
                variant="contained"
                size="small"
                startIcon={<AddIcon />}
                sx={{ mt: 1 }}
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveView("create");
                  router.push("?screen=create");
                }}
              >
                Create Exam
              </Button>
            </Box>

            <Grid
              container
              spacing={2}
              columns={12}
              sx={{ mb: (theme) => theme.spacing(2) }}
            >
              <ExamListCard />
            </Grid>
          </>
        );
      case "create":
        return (
          <>
            <Box
              display={"flex"}
              mb={2}
              gap={1}
              justifyContent={"space-between"}
              alignItems={"center"}
            >
              <Typography
                component="h2"
                variant="h6"
                sx={{ display: { xs: "none", sm: "block" } }}
              >
                {t("Exam.createExam")}
              </Typography>
            </Box>
            <ExamForm />
          </>
        );
      case "modify":
        return (
          <>
            <Box
              display={"flex"}
              mb={2}
              gap={1}
              justifyContent={"space-between"}
              alignItems={"center"}
            >
              <Typography
                component="h2"
                variant="h6"
                sx={{ display: { xs: "none", sm: "block" } }}
              >
                {t("Exam.editExam")}
              </Typography>
            </Box>
            <ExamForm />
          </>
        );
      default:
        return null;
    }
  };

  return (
    <>
      <Box sx={{ width: "100%", maxWidth: { sm: "100%", md: "1700px" } }}>
        {renderComponent()}
      </Box>
    </>
  );
}
