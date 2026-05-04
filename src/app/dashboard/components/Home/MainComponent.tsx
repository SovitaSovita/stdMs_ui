"use client";

import {
  Avatar,
  Box,
  Button,
  Card,
  CardActionArea,
  CardContent,
  Chip,
  Grid,
  Stack,
  Typography,
  alpha,
  useTheme,
} from "@mui/material";
import React, { useMemo } from "react";
import GroupsIcon from "@mui/icons-material/Groups";
import LibraryBooksIcon from "@mui/icons-material/LibraryBooks";
import AssignmentIcon from "@mui/icons-material/Assignment";
import WomanIcon from "@mui/icons-material/Woman";
import ManIcon from "@mui/icons-material/Man";
import AddIcon from "@mui/icons-material/Add";
import GroupAddIcon from "@mui/icons-material/GroupAdd";
import LibraryAddIcon from "@mui/icons-material/LibraryAdd";
import EventNoteIcon from "@mui/icons-material/EventNote";
import SchoolIcon from "@mui/icons-material/School";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import EventAvailableIcon from "@mui/icons-material/EventAvailable";
import { useSession } from "next-auth/react";
import { classroomAtom } from "@/app/libs/jotai/classroomAtom";
import { useAtomValue } from "jotai";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import useClassroomData from "@/app/libs/hooks/useClassroomData";
import CustomClassTab from "../Common/Classroom/CustomClassTab";

type StatTone = "primary" | "info" | "secondary" | "success" | "warning";

function StatCard({
  label,
  value,
  helper,
  icon,
  tone,
  onClick,
}: {
  label: string;
  value: string | number | undefined;
  helper?: string;
  icon: React.ReactNode;
  tone: StatTone;
  onClick?: () => void;
}) {
  const theme = useTheme();
  const color = theme.palette[tone].main;

  const inner = (
    <CardContent sx={{ position: "relative" }}>
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
      <Stack
        direction="row"
        alignItems="center"
        spacing={2}
        sx={{ position: "relative" }}
      >
        <Avatar
          sx={{
            width: 48,
            height: 48,
            bgcolor: alpha(color, 0.15),
            color,
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
            {value ?? "—"}
          </Typography>
          {helper ? (
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ mt: 0.25, display: "block" }}
              noWrap
            >
              {helper}
            </Typography>
          ) : null}
        </Box>
      </Stack>
    </CardContent>
  );

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
      {onClick ? (
        <CardActionArea onClick={onClick}>{inner}</CardActionArea>
      ) : (
        inner
      )}
    </Card>
  );
}

function QuickAction({
  label,
  icon,
  tone,
  onClick,
}: {
  label: string;
  icon: React.ReactNode;
  tone: StatTone;
  onClick: () => void;
}) {
  const theme = useTheme();
  const color = theme.palette[tone].main;
  return (
    <Button
      variant="outlined"
      onClick={onClick}
      startIcon={icon}
      sx={{
        textTransform: "none",
        fontWeight: 600,
        px: 2,
        py: 1,
        borderRadius: 2,
        borderColor: alpha(color, 0.3),
        color,
        bgcolor: alpha(color, 0.04),
        "&:hover": {
          borderColor: color,
          bgcolor: alpha(color, 0.1),
        },
      }}
    >
      {label}
    </Button>
  );
}

export default function MainComponent() {
  const { data: session }: { data: any; status: any } = useSession();
  const theme = useTheme();
  const router = useRouter();
  const classroom = useAtomValue(classroomAtom);
  const t = useTranslations();
  const { students, subjects, exams } = useClassroomData(classroom);

  const greeting = useMemo(() => {
    const hr = new Date().getHours();
    if (hr < 12) return "Good morning";
    if (hr < 18) return "Good afternoon";
    return "Good evening";
  }, []);

  const userName = session?.user?.fullname || session?.user?.username || "User";
  const initials = useMemo(() => {
    const parts = String(userName).trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return "U";
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }, [userName]);

  const total = students?.total ?? 0;
  const totalMale = students?.totalMale ?? 0;
  const totalFemale = students?.totalFemale ?? 0;
  const femalePct = total > 0 ? Math.round((totalFemale / total) * 100) : 0;
  const totalSubjects = subjects?.length ?? 0;
  const totalExams = exams?.length ?? 0;
  const monthlyExams = useMemo(
    () => (exams ?? []).filter((e) => e.examType === "MONTHLY").length,
    [exams]
  );
  const semesterExams = useMemo(
    () => (exams ?? []).filter((e) => e.examType === "SEMESTER").length,
    [exams]
  );

  return (
    <Box sx={{ width: "100%", maxWidth: { sm: "100%", md: "1700px" } }}>
      {/* Welcome banner */}
      <Card
        variant="outlined"
        sx={{
          mb: 3,
          position: "relative",
          overflow: "hidden",
          background: `linear-gradient(135deg, ${alpha(
            theme.palette.primary.main,
            0.08
          )} 0%, ${alpha(theme.palette.info.main, 0.06)} 100%)`,
        }}
      >
        {/* Decorative floating circle */}
        <Box
          aria-hidden
          sx={{
            position: "absolute",
            right: -60,
            top: -60,
            width: 200,
            height: 200,
            borderRadius: "50%",
            background: `radial-gradient(circle, ${alpha(
              theme.palette.primary.main,
              0.1
            )} 0%, transparent 70%)`,
            pointerEvents: "none",
          }}
        />
        <CardContent sx={{ p: { xs: 2.5, md: 3.5 }, position: "relative" }}>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={2.5}
            alignItems={{ xs: "flex-start", sm: "center" }}
            justifyContent="space-between"
          >
            <Stack direction="row" alignItems="center" spacing={2}>
              <Avatar
                sx={{
                  width: 56,
                  height: 56,
                  fontSize: 18,
                  fontWeight: 700,
                  bgcolor: alpha(theme.palette.primary.main, 0.18),
                  color: "primary.main",
                  border: `2px solid ${alpha(
                    theme.palette.primary.main,
                    0.2
                  )}`,
                }}
              >
                {initials}
              </Avatar>
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="caption" color="text.secondary">
                  {greeting},
                </Typography>
                <Typography
                  variant="h5"
                  sx={{ fontWeight: 700, lineHeight: 1.2 }}
                  noWrap
                >
                  {userName} 👋
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mt: 0.25 }}
                >
                  {t("Dashboard.welcome", { name: userName })}
                </Typography>
              </Box>
            </Stack>

            {/* Classroom context chips */}
            {classroom?.id ? (
              <Stack
                direction="row"
                spacing={1}
                flexWrap="wrap"
                useFlexGap
                rowGap={1}
                sx={{
                  px: { xs: 0, sm: 2 },
                  py: 1,
                  borderRadius: 2,
                  bgcolor: alpha(theme.palette.background.paper, 0.6),
                  border: `1px solid ${theme.palette.divider}`,
                }}
              >
                <Chip
                  size="small"
                  icon={<SchoolIcon sx={{ fontSize: 16 }} />}
                  label={classroom?.name || "—"}
                  sx={{
                    bgcolor: alpha(theme.palette.primary.main, 0.12),
                    color: "primary.main",
                    "& .MuiChip-icon": { color: "primary.main" },
                    fontWeight: 700,
                  }}
                />
                <Chip
                  size="small"
                  variant="outlined"
                  label={`${t("Common.grade")} ${classroom?.grade || "—"}`}
                />
                <Chip
                  size="small"
                  variant="outlined"
                  icon={<CalendarMonthIcon sx={{ fontSize: 16 }} />}
                  label={classroom?.year || "—"}
                />
              </Stack>
            ) : null}
          </Stack>
        </CardContent>
      </Card>

      {/* Stat cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatCard
            label={t("Dashboard.totalStudents")}
            value={String(total).padStart(2, "0")}
            helper={
              total > 0
                ? `${totalMale} ${t("Common.male")} • ${totalFemale} ${t(
                    "Common.female"
                  )}`
                : undefined
            }
            icon={<GroupsIcon />}
            tone="primary"
            onClick={() => router.push("/students")}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatCard
            label={t("Dashboard.totalSubjects")}
            value={String(totalSubjects).padStart(2, "0")}
            icon={<LibraryBooksIcon />}
            tone="info"
            onClick={() => router.push("/subjects")}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatCard
            label={t("Dashboard.totalExams")}
            value={String(totalExams).padStart(2, "0")}
            helper={
              totalExams > 0
                ? `${monthlyExams} ${t("Common.monthly")} • ${semesterExams} ${t(
                    "Common.semester"
                  )}`
                : undefined
            }
            icon={<AssignmentIcon />}
            tone="warning"
            onClick={() => router.push("/exam")}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatCard
            label={t("Common.female")}
            value={total > 0 ? `${femalePct}%` : "—"}
            helper={
              total > 0
                ? `${totalFemale} / ${total} ${t("Common.student")}`
                : undefined
            }
            icon={<WomanIcon />}
            tone="secondary"
          />
        </Grid>
      </Grid>

      {/* Quick actions */}
      <Card variant="outlined" sx={{ mb: 3 }}>
        <CardContent
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 2,
            flexWrap: "wrap",
            rowGap: 1.5,
          }}
        >
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
              {t("Common.add")}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {t("Dashboard.welcome", { name: userName })}
            </Typography>
          </Box>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap rowGap={1}>
            <QuickAction
              label={t("MenuList.student")}
              icon={<GroupAddIcon />}
              tone="primary"
              onClick={() => router.push("/students")}
            />
            <QuickAction
              label={t("MenuList.subject")}
              icon={<LibraryAddIcon />}
              tone="info"
              onClick={() => router.push("/subjects")}
            />
            <QuickAction
              label={t("Exam.createExam")}
              icon={<EventNoteIcon />}
              tone="warning"
              onClick={() => router.push("/exam?screen=create")}
            />
            <QuickAction
              label={t("MenuList.annual")}
              icon={<EventAvailableIcon />}
              tone="success"
              onClick={() => router.push("/annual")}
            />
          </Stack>
        </CardContent>
      </Card>

      {/* Tabs in card */}
      <Card variant="outlined">
        <Box sx={{ p: { xs: 1, sm: 2 } }}>
          <CustomClassTab />
        </Box>
      </Card>
    </Box>
  );
}
