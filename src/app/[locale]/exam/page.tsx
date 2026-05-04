"use client";

import { ExamResponse, ModeType } from "@/app/constants/type";
import ExamForm from "@/app/dashboard/components/Common/ExamForm";
import ExamListCard from "@/app/dashboard/components/Common/ExamListCard";
import EmptyStateCard from "@/app/dashboard/components/Common/EmptyStateCard";
import {
  classroomAtom,
  examAtom,
  examsAtom,
} from "@/app/libs/jotai/classroomAtom";
import { ScreenExamAtom } from "@/app/libs/jotai/commonAtom";
import ExamService from "@/app/service/ExamService";
import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Grid,
  Stack,
  Typography,
  alpha,
  useTheme,
} from "@mui/material";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import AddIcon from "@mui/icons-material/Add";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import SchoolIcon from "@mui/icons-material/School";
import EventNoteIcon from "@mui/icons-material/EventNote";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import EventAvailableIcon from "@mui/icons-material/EventAvailable";
import EditIcon from "@mui/icons-material/Edit";
import { useTranslations } from "next-intl";

type StatTone = "primary" | "info" | "secondary" | "success" | "warning";
type ExamFilter = "ALL" | "MONTHLY" | "SEMESTER";

function ExamStatCard({
  label,
  value,
  icon,
  tone,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  tone: StatTone;
}) {
  const theme = useTheme();
  const color = theme.palette[tone].main;

  return (
    <Card
      variant="outlined"
      sx={{
        height: "100%",
        position: "relative",
        overflow: "hidden",
        transition: "transform .2s ease, box-shadow .2s ease",
        "&:hover": {
          transform: "translateY(-2px)",
          boxShadow: theme.shadows[3],
        },
      }}
    >
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          background: `linear-gradient(135deg, ${alpha(color, 0.12)} 0%, ${alpha(
            color,
            0
          )} 60%)`,
          pointerEvents: "none",
        }}
      />
      <CardContent sx={{ position: "relative" }}>
        <Stack direction="row" alignItems="center" spacing={2}>
          <Avatar
            sx={{
              bgcolor: alpha(color, 0.15),
              color,
              width: 48,
              height: 48,
            }}
          >
            {icon}
          </Avatar>
          <Box>
            <Typography variant="body2" color="text.secondary">
              {label}
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 700, lineHeight: 1.1 }}>
              {value}
            </Typography>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}

export default function Page() {
  const classroom = useAtomValue(classroomAtom);
  const router = useRouter();
  const t = useTranslations();
  const theme = useTheme();
  const searchParams = useSearchParams();

  const [activeView, setActiveView] = useAtom(ScreenExamAtom);
  const [exams, setExams] = useAtom(examsAtom);
  const setExam = useSetAtom(examAtom);
  const [filter, setFilter] = useState<ExamFilter>("ALL");

  const queryScreen = searchParams.get("screen") as ModeType | null;

  useEffect(() => {
    if (!queryScreen) {
      setActiveView("default");
      router.replace("?screen=default", { scroll: false });
    }
  }, []);

  useEffect(() => {
    if (queryScreen && queryScreen !== activeView) {
      setActiveView(queryScreen);
    }
  }, [queryScreen]);

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
    setExams(result?.length ? result : []);
  };

  useEffect(() => {
    if (classroom && activeView === "default") {
      handleGetExams();
    }
  }, [classroom, activeView]);

  const stats = useMemo(() => {
    const monthly = exams.filter((e) => e.examType === "MONTHLY").length;
    const semester = exams.filter((e) => e.examType === "SEMESTER").length;
    return {
      total: exams.length,
      monthly,
      semester,
    };
  }, [exams]);

  const filteredExams = useMemo(() => {
    if (filter === "ALL") return exams;
    return exams.filter((e) => e.examType === filter);
  }, [exams, filter]);

  const handleCreate = () => {
    setActiveView("create");
    setExam({} as ExamResponse);
    router.push("?screen=create");
  };

  const handleBackToList = () => {
    setActiveView("default");
    router.push("?screen=default");
  };

  if (!classroom?.id) {
    return (
      <Box sx={{ width: "100%", maxWidth: { sm: "100%", md: "1700px" } }}>
        <Card variant="outlined" sx={{ p: 4 }}>
          <EmptyStateCard
            title={t("Common.classroom")}
            description={t("Common.createClassroom")}
            buttonLabel={t("Common.createClassroom")}
            onButtonClick={() => {}}
            minHeight={320}
          />
        </Card>
      </Box>
    );
  }

  const PageHeader = (
    <Stack
      direction={{ xs: "column", sm: "row" }}
      alignItems={{ xs: "flex-start", sm: "center" }}
      justifyContent="space-between"
      spacing={1}
      sx={{ mb: 3 }}
    >
      <Stack direction="row" alignItems="center" spacing={1.5}>
        <Avatar
          sx={{
            bgcolor: alpha(theme.palette.primary.main, 0.12),
            color: "primary.main",
            width: 44,
            height: 44,
          }}
        >
          <SchoolIcon />
        </Avatar>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
            {t("Exam.title")}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {[classroom?.name, classroom?.grade, classroom?.year]
              .filter(Boolean)
              .join(" • ")}
          </Typography>
        </Box>
      </Stack>

      {activeView === "default" && (
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleCreate}
        >
          {t("Exam.createExam")}
        </Button>
      )}
    </Stack>
  );

  const renderDefault = () => (
    <>
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 4 }}>
          <ExamStatCard
            label={t("Exam.title")}
            value={String(stats.total).padStart(2, "0")}
            icon={<EventNoteIcon />}
            tone="primary"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <ExamStatCard
            label={t("Common.monthly")}
            value={String(stats.monthly).padStart(2, "0")}
            icon={<CalendarMonthIcon />}
            tone="info"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <ExamStatCard
            label={t("Common.semester")}
            value={String(stats.semester).padStart(2, "0")}
            icon={<EventAvailableIcon />}
            tone="warning"
          />
        </Grid>
      </Grid>

      {/* Filter chips */}
      {exams.length > 0 && (
        <Stack
          direction="row"
          spacing={1}
          sx={{ mb: 2, flexWrap: "wrap", rowGap: 1 }}
        >
          <Chip
            label={`${t("Common.total")}  ·  ${stats.total}`}
            color={filter === "ALL" ? "primary" : "default"}
            variant={filter === "ALL" ? "filled" : "outlined"}
            onClick={() => setFilter("ALL")}
            sx={{ fontWeight: 600 }}
          />
          <Chip
            icon={<CalendarMonthIcon sx={{ fontSize: 16 }} />}
            label={`${t("Common.monthly")}  ·  ${stats.monthly}`}
            color={filter === "MONTHLY" ? "info" : "default"}
            variant={filter === "MONTHLY" ? "filled" : "outlined"}
            onClick={() => setFilter("MONTHLY")}
            sx={{ fontWeight: 600 }}
          />
          <Chip
            icon={<EventAvailableIcon sx={{ fontSize: 16 }} />}
            label={`${t("Common.semester")}  ·  ${stats.semester}`}
            color={filter === "SEMESTER" ? "warning" : "default"}
            variant={filter === "SEMESTER" ? "filled" : "outlined"}
            onClick={() => setFilter("SEMESTER")}
            sx={{ fontWeight: 600 }}
          />
        </Stack>
      )}

      <ExamListCard examsOverride={filteredExams} />
    </>
  );

  const renderForm = (mode: "create" | "modify") => {
    const title =
      mode === "create" ? t("Exam.createExam") : t("Exam.editExam");
    const Icon = mode === "create" ? AddIcon : EditIcon;
    return (
      <Card variant="outlined">
        <CardContent
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 1.5,
            pb: 1.5,
          }}
        >
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <Avatar
              sx={{
                bgcolor: alpha(theme.palette.primary.main, 0.12),
                color: "primary.main",
                width: 36,
                height: 36,
              }}
            >
              <Icon fontSize="small" />
            </Avatar>
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                {title}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {[classroom?.name, classroom?.grade, classroom?.year]
                  .filter(Boolean)
                  .join(" • ")}
              </Typography>
            </Box>
          </Stack>
          <Button
            variant="text"
            size="small"
            startIcon={<ArrowBackIcon />}
            onClick={handleBackToList}
          >
            {t("Common.back")}
          </Button>
        </CardContent>
        <Divider />
        <Box sx={{ p: { xs: 2, sm: 3 } }}>
          <ExamForm />
        </Box>
      </Card>
    );
  };

  const renderComponent = () => {
    switch (activeView) {
      case "default":
        return renderDefault();
      case "create":
        return renderForm("create");
      case "modify":
        return renderForm("modify");
      default:
        return null;
    }
  };

  return (
    <Box sx={{ width: "100%", maxWidth: { sm: "100%", md: "1700px" } }}>
      {PageHeader}
      {renderComponent()}
    </Box>
  );
}
