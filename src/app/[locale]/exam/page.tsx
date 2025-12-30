"use client";

import { ExamResponse, ModeType } from "@/app/constants/type";
import AddExamCard from "@/app/dashboard/components/AddExamCard";
import ExamForm from "@/app/dashboard/components/Common/ExamForm";
import ExamFormModify from "@/app/dashboard/components/Common/ExamFormModify";
import ExamListCard from "@/app/dashboard/components/Common/ExamListCard";
import HighlightedCard from "@/app/dashboard/components/HighlightedCard";
import { classroomAtom } from "@/app/libs/jotai/classroomAtom";
import { ScreenExamAtom } from "@/app/libs/jotai/commonAtom";
import ExamService from "@/app/service/ExamService";
import { Box, Grid, Typography } from "@mui/material";
import { useAtom, useAtomValue } from "jotai";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function Page() {
  const classroom = useAtomValue(classroomAtom);
  const router = useRouter();
  const searchParams = useSearchParams();

  const [activeView, setActiveView] = useAtom(ScreenExamAtom);
  const [exams, setExams] = useState<ExamResponse[]>([]);
  const [exam, setExam] = useState<ExamResponse>();

  // Get screen from URL query
  const queryScreen = searchParams.get("screen") as ModeType | null;

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
    else setExams([])
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
          <Grid
            container
            spacing={2}
            columns={12}
            sx={{ mb: (theme) => theme.spacing(2) }}
          >
            <Grid size={{ xs: 12, md: 3, sm: 6 }}>
              <AddExamCard />
            </Grid>

            {exams.map((row) => (
              <Grid size={{ xs: 12, md: 3, sm: 6 }} key={row.id}>
                <ExamListCard row={row} setExam={setExam} handleGetExams={handleGetExams} />
              </Grid>
            ))}
          </Grid>
        );
      case "create":
        return <ExamForm />;
      case "modify":
        return <ExamForm exam={exam} />;
      default:
        return null;
    }
  };

  return (
    <>
      <Box sx={{ width: "100%", maxWidth: { sm: "100%", md: "1700px" } }}>
        <Typography
          component="h2"
          variant="h6"
          sx={{ mb: 2, display: { xs: "none", sm: "block" } }}
        >
          Overview
        </Typography>

        {renderComponent()}
      </Box>
    </>
  );
}
