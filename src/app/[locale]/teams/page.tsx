"use client";

import * as React from "react";
import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  FormControlLabel,
  Grid,
  IconButton,
  Slider,
  Stack,
  Switch,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
  alpha,
  useTheme,
} from "@mui/material";
import Diversity3RoundedIcon from "@mui/icons-material/Diversity3Rounded";
import ShuffleRoundedIcon from "@mui/icons-material/ShuffleRounded";
import GroupsRoundedIcon from "@mui/icons-material/GroupsRounded";
import PersonRoundedIcon from "@mui/icons-material/PersonRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import { useAtomValue } from "jotai";
import { useTranslations } from "next-intl";
import { classroomAtom, studentsAtom } from "@/app/libs/jotai/classroomAtom";
import useClassroomData from "@/app/libs/hooks/useClassroomData";
import EmptyStateCard from "@/app/dashboard/components/Common/EmptyStateCard";
import { StudentsInfo } from "@/app/constants/type";

type Mode = "byCount" | "bySize";

const TEAM_PALETTE = [
  "#1976d2",
  "#9c27b0",
  "#e91e63",
  "#f57c00",
  "#388e3c",
  "#0097a7",
  "#5d4037",
  "#455a64",
  "#7b1fa2",
  "#c2185b",
];

function getInitials(name?: string) {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function shuffleInPlace<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Round-robin distribution: keeps team sizes within ±1 of each other.
function distribute(
  pool: StudentsInfo[],
  numTeams: number
): StudentsInfo[][] {
  const teams: StudentsInfo[][] = Array.from({ length: numTeams }, () => []);
  pool.forEach((s, i) => teams[i % numTeams].push(s));
  return teams;
}

// Balanced split: shuffle within gender first so M/F mix is even per team.
function balancedDistribute(
  pool: StudentsInfo[],
  numTeams: number
): StudentsInfo[][] {
  const males = shuffleInPlace(pool.filter((s) => s.gender !== "F"));
  const females = shuffleInPlace(pool.filter((s) => s.gender === "F"));
  const interleaved: StudentsInfo[] = [];
  const len = Math.max(males.length, females.length);
  for (let i = 0; i < len; i++) {
    if (i < females.length) interleaved.push(females[i]);
    if (i < males.length) interleaved.push(males[i]);
  }
  return distribute(interleaved, numTeams);
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

  const [mode, setMode] = React.useState<Mode>("byCount");
  const [teamCount, setTeamCount] = React.useState(2);
  const [perTeam, setPerTeam] = React.useState(4);
  const [balanced, setBalanced] = React.useState(true);
  const [teams, setTeams] = React.useState<StudentsInfo[][]>([]);
  const [shuffling, setShuffling] = React.useState(false);

  const numTeams = React.useMemo(() => {
    if (mode === "byCount") return Math.min(teamCount, roster.length || 1);
    return Math.max(1, Math.ceil((roster.length || 1) / Math.max(perTeam, 1)));
  }, [mode, teamCount, perTeam, roster.length]);

  const generate = React.useCallback(() => {
    if (roster.length === 0) return;
    setShuffling(true);
    const pool = roster.slice();
    const result = balanced
      ? balancedDistribute(pool, numTeams)
      : distribute(shuffleInPlace(pool), numTeams);
    // Tiny delay so the shuffle animation is visible.
    setTimeout(() => {
      setTeams(result);
      setShuffling(false);
    }, 500);
  }, [roster, numTeams, balanced]);

  const handleClear = () => setTeams([]);

  const maxTeamCount = Math.max(2, Math.min(10, roster.length || 2));
  const maxPerTeam = Math.max(2, Math.min(10, roster.length || 2));

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
            description={t("Teams.noStudents")}
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
              bgcolor: alpha(theme.palette.primary.main, 0.12),
              color: "primary.main",
              width: 44,
              height: 44,
            }}
          >
            <Diversity3RoundedIcon />
          </Avatar>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
              {t("Teams.title")}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {[classroom?.name, classroom?.grade, classroom?.year]
                .filter(Boolean)
                .join(" • ")}
            </Typography>
          </Box>
        </Stack>
        <Chip
          size="small"
          icon={<GroupsRoundedIcon sx={{ fontSize: 16 }} />}
          label={roster.length}
          sx={{ fontWeight: 600 }}
        />
      </Stack>

      <Grid container spacing={2}>
        {/* Settings */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>
                {t("Teams.settings")}
              </Typography>

              <Stack spacing={3}>
                <Box>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mb: 0.75 }}
                  >
                    {t("Teams.splitBy")}
                  </Typography>
                  <ToggleButtonGroup
                    value={mode}
                    exclusive
                    fullWidth
                    size="small"
                    onChange={(_, v) => v && setMode(v)}
                    disabled={shuffling}
                  >
                    <ToggleButton value="byCount">
                      {t("Teams.byCount")}
                    </ToggleButton>
                    <ToggleButton value="bySize">
                      {t("Teams.bySize")}
                    </ToggleButton>
                  </ToggleButtonGroup>
                </Box>

                {mode === "byCount" ? (
                  <Box>
                    <Stack
                      direction="row"
                      alignItems="center"
                      justifyContent="space-between"
                      sx={{ mb: 0.5 }}
                    >
                      <Typography variant="body2" color="text.secondary">
                        {t("Teams.howManyTeams")}
                      </Typography>
                      <Chip
                        size="small"
                        color="primary"
                        label={teamCount}
                        sx={{ fontWeight: 700 }}
                      />
                    </Stack>
                    <Slider
                      value={teamCount}
                      min={2}
                      max={maxTeamCount}
                      step={1}
                      marks
                      onChange={(_, v) => setTeamCount(v as number)}
                      disabled={shuffling}
                    />
                  </Box>
                ) : (
                  <Box>
                    <Stack
                      direction="row"
                      alignItems="center"
                      justifyContent="space-between"
                      sx={{ mb: 0.5 }}
                    >
                      <Typography variant="body2" color="text.secondary">
                        {t("Teams.studentsPerTeam")}
                      </Typography>
                      <Chip
                        size="small"
                        color="primary"
                        label={perTeam}
                        sx={{ fontWeight: 700 }}
                      />
                    </Stack>
                    <Slider
                      value={perTeam}
                      min={2}
                      max={maxPerTeam}
                      step={1}
                      marks
                      onChange={(_, v) => setPerTeam(v as number)}
                      disabled={shuffling}
                    />
                  </Box>
                )}

                <FormControlLabel
                  control={
                    <Switch
                      checked={balanced}
                      onChange={(_, v) => setBalanced(v)}
                      disabled={shuffling}
                    />
                  }
                  label={
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {t("Teams.balanceGender")}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {t("Teams.balanceGenderHint")}
                      </Typography>
                    </Box>
                  }
                />

                <Stack direction="row" spacing={1}>
                  <Button
                    fullWidth
                    variant="contained"
                    size="large"
                    color="primary"
                    onClick={generate}
                    disabled={shuffling}
                    startIcon={<ShuffleRoundedIcon />}
                    sx={{ fontWeight: 700, py: 1.25, borderRadius: 2 }}
                  >
                    {teams.length > 0
                      ? t("Teams.shuffleAgain")
                      : t("Teams.shuffle")}
                  </Button>
                  {teams.length > 0 && (
                    <Tooltip title={t("Teams.clear")}>
                      <span>
                        <IconButton
                          onClick={handleClear}
                          disabled={shuffling}
                          sx={{
                            border: `1px solid ${theme.palette.divider}`,
                            borderRadius: 2,
                          }}
                        >
                          <RefreshRoundedIcon />
                        </IconButton>
                      </span>
                    </Tooltip>
                  )}
                </Stack>

                <Typography variant="caption" color="text.secondary">
                  {t("Teams.willCreate", { count: numTeams })}
                </Typography>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Teams */}
        <Grid size={{ xs: 12, md: 8 }}>
          {teams.length === 0 ? (
            <Card
              variant="outlined"
              sx={{
                minHeight: 420,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: `linear-gradient(135deg, ${alpha(
                  theme.palette.primary.main,
                  0.04
                )} 0%, ${alpha(theme.palette.info.main, 0.06)} 100%)`,
              }}
            >
              <Stack alignItems="center" spacing={1}>
                <Avatar
                  sx={{
                    width: 88,
                    height: 88,
                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                    color: "primary.main",
                  }}
                >
                  <Diversity3RoundedIcon sx={{ fontSize: 48 }} />
                </Avatar>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  {t("Teams.idleTitle")}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {t("Teams.idleHint")}
                </Typography>
              </Stack>
            </Card>
          ) : (
            <Grid container spacing={2}>
              {teams.map((team, idx) => (
                <Grid size={{ xs: 12, sm: 6, lg: 4 }} key={idx}>
                  <TeamCard
                    index={idx}
                    members={team}
                    shuffling={shuffling}
                  />
                </Grid>
              ))}
            </Grid>
          )}
        </Grid>
      </Grid>
    </Box>
  );
}

function TeamCard({
  index,
  members,
  shuffling,
}: {
  index: number;
  members: StudentsInfo[];
  shuffling: boolean;
}) {
  const theme = useTheme();
  const t = useTranslations();
  const color = TEAM_PALETTE[index % TEAM_PALETTE.length];
  const teamName = `${t("Teams.teamLabel")} ${String.fromCharCode(65 + (index % 26))}`;

  return (
    <Card
      variant="outlined"
      sx={{
        height: "100%",
        position: "relative",
        overflow: "hidden",
        borderTop: `4px solid ${color}`,
        animation: shuffling
          ? "fade .35s ease both"
          : "dropIn .4s cubic-bezier(.2,1.4,.4,1) both",
        animationDelay: `${index * 80}ms`,
        "@keyframes dropIn": {
          "0%": { opacity: 0, transform: "translateY(-8px)" },
          "100%": { opacity: 1, transform: "translateY(0)" },
        },
        "@keyframes fade": {
          "0%": { opacity: 0.4 },
          "100%": { opacity: 1 },
        },
      }}
    >
      <CardContent>
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          sx={{ mb: 1.5 }}
        >
          <Stack direction="row" alignItems="center" spacing={1}>
            <Avatar
              sx={{
                width: 32,
                height: 32,
                bgcolor: alpha(color, 0.18),
                color,
                fontWeight: 800,
                fontSize: 14,
              }}
            >
              {teamName.split(" ").pop()}
            </Avatar>
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
              {teamName}
            </Typography>
          </Stack>
          <Chip
            size="small"
            variant="outlined"
            label={members.length}
            sx={{ fontWeight: 700 }}
          />
        </Stack>

        <Stack spacing={0.5}>
          {members.map((m) => {
            const isFemale = m.gender === "F";
            const tone = isFemale
              ? theme.palette.secondary.main
              : theme.palette.info.main;
            return (
              <Stack
                key={m.id}
                direction="row"
                alignItems="center"
                spacing={1}
                sx={{
                  px: 1,
                  py: 0.5,
                  borderRadius: 1,
                  "&:hover": {
                    bgcolor: alpha(theme.palette.primary.main, 0.04),
                  },
                }}
              >
                <Avatar
                  sx={{
                    width: 26,
                    height: 26,
                    fontSize: 11,
                    fontWeight: 700,
                    bgcolor: alpha(tone, 0.15),
                    color: tone,
                  }}
                >
                  {getInitials(m.fullName) || <PersonRoundedIcon fontSize="small" />}
                </Avatar>
                <Typography variant="body2" noWrap sx={{ flex: 1 }}>
                  {m.fullName}
                </Typography>
              </Stack>
            );
          })}
        </Stack>
      </CardContent>
    </Card>
  );
}
