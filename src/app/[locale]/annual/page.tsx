"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  examAtom,
  classroomAtom,
  top5StudentsAtom,
} from "@/app/libs/jotai/classroomAtom";
import {
  Avatar,
  Box,
  Card,
  CardContent,
  Grid,
  Stack,
  Tab,
  Tabs,
  Typography,
  alpha,
  useTheme,
} from "@mui/material";
import { useAtomValue, useSetAtom } from "jotai";
import { useTranslations } from "next-intl";
import useNotifications from "@/app/libs/hooks/useNotifications/useNotifications";
import AnnualReport from "@/app/dashboard/components/annual/AnnualReport";
import { HonorRollChart } from "@/app/dashboard/components/examType/HonorRollChart";
import EmptyStateCard from "@/app/dashboard/components/Common/EmptyStateCard";
import { StudentAnnualAvgResponse } from "@/app/constants/type";
import ClassroomService from "@/app/service/ClassroomService";
import SchoolIcon from "@mui/icons-material/School";
import GroupsIcon from "@mui/icons-material/Groups";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import AssessmentIcon from "@mui/icons-material/Assessment";
import LeaderboardIcon from "@mui/icons-material/Leaderboard";
import WorkspacePremiumIcon from "@mui/icons-material/WorkspacePremium";

interface TabPanelProps {
  children?: React.ReactNode;
  dir?: string;
  index: number;
  value: number;
}

type StatTone = "primary" | "info" | "secondary" | "success" | "warning";

function AnnualStatCard({
  label,
  value,
  helper,
  icon,
  tone,
}: {
  label: string;
  value: string | number;
  helper?: string;
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
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="body2" color="text.secondary" noWrap>
              {label}
            </Typography>
            <Typography
              variant="h4"
              sx={{ fontWeight: 700, lineHeight: 1.1 }}
              noWrap
            >
              {value}
            </Typography>
            {helper && (
              <Typography variant="caption" color="text.secondary" noWrap>
                {helper}
              </Typography>
            )}
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}

export default function Page() {
  const t = useTranslations();
  const theme = useTheme();
  const setTop5Students = useSetAtom(top5StudentsAtom);
  const [tabValue, setTabValue] = useState(0);
  const exam = useAtomValue(examAtom);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const [rows, setRows] = useState<StudentAnnualAvgResponse[]>([]);
  const [, setIsLoading] = useState<boolean>(false);

  const classroom = useAtomValue(classroomAtom);
  const notification = useNotifications();

  const handleProcessedRowsChange = useCallback(
    (rows: StudentAnnualAvgResponse[]) => {
      if (!rows || rows.length === 0) {
        setTop5Students([]);
        return;
      }
      const rankingField = "annualRanking";
      const top5 = rows
        .filter((row) => {
          const val = row[rankingField];
          return typeof val === "number" && val >= 1 && val <= 5;
        })
        .sort((a, b) => a[rankingField] - b[rankingField])
        .slice(0, 5);
      setTop5Students(top5 as any);
    },
    [setTop5Students]
  );

  const fetchAnnual = useCallback(async () => {
    try {
      if (!classroom?.id) return;
      setIsLoading(true);
      const result = await ClassroomService.getAnnualAvgs(classroom?.id);
      if (result) {
        setRows(result?.students ?? []);
        handleProcessedRowsChange(result?.students ?? []);
      }
    } catch {
      // swallow – we just show "no data"
    } finally {
      setIsLoading(false);
    }
  }, [classroom?.id, exam?.semesterNumber, exam?.meKunSemester, handleProcessedRowsChange]);

  useEffect(() => {
    if (classroom) {
      fetchAnnual();
    }
  }, [fetchAnnual, classroom?.id]);

  const stats = useMemo(() => {
    const totalStudents = rows.length;
    const validAverages = rows
      .map((r) => Number(r.annualAverage))
      .filter((n) => Number.isFinite(n) && n > 0);
    const classAverage =
      validAverages.length > 0
        ? validAverages.reduce((s, n) => s + n, 0) / validAverages.length
        : 0;

    const top = rows
      .filter((r) => typeof r.annualRanking === "number" && r.annualRanking >= 1)
      .sort((a, b) => a.annualRanking - b.annualRanking)[0];

    return {
      totalStudents,
      classAverage: classAverage ? classAverage.toFixed(2) : "—",
      topName: top?.fullName ?? "—",
      topScore:
        top && Number.isFinite(Number(top.annualAverage))
          ? Number(top.annualAverage).toFixed(2)
          : undefined,
    };
  }, [rows]);

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
              {t("Annual.title")}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {[classroom?.name, classroom?.grade, classroom?.year]
                .filter(Boolean)
                .join(" • ")}
            </Typography>
          </Box>
        </Stack>
      </Stack>

      {/* Stat cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 4 }}>
          <AnnualStatCard
            label={t("Common.student")}
            value={String(stats.totalStudents).padStart(2, "0")}
            icon={<GroupsIcon />}
            tone="primary"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <AnnualStatCard
            label={t("Annual.average")}
            value={stats.classAverage}
            icon={<TrendingUpIcon />}
            tone="info"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <AnnualStatCard
            label={`${t("HonorRoll.1Rank")}`}
            value={stats.topName}
            helper={stats.topScore ? `${stats.topScore} ${t("Annual.average")}` : undefined}
            icon={<EmojiEventsIcon />}
            tone="warning"
          />
        </Grid>
      </Grid>

      {/* Tabs in card */}
      <Card variant="outlined">
        <Box sx={{ borderBottom: 1, borderColor: "divider", px: { xs: 1, sm: 2 } }}>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            indicatorColor="primary"
            textColor="primary"
            variant="scrollable"
            scrollButtons="auto"
            allowScrollButtonsMobile
            aria-label="annual tabs"
            sx={{
              "& .MuiTab-root": {
                textTransform: "none",
                fontWeight: 600,
                minHeight: 56,
              },
            }}
          >
            <Tab
              icon={<AssessmentIcon fontSize="small" />}
              iconPosition="start"
              label={t("Annual.annualAverage")}
              {...a11yProps(0)}
            />
            <Tab
              icon={<LeaderboardIcon fontSize="small" />}
              iconPosition="start"
              label={t("Annual.annualAverageRanking")}
              {...a11yProps(1)}
            />
            <Tab
              icon={<WorkspacePremiumIcon fontSize="small" />}
              iconPosition="start"
              label={t("Annual.honorRoll")}
              {...a11yProps(2)}
            />
          </Tabs>
        </Box>
        <Box>
          <TabPanel value={tabValue} index={0} dir={theme.direction}>
            {rows.length > 0 ? (
              <AnnualReport isShow={true} rows={rows} />
            ) : (
              <EmptyStateCard
                title={t("Annual.title")}
                description={t("Common.errorOccurred")}
                buttonLabel={t("Common.back")}
                onButtonClick={() => {}}
                minHeight={240}
              />
            )}
          </TabPanel>
          <TabPanel value={tabValue} index={1} dir={theme.direction}>
            {rows.length > 0 ? (
              <AnnualReport isShow={false} rows={rows} />
            ) : (
              <EmptyStateCard
                title={t("Annual.annualAverageRanking")}
                description={t("Common.errorOccurred")}
                buttonLabel={t("Common.back")}
                onButtonClick={() => {}}
                minHeight={240}
              />
            )}
          </TabPanel>
          <TabPanel value={tabValue} index={2} dir={theme.direction}>
            <HonorRollChart />
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
      {value === index && <Box sx={{ p: { xs: 2, sm: 3 } }}>{children}</Box>}
    </div>
  );
}
