"use client";

import * as React from "react";
import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Grid,
  IconButton,
  Stack,
  TextField,
  Tooltip,
  Typography,
  alpha,
  useTheme,
} from "@mui/material";
import EmojiEventsRoundedIcon from "@mui/icons-material/EmojiEventsRounded";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import RemoveRoundedIcon from "@mui/icons-material/RemoveRounded";
import StarRoundedIcon from "@mui/icons-material/StarRounded";
import LeaderboardRoundedIcon from "@mui/icons-material/LeaderboardRounded";
import RestartAltRoundedIcon from "@mui/icons-material/RestartAltRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import { useAtomValue } from "jotai";
import { useTranslations } from "next-intl";
import { classroomAtom, studentsAtom } from "@/app/libs/jotai/classroomAtom";
import useClassroomData from "@/app/libs/hooks/useClassroomData";
import EmptyStateCard from "@/app/dashboard/components/Common/EmptyStateCard";
import { StudentsInfo } from "@/app/constants/type";

const STORAGE_PREFIX = "classroomPoints:";
const STEP_KEY = "classroomPointsStep";

type Scores = Record<string, number>;

function getInitials(name?: string) {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function Page() {
  const t = useTranslations();
  const theme = useTheme();

  const classroom = useAtomValue(classroomAtom);
  const students = useAtomValue(studentsAtom);
  useClassroomData(classroom);

  const roster: StudentsInfo[] = React.useMemo(
    () => students?.student ?? [],
    [students]
  );

  const storageKey = classroom?.id
    ? `${STORAGE_PREFIX}${classroom.id}`
    : null;

  const [scores, setScores] = React.useState<Scores>({});
  const [step, setStep] = React.useState<number>(1);
  const [search, setSearch] = React.useState<string>("");
  const [bumped, setBumped] = React.useState<{
    id: string;
    delta: number;
    key: number;
  } | null>(null);

  // Load on mount / classroom change.
  React.useEffect(() => {
    if (!storageKey) return;
    try {
      const raw = localStorage.getItem(storageKey);
      setScores(raw ? JSON.parse(raw) : {});
    } catch {
      setScores({});
    }
  }, [storageKey]);

  // Load preferred step.
  React.useEffect(() => {
    try {
      const raw = localStorage.getItem(STEP_KEY);
      if (raw) {
        const n = Number(raw);
        if (Number.isFinite(n) && n > 0) setStep(n);
      }
    } catch {
      /* ignore */
    }
  }, []);

  // Persist scores.
  React.useEffect(() => {
    if (!storageKey) return;
    try {
      localStorage.setItem(storageKey, JSON.stringify(scores));
    } catch {
      /* ignore */
    }
  }, [scores, storageKey]);

  const persistStep = (n: number) => {
    setStep(n);
    try {
      localStorage.setItem(STEP_KEY, String(n));
    } catch {
      /* ignore */
    }
  };

  const adjust = (id: string, delta: number) => {
    setScores((prev) => ({ ...prev, [id]: (prev[id] ?? 0) + delta }));
    setBumped({ id, delta, key: Date.now() });
  };

  const handleResetAll = () => {
    if (!storageKey) return;
    if (!window.confirm(t("Points.resetConfirm"))) return;
    setScores({});
  };

  const filtered = React.useMemo(() => {
    if (!search.trim()) return roster;
    const q = search.toLowerCase();
    return roster.filter(
      (s) =>
        s.fullName?.toLowerCase().includes(q) ||
        String(s.idCard ?? "").toLowerCase().includes(q)
    );
  }, [roster, search]);

  const leaderboard = React.useMemo(() => {
    const list = roster.map((s) => ({ ...s, score: scores[s.id] ?? 0 }));
    list.sort((a, b) => b.score - a.score);
    return list.slice(0, 5);
  }, [roster, scores]);

  const totalAwarded = React.useMemo(
    () => Object.values(scores).reduce((sum, v) => sum + Math.max(0, v), 0),
    [scores]
  );

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

  if (roster.length === 0) {
    return (
      <Box sx={{ width: "100%", maxWidth: { sm: "100%", md: "1700px" } }}>
        <Card variant="outlined" sx={{ p: 4 }}>
          <EmptyStateCard
            title={t("Common.student")}
            description={t("Points.noStudents")}
            buttonLabel={t("Common.add")}
            onButtonClick={() => {}}
            minHeight={320}
          />
        </Card>
      </Box>
    );
  }

  return (
    <Box sx={{ width: "100%", maxWidth: { sm: "100%", md: "1700px" } }}>
      {/* Header */}
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
              bgcolor: alpha(theme.palette.warning.main, 0.12),
              color: "warning.main",
              width: 44,
              height: 44,
            }}
          >
            <EmojiEventsRoundedIcon />
          </Avatar>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
              {t("Points.title")}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {[classroom?.name, classroom?.grade, classroom?.year]
                .filter(Boolean)
                .join(" • ")}
            </Typography>
          </Box>
        </Stack>
        <Stack direction="row" spacing={1} alignItems="center">
          <Chip
            size="small"
            icon={<StarRoundedIcon sx={{ fontSize: 16 }} />}
            label={t("Points.totalAwarded", { count: totalAwarded })}
            sx={{
              fontWeight: 600,
              bgcolor: alpha(theme.palette.warning.main, 0.12),
              color: theme.palette.warning.dark,
              "& .MuiChip-icon": { color: theme.palette.warning.main },
            }}
          />
          <Button
            size="small"
            color="inherit"
            startIcon={<RestartAltRoundedIcon />}
            onClick={handleResetAll}
            disabled={Object.keys(scores).length === 0}
          >
            {t("Points.resetAll")}
          </Button>
        </Stack>
      </Stack>

      <Grid container spacing={2}>
        {/* Left: search + step selector */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>
                {t("Points.controls")}
              </Typography>

              <Stack spacing={2.5}>
                <TextField
                  size="small"
                  placeholder={t("Points.searchPlaceholder")}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  fullWidth
                  slotProps={{
                    input: {
                      startAdornment: (
                        <SearchRoundedIcon
                          fontSize="small"
                          sx={{ mr: 1, color: "text.secondary" }}
                        />
                      ),
                    },
                  }}
                />

                <Box>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mb: 0.75 }}
                  >
                    {t("Points.stepSize")}
                  </Typography>
                  <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap rowGap={0.75}>
                    {[1, 2, 5, 10].map((n) => (
                      <Chip
                        key={n}
                        label={`±${n}`}
                        variant={step === n ? "filled" : "outlined"}
                        color={step === n ? "primary" : "default"}
                        onClick={() => persistStep(n)}
                        sx={{ fontWeight: 700 }}
                      />
                    ))}
                  </Stack>
                </Box>
              </Stack>
            </CardContent>
          </Card>

          {/* Leaderboard */}
          <Card variant="outlined" sx={{ mt: 2 }}>
            <CardContent>
              <Stack
                direction="row"
                alignItems="center"
                spacing={1}
                sx={{ mb: 1.5 }}
              >
                <LeaderboardRoundedIcon
                  fontSize="small"
                  sx={{ color: "warning.main" }}
                />
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                  {t("Points.topFive")}
                </Typography>
              </Stack>
              <Divider sx={{ mb: 1 }} />
              {leaderboard.every((s) => s.score === 0) ? (
                <Typography variant="caption" color="text.secondary">
                  {t("Points.noLeaders")}
                </Typography>
              ) : (
                <Stack spacing={0.5}>
                  {leaderboard.map((s, i) => {
                    const rankColor =
                      i === 0
                        ? "#f59e0b"
                        : i === 1
                          ? "#9ca3af"
                          : i === 2
                            ? "#a16207"
                            : theme.palette.text.disabled;
                    return (
                      <Stack
                        key={s.id}
                        direction="row"
                        alignItems="center"
                        spacing={1.25}
                        sx={{
                          px: 1,
                          py: 0.75,
                          borderRadius: 1,
                          bgcolor:
                            i < 3
                              ? alpha(rankColor as string, 0.08)
                              : "transparent",
                        }}
                      >
                        <Typography
                          variant="caption"
                          sx={{
                            width: 22,
                            textAlign: "center",
                            fontWeight: 800,
                            color: rankColor,
                          }}
                        >
                          {i + 1}
                        </Typography>
                        <Avatar
                          sx={{
                            width: 28,
                            height: 28,
                            fontSize: 11,
                            fontWeight: 700,
                            bgcolor:
                              s.gender === "F"
                                ? alpha(theme.palette.secondary.main, 0.15)
                                : alpha(theme.palette.info.main, 0.15),
                            color:
                              s.gender === "F"
                                ? "secondary.main"
                                : "info.main",
                          }}
                        >
                          {getInitials(s.fullName)}
                        </Avatar>
                        <Typography
                          variant="body2"
                          noWrap
                          sx={{ flex: 1, fontWeight: i < 3 ? 700 : 500 }}
                        >
                          {s.fullName}
                        </Typography>
                        <Chip
                          size="small"
                          label={s.score}
                          color={s.score > 0 ? "warning" : "default"}
                          variant={s.score > 0 ? "filled" : "outlined"}
                          sx={{ fontWeight: 700 }}
                        />
                      </Stack>
                    );
                  })}
                </Stack>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Right: student grid */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Card variant="outlined">
            <CardContent>
              <Stack
                direction="row"
                alignItems="center"
                justifyContent="space-between"
                sx={{ mb: 1.5 }}
              >
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                  {t("Common.student")}
                </Typography>
                <Chip
                  size="small"
                  variant="outlined"
                  label={`${filtered.length} / ${roster.length}`}
                />
              </Stack>
              <Grid container spacing={1.5}>
                {filtered.map((s) => (
                  <Grid size={{ xs: 12, sm: 6, lg: 4 }} key={s.id}>
                    <StudentScoreCard
                      student={s}
                      score={scores[s.id] ?? 0}
                      step={step}
                      onAdjust={(d) => adjust(s.id, d)}
                      bumpKey={
                        bumped?.id === s.id
                          ? `${bumped.key}-${bumped.delta}`
                          : undefined
                      }
                      lastDelta={
                        bumped?.id === s.id ? bumped.delta : undefined
                      }
                    />
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}

function StudentScoreCard({
  student,
  score,
  step,
  onAdjust,
  bumpKey,
  lastDelta,
}: {
  student: StudentsInfo;
  score: number;
  step: number;
  onAdjust: (delta: number) => void;
  bumpKey?: string;
  lastDelta?: number;
}) {
  const theme = useTheme();
  const isFemale = student.gender === "F";
  const tone = isFemale
    ? theme.palette.secondary.main
    : theme.palette.info.main;
  const positive = score > 0;
  const negative = score < 0;

  return (
    <Box
      sx={{
        position: "relative",
        p: 1.5,
        borderRadius: 2,
        border: `1px solid ${theme.palette.divider}`,
        bgcolor: positive
          ? alpha(theme.palette.warning.main, 0.05)
          : negative
            ? alpha(theme.palette.error.main, 0.05)
            : "background.paper",
        transition: "background-color .25s, transform .15s",
        "&:hover": {
          transform: "translateY(-2px)",
          boxShadow: theme.shadows[2],
        },
      }}
    >
      {/* Floating delta animation */}
      {bumpKey && lastDelta !== undefined && (
        <Box
          key={bumpKey}
          sx={{
            position: "absolute",
            top: 12,
            right: 12,
            color:
              lastDelta > 0
                ? theme.palette.success.main
                : theme.palette.error.main,
            fontWeight: 800,
            fontSize: 18,
            pointerEvents: "none",
            animation: "floatDelta 900ms ease-out both",
            "@keyframes floatDelta": {
              "0%": { opacity: 0, transform: "translateY(0)" },
              "20%": { opacity: 1 },
              "100%": { opacity: 0, transform: "translateY(-32px)" },
            },
          }}
        >
          {lastDelta > 0 ? `+${lastDelta}` : lastDelta}
        </Box>
      )}

      <Stack direction="row" spacing={1.25} alignItems="center">
        <Avatar
          sx={{
            width: 40,
            height: 40,
            fontSize: 14,
            fontWeight: 700,
            bgcolor: alpha(tone, 0.15),
            color: tone,
          }}
        >
          {getInitials(student.fullName)}
        </Avatar>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
            {student.fullName}
          </Typography>
          {student.orderNo ? (
            <Typography variant="caption" color="text.secondary">
              #{student.orderNo}
            </Typography>
          ) : null}
        </Box>
      </Stack>

      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{ mt: 1.5 }}
      >
        <Tooltip title={`-${step}`}>
          <IconButton
            size="small"
            color="error"
            onClick={() => onAdjust(-step)}
            sx={{
              border: `1px solid ${alpha(theme.palette.error.main, 0.4)}`,
              borderRadius: 1.5,
              width: 36,
              height: 36,
            }}
          >
            <RemoveRoundedIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Typography
          sx={{
            fontWeight: 800,
            fontFamily:
              "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
            fontSize: 24,
            color: positive
              ? theme.palette.warning.dark
              : negative
                ? theme.palette.error.main
                : theme.palette.text.primary,
            minWidth: 56,
            textAlign: "center",
          }}
        >
          {score}
        </Typography>
        <Tooltip title={`+${step}`}>
          <IconButton
            size="small"
            color="success"
            onClick={() => onAdjust(step)}
            sx={{
              border: `1px solid ${alpha(theme.palette.success.main, 0.4)}`,
              borderRadius: 1.5,
              width: 36,
              height: 36,
            }}
          >
            <AddRoundedIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Stack>
    </Box>
  );
}
