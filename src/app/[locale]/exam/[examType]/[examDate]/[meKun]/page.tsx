"use client";

import { HonorRollChart } from "@/app/dashboard/components/examType/HonorRollChart";
import { MonthlyNsemesterGrid } from "@/app/dashboard/components/examType/MonthlyNsemesterGrid";
import { SemesterlyAverageGrid } from "@/app/dashboard/components/examType/SemesterlyAverageGrid";
import { SemesterlyGrid } from "@/app/dashboard/components/examType/SemesterlyGrid";
import EmptyStateCard from "@/app/dashboard/components/Common/EmptyStateCard";
import {
  classroomAtom,
  examAtom,
  top5StudentsAtom,
} from "@/app/libs/jotai/classroomAtom";
import {
  Avatar,
  Box,
  Button,
  Card,
  Chip,
  Divider,
  Stack,
  Tab,
  Tabs,
  Typography,
  alpha,
  useTheme,
} from "@mui/material";
import { useAtomValue, useSetAtom } from "jotai";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { use, useMemo, useState } from "react";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import EventNoteIcon from "@mui/icons-material/EventNote";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import EventAvailableIcon from "@mui/icons-material/EventAvailable";
import StarsIcon from "@mui/icons-material/Stars";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import AssessmentIcon from "@mui/icons-material/Assessment";
import LeaderboardIcon from "@mui/icons-material/Leaderboard";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import WorkspacePremiumIcon from "@mui/icons-material/WorkspacePremium";

type Params = {
  examType: string;
  examDate: string;
  meKun: number;
};

interface TabPanelProps {
  children?: React.ReactNode;
  dir?: string;
  index: number;
  value: number;
}

export default function Page({ params }: { params: Promise<Params> }) {
  const { examType, examDate, meKun } = use(params);
  const theme = useTheme();
  const t = useTranslations();
  const router = useRouter();
  const setTop5Students = useSetAtom(top5StudentsAtom);
  const exam = useAtomValue(examAtom);
  const classroom = useAtomValue(classroomAtom);

  const [showSubjects, setShowSubjects] = useState<boolean>(true);
  const [tabValue, setTabValue] = useState(0);

  const isMonthly = examType === "monthly";
  const isSemester = examType === "semester";

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setShowSubjects(newValue === 0);
    setTabValue(newValue);
  };

  const handleProcessedRowsChange = (rows: any[]) => {
    if (!rows || rows.length === 0) {
      setTop5Students([]);
      return;
    }
    const rankingField = isSemester ? "tRanking" : "mRanking";
    const top5 = rows
      .filter((row) => {
        const val = row[rankingField];
        return val && val >= 1 && val <= 5;
      })
      .sort((a, b) => a[rankingField] - b[rankingField])
      .slice(0, 5);
    setTop5Students(top5);
  };

  const formattedMonthYear = useMemo(() => {
    // examDate is "MMYYYY" (e.g. "122025" -> Dec 2025). Parse manually
    // because dayjs needs the customParseFormat plugin to honor format strings.
    if (!/^\d{6}$/.test(examDate)) return examDate;
    const monthIdx = parseInt(examDate.slice(0, 2), 10) - 1;
    const year = examDate.slice(2);
    const monthAbbrs = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    if (monthIdx < 0 || monthIdx > 11) return examDate;
    return `${t(`Common.months.${monthAbbrs[monthIdx]}`)} ${year}`;
  }, [examDate, t]);

  const examTitle = useMemo(() => {
    if (exam?.title) return exam.title;
    const examTypeLabel = isSemester ? t("Common.semester") : t("Common.monthly");
    return t("Common.examTitleTemplate", {
      examType: examTypeLabel,
      monthYear: formattedMonthYear,
    });
  }, [exam?.title, isSemester, formattedMonthYear, t]);

  const accent = isSemester
    ? theme.palette.warning.main
    : theme.palette.info.main;

  const handleBack = () => {
    router.push("/exam?screen=default");
  };

  if (!classroom?.id) {
    return (
      <Box sx={{ width: "100%", maxWidth: { sm: "100%", md: "1700px" } }}>
        <Card variant="outlined" sx={{ p: 4 }}>
          <EmptyStateCard
            title={t("Common.classroom")}
            description={t("Common.createClassroom")}
            buttonLabel={t("Common.back")}
            onButtonClick={handleBack}
            minHeight={320}
          />
        </Card>
      </Box>
    );
  }

  const monthlyTabs = [
    {
      icon: <AssessmentIcon fontSize="small" />,
      label: t("MonthlyExam.monthlyScores"),
    },
    {
      icon: <LeaderboardIcon fontSize="small" />,
      label: t("MonthlyExam.viewRanking"),
    },
    {
      icon: <WorkspacePremiumIcon fontSize="small" />,
      label: t("MonthlyExam.viewHonorRollChart"),
    },
  ];

  const semesterTabs = [
    {
      icon: <AssessmentIcon fontSize="small" />,
      label: t("SemesterExam.semesterScores", {
        num: exam?.semesterNumber || "",
      }),
    },
    {
      icon: <LeaderboardIcon fontSize="small" />,
      label: t("SemesterExam.semesterlyAverageRanking", {
        num: exam?.semesterNumber || "",
      }),
    },
    {
      icon: <EmojiEventsIcon fontSize="small" />,
      label: t("SemesterExam.viewRanking", {
        num: exam?.semesterNumber || "",
      }),
    },
    {
      icon: <WorkspacePremiumIcon fontSize="small" />,
      label: t("MonthlyExam.viewHonorRollChart"),
    },
  ];

  const tabsToRender = isSemester ? semesterTabs : monthlyTabs;

  return (
    <Box sx={{ width: "100%", maxWidth: { sm: "100%", md: "1700px" } }}>
      {/* Page header */}
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
              bgcolor: alpha(accent, 0.12),
              color: accent,
              width: 44,
              height: 44,
            }}
          >
            <EventNoteIcon />
          </Avatar>
          <Box sx={{ minWidth: 0 }}>
            <Typography
              variant="h5"
              sx={{ fontWeight: 700, lineHeight: 1.2 }}
              noWrap
            >
              {examTitle}
            </Typography>
            <Typography variant="body2" color="text.secondary" noWrap>
              {[classroom?.name, classroom?.grade, classroom?.year]
                .filter(Boolean)
                .join(" • ")}
            </Typography>
          </Box>
        </Stack>

        <Button
          variant="outlined"
          size="small"
          startIcon={<ArrowBackIcon />}
          onClick={handleBack}
        >
          {t("Common.back")}
        </Button>
      </Stack>

      {/* Exam info strip */}
      <Card
        variant="outlined"
        sx={{
          mb: 3,
          position: "relative",
          overflow: "hidden",
          "&::before": {
            content: '""',
            position: "absolute",
            inset: 0,
            height: 4,
            background: accent,
          },
        }}
      >
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={{ xs: 1.5, sm: 3 }}
          alignItems={{ xs: "flex-start", sm: "center" }}
          flexWrap="wrap"
          useFlexGap
          sx={{ p: 2, pt: 2.5, rowGap: 1.5 }}
        >
          <Chip
            icon={
              isSemester ? (
                <EventAvailableIcon sx={{ fontSize: 16 }} />
              ) : (
                <CalendarMonthIcon sx={{ fontSize: 16 }} />
              )
            }
            label={
              isSemester ? t("Common.semester") : t("Common.monthly")
            }
            size="small"
            sx={{
              bgcolor: alpha(accent, 0.12),
              color: accent,
              border: `1px solid ${alpha(accent, 0.25)}`,
              "& .MuiChip-icon": { color: accent },
              fontWeight: 600,
            }}
          />

          <Stack direction="row" alignItems="center" spacing={0.75}>
            <CalendarMonthIcon
              fontSize="small"
              sx={{ color: "text.secondary" }}
            />
            <Typography variant="body2" color="text.secondary">
              {formattedMonthYear}
            </Typography>
          </Stack>

          {exam?.time ? (
            <Stack direction="row" alignItems="center" spacing={0.75}>
              <AccessTimeIcon
                fontSize="small"
                sx={{ color: "text.secondary" }}
              />
              <Typography variant="body2" color="text.secondary">
                {String(exam.time).slice(0, 5)}
              </Typography>
            </Stack>
          ) : null}

          <Chip
            size="small"
            icon={<StarsIcon sx={{ fontSize: 14 }} />}
            label={`${t("Common.mekun")} · ${meKun}`}
            sx={{
              bgcolor: alpha(theme.palette.warning.main, 0.1),
              color: theme.palette.warning.dark,
              "& .MuiChip-icon": { color: theme.palette.warning.main },
              fontWeight: 600,
            }}
          />

          {isSemester && exam?.semesterNumber ? (
            <Chip
              size="small"
              label={t("Common.semesterNum", {
                num: exam.semesterNumber,
              })}
              sx={{
                bgcolor: alpha(theme.palette.success.main, 0.1),
                color: theme.palette.success.dark,
                fontWeight: 600,
              }}
            />
          ) : null}
        </Stack>
      </Card>

      {/* Tabs in card */}
      <Card variant="outlined">
        <Box
          sx={{
            borderBottom: 1,
            borderColor: "divider",
            px: { xs: 1, sm: 2 },
          }}
        >
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            indicatorColor="primary"
            textColor="primary"
            variant="scrollable"
            scrollButtons="auto"
            allowScrollButtonsMobile
            aria-label="exam detail tabs"
            sx={{
              "& .MuiTab-root": {
                textTransform: "none",
                fontWeight: 600,
                minHeight: 56,
              },
            }}
          >
            {tabsToRender.map((tab, idx) => (
              <Tab
                key={idx}
                icon={tab.icon}
                iconPosition="start"
                label={tab.label}
                {...a11yProps(idx)}
              />
            ))}
          </Tabs>
        </Box>

        <Divider />

        <Box sx={{ p: { xs: 1.5, sm: 2 } }}>
          {/* Tab 0: scores */}
          <TabPanel value={tabValue} index={0} dir={theme.direction}>
            {tabValue === 0 && isMonthly ? (
              <MonthlyNsemesterGrid
                examDate={examDate}
                examType={examType}
                meKun={meKun}
                showSubjects={showSubjects}
                onProcessedRowsChange={handleProcessedRowsChange}
              />
            ) : (
              <SemesterlyGrid
                examDate={examDate}
                examType={examType}
                meKun={meKun}
                onProcessedRowsChange={handleProcessedRowsChange}
              />
            )}
          </TabPanel>

          {/* Tab 1: ranking / semester average */}
          <TabPanel value={tabValue} index={1} dir={theme.direction}>
            {tabValue === 1 && isMonthly ? (
              <MonthlyNsemesterGrid
                examDate={examDate}
                examType={examType}
                meKun={meKun}
                showSubjects={showSubjects}
                onProcessedRowsChange={handleProcessedRowsChange}
              />
            ) : (
              <SemesterlyAverageGrid
                examDate={examDate}
                examType={examType}
                isShow={false}
                onProcessedRowsChange={handleProcessedRowsChange}
              />
            )}
          </TabPanel>

          {/* Tab 2: semester ranking (semester only) */}
          {isSemester && (
            <TabPanel value={tabValue} index={2} dir={theme.direction}>
              {tabValue === 2 && (
                <SemesterlyAverageGrid
                  examDate={examDate}
                  examType={examType}
                  isShow={true}
                  onProcessedRowsChange={handleProcessedRowsChange}
                />
              )}
            </TabPanel>
          )}

          {/* Honor Roll: tab 2 for monthly, tab 3 for semester */}
          <TabPanel
            value={tabValue}
            index={isMonthly ? 2 : 3}
            dir={theme.direction}
          >
            {tabValue === (isMonthly ? 2 : 3) && <HonorRollChart />}
          </TabPanel>
        </Box>
      </Card>
    </Box>
  );
}

function a11yProps(index: number) {
  return {
    id: `full-width-tab-${index}`,
    "aria-controls": `full-width-tabpanel-${index}`,
  };
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`full-width-tabpanel-${index}`}
      aria-labelledby={`full-width-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 2 }}>{children}</Box>}
    </div>
  );
}
