"use client";

import * as React from "react";
import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Collapse,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Grid,
  IconButton,
  Stack,
  Switch,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
  alpha,
  useTheme,
} from "@mui/material";
import QuizRoundedIcon from "@mui/icons-material/QuizRounded";
import PlayArrowRoundedIcon from "@mui/icons-material/PlayArrowRounded";
import PauseRoundedIcon from "@mui/icons-material/PauseRounded";
import SkipNextRoundedIcon from "@mui/icons-material/SkipNextRounded";
import SkipPreviousRoundedIcon from "@mui/icons-material/SkipPreviousRounded";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";
import ShuffleRoundedIcon from "@mui/icons-material/ShuffleRounded";
import CasinoRoundedIcon from "@mui/icons-material/CasinoRounded";
import RestartAltRoundedIcon from "@mui/icons-material/RestartAltRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded";
import { useAtomValue } from "jotai";
import { useLocale, useTranslations } from "next-intl";
import { classroomAtom, studentsAtom } from "@/app/libs/jotai/classroomAtom";
import useClassroomData from "@/app/libs/hooks/useClassroomData";
import useNotifications from "@/app/libs/hooks/useNotifications/useNotifications";
import { GoogleGenAI } from "@google/genai";
import { StudentsInfo } from "@/app/constants/type";

const GEMINI_API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY as string;
const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

// Map a Gemini ApiError to a friendly toast.
function describeAiError(
  err: any,
  t: (key: string) => string
): { severity: "error" | "warning" | "info"; message: string } {
  const raw = err?.message ?? "";
  let code: number | undefined;
  let status: string | undefined;
  let apiMessage: string | undefined;
  try {
    const start = raw.indexOf("{");
    if (start >= 0) {
      const parsed = JSON.parse(raw.slice(start));
      code = parsed?.error?.code ?? err?.status;
      status = parsed?.error?.status;
      apiMessage = parsed?.error?.message;
    }
  } catch {
    /* not JSON */
  }
  code = code ?? err?.status;

  if (code === 429 || status === "RESOURCE_EXHAUSTED") {
    return { severity: "warning", message: t("Common.aiQuotaExceeded") };
  }
  if (code === 401 || code === 403 || status === "PERMISSION_DENIED") {
    return { severity: "error", message: t("Common.aiAuthError") };
  }
  if (code === 503 || status === "UNAVAILABLE") {
    return { severity: "warning", message: t("Common.aiUnavailable") };
  }
  return {
    severity: "error",
    message: apiMessage || t("Common.errorOccurred"),
  };
}

type QA = {
  q: string;
  // Free-form answer (legacy 2-field format).
  a?: string;
  // Multi-choice options (3+ field format).
  options?: string[];
  // Index into `options` of the correct one. `undefined` if no `*` marker.
  correctIndex?: number;
};

const STORAGE_KEY_DECK = "quizDeck";
const STORAGE_KEY_TIME = "quizPerQuestionSec";

// Each line is one question. Supported formats:
//   "Question?"                                       → just a question
//   "Question? | Answer"                              → free-form answer (legacy)
//   "Question? | Option A | Option B | Option C"      → multi-choice (no key)
//   "Question? | Option A | *Option B | Option C"     → multi-choice; * marks the correct answer
function parseDeck(raw: string): QA[] {
  return raw
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const parts = line.split("|").map((p) => p.trim());
      const q = parts[0] ?? "";
      const rest = parts.slice(1);
      if (rest.length === 0) return { q };
      if (rest.length === 1) return { q, a: rest[0] };
      let correctIndex: number | undefined;
      const options = rest.map((opt, i) => {
        if (opt.startsWith("*")) {
          if (correctIndex === undefined) correctIndex = i;
          return opt.slice(1).trim();
        }
        return opt;
      });
      return { q, options, correctIndex };
    });
}

function getInitials(name?: string) {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function playDing() {
  try {
    const Ctx =
      (window as any).AudioContext || (window as any).webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 1100;
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.35, ctx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.5);
    osc.start();
    osc.stop(ctx.currentTime + 0.55);
    setTimeout(() => ctx.close(), 800);
  } catch {
    /* ignore */
  }
}

function format(secs: number) {
  const safe = Math.max(0, Math.floor(secs));
  const m = Math.floor(safe / 60);
  const s = safe % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
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

  // ─── Deck ────────────────────────────────────────────────────────────────
  const [rawDeck, setRawDeck] = React.useState<string>("");
  const [editing, setEditing] = React.useState(true);
  const [aiOpen, setAiOpen] = React.useState(false);
  const deck = React.useMemo(() => parseDeck(rawDeck), [rawDeck]);

  const appendGenerated = React.useCallback(
    (lines: string) => {
      if (!lines.trim()) return;
      setRawDeck((prev) => {
        const sep = prev && !prev.endsWith("\n") ? "\n" : "";
        return prev + sep + lines.trim();
      });
    },
    []
  );

  // Persist deck.
  React.useEffect(() => {
    try {
      const v = localStorage.getItem(STORAGE_KEY_DECK);
      if (v != null) setRawDeck(v);
    } catch {
      /* ignore */
    }
  }, []);
  React.useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_DECK, rawDeck);
    } catch {
      /* ignore */
    }
  }, [rawDeck]);

  // ─── Play state ──────────────────────────────────────────────────────────
  const [order, setOrder] = React.useState<number[]>([]);
  const [cursor, setCursor] = React.useState<number>(0);
  const [revealed, setRevealed] = React.useState<boolean>(false);
  const [shuffled, setShuffled] = React.useState<boolean>(false);
  const [pickedStudent, setPickedStudent] =
    React.useState<StudentsInfo | null>(null);
  // Which option the teacher/student clicked on the current question.
  const [selectedOption, setSelectedOption] = React.useState<number | null>(
    null
  );

  // Initialize / reset order when deck length or shuffle flag changes.
  React.useEffect(() => {
    const indexes = deck.map((_, i) => i);
    if (shuffled) {
      for (let i = indexes.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [indexes[i], indexes[j]] = [indexes[j], indexes[i]];
      }
    }
    setOrder(indexes);
    setCursor(0);
    setRevealed(false);
    setPickedStudent(null);
    setSelectedOption(null);
  }, [deck.length, shuffled]);

  const currentQA: QA | null =
    deck.length > 0 && order[cursor] != null ? deck[order[cursor]] : null;

  const goNext = () => {
    if (cursor + 1 >= order.length) return;
    setCursor((c) => c + 1);
    setRevealed(false);
    setPickedStudent(null);
    setSelectedOption(null);
    resetTimer();
  };
  const goPrev = () => {
    if (cursor === 0) return;
    setCursor((c) => c - 1);
    setRevealed(false);
    setPickedStudent(null);
    setSelectedOption(null);
    resetTimer();
  };
  const handleShuffle = () => setShuffled((v) => !v);
  const handlePickStudent = () => {
    if (roster.length === 0) return;
    setPickedStudent(roster[Math.floor(Math.random() * roster.length)]);
  };

  // ─── Per-question timer ─────────────────────────────────────────────────
  const [perQuestionSec, setPerQuestionSec] = React.useState<number>(30);
  const [timerEnabled, setTimerEnabled] = React.useState<boolean>(true);
  const [timerRunning, setTimerRunning] = React.useState(false);
  const [timerSecsLeft, setTimerSecsLeft] = React.useState<number>(30);
  const [timerFinished, setTimerFinished] = React.useState(false);

  // Load saved per-question time preference.
  React.useEffect(() => {
    try {
      const v = localStorage.getItem(STORAGE_KEY_TIME);
      if (v) {
        const n = Number(v);
        if (Number.isFinite(n) && n > 0) {
          setPerQuestionSec(n);
          setTimerSecsLeft(n);
        }
      }
    } catch {
      /* ignore */
    }
  }, []);
  const persistTime = (n: number) => {
    setPerQuestionSec(n);
    setTimerSecsLeft(n);
    setTimerRunning(false);
    setTimerFinished(false);
    try {
      localStorage.setItem(STORAGE_KEY_TIME, String(n));
    } catch {
      /* ignore */
    }
  };

  const resetTimer = React.useCallback(() => {
    setTimerSecsLeft(perQuestionSec);
    setTimerRunning(false);
    setTimerFinished(false);
  }, [perQuestionSec]);

  // Tick (rAF for smooth updates).
  React.useEffect(() => {
    if (!timerEnabled || !timerRunning) return;
    const start = performance.now();
    const initial = timerSecsLeft;
    let raf = 0;
    const tick = () => {
      const elapsed = (performance.now() - start) / 1000;
      const left = Math.max(0, initial - elapsed);
      setTimerSecsLeft(left);
      if (left <= 0) {
        setTimerRunning(false);
        setTimerFinished(true);
        playDing();
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timerRunning, timerEnabled]);

  const handleTimerToggle = () => {
    if (timerFinished) {
      setTimerSecsLeft(perQuestionSec);
      setTimerFinished(false);
      setTimerRunning(true);
      return;
    }
    setTimerRunning((r) => !r);
  };

  const progress =
    timerEnabled && perQuestionSec > 0
      ? Math.max(0, Math.min(1, timerSecsLeft / perQuestionSec))
      : 0;
  const lowTime = timerEnabled && !timerFinished && progress < 0.2;
  const accent = timerFinished
    ? theme.palette.error.main
    : lowTime
      ? theme.palette.error.main
      : theme.palette.primary.main;

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
            <QuizRoundedIcon />
          </Avatar>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
              {t("Quiz.title")}
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
            label={t("Quiz.questions", { count: deck.length })}
            sx={{ fontWeight: 600 }}
          />
          {deck.length > 0 && (
            <Chip
              size="small"
              variant="outlined"
              label={t("Quiz.position", {
                current: cursor + 1,
                total: order.length,
              })}
            />
          )}
          <Button
            size="small"
            variant="outlined"
            startIcon={<EditRoundedIcon />}
            onClick={() => setEditing((v) => !v)}
          >
            {editing ? t("Quiz.hideEditor") : t("Quiz.editQuestions")}
          </Button>
        </Stack>
      </Stack>

      <Grid container spacing={2}>
        {/* Editor */}
        <Grid size={{ xs: 12, md: editing ? 5 : 0 }} sx={{ display: editing ? "block" : "none" }}>
          <Card variant="outlined">
            <CardContent>
              <Stack
                direction="row"
                alignItems="center"
                justifyContent="space-between"
                spacing={1}
                sx={{ mb: 1 }}
              >
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                  {t("Quiz.editorTitle")}
                </Typography>
                <Button
                  size="small"
                  variant="contained"
                  color="secondary"
                  startIcon={<AutoAwesomeRoundedIcon />}
                  onClick={() => setAiOpen(true)}
                >
                  {t("Quiz.generateWithAi")}
                </Button>
              </Stack>
              <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1.5 }}>
                {t("Quiz.editorHint")}
              </Typography>
              <TextField
                multiline
                minRows={12}
                maxRows={20}
                fullWidth
                placeholder={t("Quiz.editorPlaceholder")}
                value={rawDeck}
                onChange={(e) => setRawDeck(e.target.value)}
                slotProps={{
                  input: {
                    sx: {
                      fontFamily:
                        "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                      fontSize: 13,
                    },
                  },
                }}
              />
              <Stack
                direction="row"
                alignItems="center"
                justifyContent="space-between"
                sx={{ mt: 1.5 }}
              >
                <Typography variant="caption" color="text.secondary">
                  {t("Quiz.parsedCount", { count: deck.length })}
                </Typography>
                <Button
                  size="small"
                  color="inherit"
                  startIcon={<RestartAltRoundedIcon />}
                  onClick={() => setRawDeck("")}
                  disabled={!rawDeck}
                >
                  {t("Quiz.clearDeck")}
                </Button>
              </Stack>
            </CardContent>
          </Card>

          {/* Per-question time + settings */}
          <Card variant="outlined" sx={{ mt: 2 }}>
            <CardContent>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5 }}>
                {t("Quiz.settings")}
              </Typography>
              <Stack spacing={2}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={timerEnabled}
                      onChange={(_, v) => {
                        setTimerEnabled(v);
                        if (!v) setTimerRunning(false);
                      }}
                    />
                  }
                  label={
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {t("Quiz.perQuestionTimer")}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {t("Quiz.perQuestionTimerHint")}
                      </Typography>
                    </Box>
                  }
                />
                {timerEnabled && (
                  <ToggleButtonGroup
                    value={perQuestionSec}
                    exclusive
                    fullWidth
                    size="small"
                    onChange={(_, v) => {
                      if (v != null) persistTime(v as number);
                    }}
                  >
                    <ToggleButton value={15} sx={{ flex: 1 }}>15s</ToggleButton>
                    <ToggleButton value={30} sx={{ flex: 1 }}>30s</ToggleButton>
                    <ToggleButton value={60} sx={{ flex: 1 }}>1m</ToggleButton>
                    <ToggleButton value={120} sx={{ flex: 1 }}>2m</ToggleButton>
                    <ToggleButton value={300} sx={{ flex: 1 }}>5m</ToggleButton>
                  </ToggleButtonGroup>
                )}

                <FormControlLabel
                  control={
                    <Switch
                      checked={shuffled}
                      onChange={(_, v) => setShuffled(v)}
                    />
                  }
                  label={
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {t("Quiz.shuffleQuestions")}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {t("Quiz.shuffleQuestionsHint")}
                      </Typography>
                    </Box>
                  }
                />
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Stage */}
        <Grid size={{ xs: 12, md: editing ? 7 : 12 }}>
          <Card
            variant="outlined"
            sx={{
              minHeight: 480,
              position: "relative",
              overflow: "hidden",
              background: `linear-gradient(135deg, ${alpha(
                accent,
                0.05
              )} 0%, ${alpha(theme.palette.info.main, 0.04)} 100%)`,
            }}
          >
            <CardContent sx={{ p: { xs: 2, md: 3 } }}>
              {deck.length === 0 ? (
                <Stack alignItems="center" spacing={1.5} sx={{ py: 6 }}>
                  <Avatar
                    sx={{
                      width: 88,
                      height: 88,
                      bgcolor: alpha(theme.palette.primary.main, 0.1),
                      color: "primary.main",
                    }}
                  >
                    <QuizRoundedIcon sx={{ fontSize: 48 }} />
                  </Avatar>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    {t("Quiz.idleTitle")}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 380, textAlign: "center" }}>
                    {t("Quiz.idleHint")}
                  </Typography>
                </Stack>
              ) : (
                <>
                  {/* Timer strip */}
                  {timerEnabled && (
                    <Box
                      sx={{
                        position: "relative",
                        overflow: "hidden",
                        borderRadius: 999,
                        height: 10,
                        bgcolor: alpha(accent, 0.12),
                        mb: 2,
                      }}
                    >
                      <Box
                        sx={{
                          position: "absolute",
                          right: 0,
                          top: 0,
                          bottom: 0,
                          width: `${progress * 100}%`,
                          background: `linear-gradient(90deg, ${alpha(
                            accent,
                            0.4
                          )} 0%, ${accent} 100%)`,
                          willChange: "width",
                        }}
                      />
                    </Box>
                  )}

                  {/* Question card */}
                  <Box
                    sx={{
                      textAlign: "center",
                      py: { xs: 4, md: 6 },
                      px: 2,
                      borderRadius: 3,
                      bgcolor: "background.paper",
                      border: `1px solid ${theme.palette.divider}`,
                      animation: "qFadeIn 250ms ease-out",
                      "@keyframes qFadeIn": {
                        "0%": { opacity: 0, transform: "translateY(8px)" },
                        "100%": { opacity: 1, transform: "translateY(0)" },
                      },
                    }}
                    key={cursor /* re-mount triggers fade animation */}
                  >
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ fontWeight: 700, letterSpacing: 1.2 }}
                    >
                      {t("Quiz.questionLabel", {
                        index: cursor + 1,
                        total: order.length,
                      })}
                    </Typography>
                    <Typography
                      sx={{
                        mt: 1.5,
                        fontWeight: 800,
                        fontSize: { xs: 24, md: 32 },
                        lineHeight: 1.3,
                      }}
                    >
                      {currentQA?.q || "—"}
                    </Typography>

                    {/* Multi-choice options */}
                    {currentQA?.options && currentQA.options.length > 0 ? (
                      <Stack spacing={1.25} sx={{ mt: 3, mx: "auto", maxWidth: 560 }}>
                        {currentQA.options.map((opt, i) => {
                          const isCorrect = currentQA.correctIndex === i;
                          const isSelected = selectedOption === i;
                          const showCorrect = revealed && isCorrect;
                          const showWrong =
                            revealed &&
                            isSelected &&
                            currentQA.correctIndex !== undefined &&
                            !isCorrect;
                          const tone = showCorrect
                            ? theme.palette.success.main
                            : showWrong
                              ? theme.palette.error.main
                              : isSelected
                                ? theme.palette.primary.main
                                : theme.palette.divider;
                          return (
                            <Button
                              key={i}
                              fullWidth
                              variant={isSelected ? "contained" : "outlined"}
                              color={
                                showCorrect
                                  ? "success"
                                  : showWrong
                                    ? "error"
                                    : "primary"
                              }
                              onClick={() => setSelectedOption(i)}
                              sx={{
                                justifyContent: "flex-start",
                                textTransform: "none",
                                fontWeight: 600,
                                fontSize: { xs: 16, md: 18 },
                                py: 1.5,
                                px: 2,
                                borderRadius: 2,
                                borderColor: tone,
                                bgcolor:
                                  showCorrect
                                    ? alpha(theme.palette.success.main, 0.12)
                                    : showWrong
                                      ? alpha(theme.palette.error.main, 0.12)
                                      : isSelected
                                        ? undefined
                                        : "transparent",
                                color: showCorrect
                                  ? theme.palette.success.dark
                                  : showWrong
                                    ? theme.palette.error.dark
                                    : "text.primary",
                                "&:hover": {
                                  bgcolor: alpha(
                                    theme.palette.primary.main,
                                    0.04
                                  ),
                                  borderColor: tone,
                                },
                              }}
                              startIcon={
                                <Avatar
                                  sx={{
                                    width: 28,
                                    height: 28,
                                    fontSize: 13,
                                    fontWeight: 800,
                                    bgcolor: showCorrect
                                      ? alpha(theme.palette.success.main, 0.2)
                                      : showWrong
                                        ? alpha(theme.palette.error.main, 0.2)
                                        : alpha(theme.palette.primary.main, 0.12),
                                    color: showCorrect
                                      ? theme.palette.success.dark
                                      : showWrong
                                        ? theme.palette.error.dark
                                        : theme.palette.primary.main,
                                  }}
                                >
                                  {String.fromCharCode(65 + i)}
                                </Avatar>
                              }
                            >
                              <Box sx={{ textAlign: "left", flex: 1 }}>{opt}</Box>
                              {showCorrect && (
                                <Typography
                                  variant="caption"
                                  sx={{
                                    ml: 1,
                                    fontWeight: 700,
                                    color: theme.palette.success.dark,
                                  }}
                                >
                                  ✓
                                </Typography>
                              )}
                            </Button>
                          );
                        })}
                        {revealed && currentQA.correctIndex === undefined && (
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{ textAlign: "center", mt: 1 }}
                          >
                            {t("Quiz.noCorrectMarked")}
                          </Typography>
                        )}
                      </Stack>
                    ) : (
                      /* Free-form answer (legacy) */
                      <Collapse in={revealed}>
                        <Box
                          sx={{
                            mt: 3,
                            p: 2,
                            borderRadius: 2,
                            bgcolor: alpha(theme.palette.success.main, 0.08),
                            border: `1px solid ${alpha(
                              theme.palette.success.main,
                              0.3
                            )}`,
                          }}
                        >
                          <Typography
                            variant="caption"
                            sx={{
                              color: "success.dark",
                              fontWeight: 700,
                              letterSpacing: 1.2,
                            }}
                          >
                            {t("Quiz.answerLabel")}
                          </Typography>
                          <Typography
                            sx={{
                              mt: 0.5,
                              fontWeight: 700,
                              fontSize: { xs: 18, md: 22 },
                              color: "success.dark",
                            }}
                          >
                            {currentQA?.a || t("Quiz.noAnswerProvided")}
                          </Typography>
                        </Box>
                      </Collapse>
                    )}

                    {/* Picked student callout */}
                    <Collapse in={!!pickedStudent}>
                      {pickedStudent ? (
                        <Box
                          sx={{
                            mt: 2,
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 1,
                            px: 1.5,
                            py: 0.75,
                            borderRadius: 999,
                            bgcolor: alpha(theme.palette.warning.main, 0.12),
                            border: `1px solid ${alpha(
                              theme.palette.warning.main,
                              0.3
                            )}`,
                            color: "warning.dark",
                          }}
                        >
                          <Avatar
                            sx={{
                              width: 24,
                              height: 24,
                              fontSize: 11,
                              fontWeight: 700,
                              bgcolor: alpha(
                                theme.palette.warning.main,
                                0.25
                              ),
                              color: "warning.dark",
                            }}
                          >
                            {getInitials(pickedStudent.fullName)}
                          </Avatar>
                          <Typography variant="body2" sx={{ fontWeight: 700 }}>
                            {pickedStudent.fullName}
                          </Typography>
                        </Box>
                      ) : (
                        <span />
                      )}
                    </Collapse>
                  </Box>

                  {/* Controls */}
                  <Stack
                    direction="row"
                    spacing={1}
                    flexWrap="wrap"
                    rowGap={1}
                    useFlexGap
                    justifyContent="center"
                    sx={{ mt: 2.5 }}
                  >
                    <Tooltip title={t("Quiz.previous")}>
                      <span>
                        <IconButton
                          onClick={goPrev}
                          disabled={cursor === 0}
                          sx={{
                            border: `1px solid ${theme.palette.divider}`,
                            borderRadius: 2,
                          }}
                        >
                          <SkipPreviousRoundedIcon />
                        </IconButton>
                      </span>
                    </Tooltip>

                    {timerEnabled && (
                      <Tooltip
                        title={
                          timerRunning ? t("Quiz.timerPause") : t("Quiz.timerStart")
                        }
                      >
                        <Button
                          variant="contained"
                          color={timerRunning ? "warning" : "primary"}
                          startIcon={
                            timerRunning ? (
                              <PauseRoundedIcon />
                            ) : (
                              <PlayArrowRoundedIcon />
                            )
                          }
                          onClick={handleTimerToggle}
                          sx={{ borderRadius: 999, fontWeight: 700, minWidth: 130 }}
                        >
                          {format(timerSecsLeft)}
                        </Button>
                      </Tooltip>
                    )}

                    <Button
                      variant={revealed ? "outlined" : "contained"}
                      color="success"
                      startIcon={<VisibilityRoundedIcon />}
                      onClick={() => setRevealed((r) => !r)}
                      sx={{ borderRadius: 999, fontWeight: 700 }}
                    >
                      {revealed ? t("Quiz.hideAnswer") : t("Quiz.revealAnswer")}
                    </Button>

                    {roster.length > 0 && (
                      <Tooltip title={t("Quiz.pickStudentHint")}>
                        <Button
                          variant="outlined"
                          color="warning"
                          startIcon={<CasinoRoundedIcon />}
                          onClick={handlePickStudent}
                          sx={{ borderRadius: 999, fontWeight: 700 }}
                        >
                          {t("Quiz.pickStudent")}
                        </Button>
                      </Tooltip>
                    )}

                    <Tooltip title={t("Quiz.next")}>
                      <span>
                        <IconButton
                          onClick={goNext}
                          disabled={cursor + 1 >= order.length}
                          sx={{
                            border: `1px solid ${theme.palette.divider}`,
                            borderRadius: 2,
                          }}
                        >
                          <SkipNextRoundedIcon />
                        </IconButton>
                      </span>
                    </Tooltip>

                    <Tooltip title={t("Quiz.shuffle")}>
                      <IconButton
                        onClick={handleShuffle}
                        color={shuffled ? "primary" : "default"}
                        sx={{
                          border: `1px solid ${theme.palette.divider}`,
                          borderRadius: 2,
                        }}
                      >
                        <ShuffleRoundedIcon />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                </>
              )}
            </CardContent>
          </Card>

        </Grid>
      </Grid>

      <AiGenerateDialog
        open={aiOpen}
        onClose={() => setAiOpen(false)}
        onAppend={appendGenerated}
      />
    </Box>
  );
}

function AiGenerateDialog({
  open,
  onClose,
  onAppend,
}: {
  open: boolean;
  onClose: () => void;
  onAppend: (lines: string) => void;
}) {
  const t = useTranslations();
  const theme = useTheme();
  const locale = useLocale();
  const notifications = useNotifications();

  const [topic, setTopic] = React.useState("");
  const [count, setCount] = React.useState<number>(10);
  const [difficulty, setDifficulty] = React.useState<"easy" | "medium" | "hard">(
    "medium"
  );
  const [language, setLanguage] = React.useState<"en" | "km">(
    locale === "km" ? "km" : "en"
  );
  const [qType, setQType] = React.useState<"choice" | "free">("choice");
  const [isGenerating, setIsGenerating] = React.useState(false);
  const abortRef = React.useRef<AbortController | null>(null);

  React.useEffect(() => {
    if (open) setLanguage(locale === "km" ? "km" : "en");
  }, [open, locale]);

  const handleClose = () => {
    if (isGenerating) {
      abortRef.current?.abort();
    }
    onClose();
  };

  const handleGenerate = async () => {
    const trimmed = topic.trim();
    if (!trimmed) {
      notifications.show(t("Quiz.aiTopicRequired"), {
        severity: "warning",
        autoHideDuration: 4000,
      });
      return;
    }

    const controller = new AbortController();
    abortRef.current = controller;
    setIsGenerating(true);

    try {
      const langName = language === "km" ? "Khmer" : "English";
      const promptLines: string[] = [
        `You are a quiz generator. Output ONLY a valid JSON array, no markdown, no commentary.`,
        `Generate exactly ${count} ${difficulty} quiz questions about: "${trimmed}".`,
      ];
      if (qType === "choice") {
        promptLines.push(
          `Each item must have keys "q" (question text), "options" (an array of exactly 4 short distinct answer choices), and "correctIndex" (the 0-based index of the correct option).`,
          `Make distractors plausible but clearly wrong; correct answer must be unambiguous.`
        );
      } else {
        promptLines.push(
          `Each item must have keys "q" (question text) and "a" (concise answer, max 30 words).`
        );
      }
      promptLines.push(
        `Avoid duplicates and keep everything classroom-appropriate.`,
        `Write everything in ${langName}.`,
        `Do not use the pipe character "|" inside any text.`
      );
      const prompt = promptLines.join("\n");

      const result = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        config: {
          temperature: 0.9,
          abortSignal: controller.signal,
        },
        contents: [{ text: prompt }],
      });

      if (controller.signal.aborted) return;

      const cleanJson = (result.text || "")
        .replace(/```json|```/g, "")
        .trim();
      const parsed = JSON.parse(cleanJson);
      if (!Array.isArray(parsed) || parsed.length === 0) {
        throw new Error("Invalid AI response");
      }

      const safe = (s: any) => String(s ?? "").replace(/\|/g, "／").trim();
      const lines = parsed
        .map((item: any) => {
          const q = safe(item?.q ?? item?.question);
          if (!q) return null;
          const opts: any[] = Array.isArray(item?.options)
            ? item.options
            : [];
          if (opts.length >= 2) {
            // Multi-choice line: mark the correct option with a leading "*".
            const ci =
              typeof item?.correctIndex === "number"
                ? item.correctIndex
                : -1;
            const optionFields = opts.map((opt, i) => {
              const s = safe(opt);
              return i === ci ? `*${s}` : s;
            });
            return [q, ...optionFields].join(" | ");
          }
          // Free-form line.
          const a = safe(item?.a ?? item?.answer);
          return `${q} | ${a}`;
        })
        .filter((l: string | null): l is string => Boolean(l))
        .join("\n");

      if (!lines) throw new Error("Empty AI response");

      onAppend(lines);
      notifications.show(
        t("Quiz.aiGeneratedCount", { count: parsed.length }),
        { severity: "success", autoHideDuration: 3000 }
      );
      onClose();
    } catch (err: any) {
      if (err?.name === "AbortError") return;
      const { severity, message } = describeAiError(err, t);
      notifications.show(message, { severity, autoHideDuration: 6000 });
    } finally {
      setIsGenerating(false);
      abortRef.current = null;
    }
  };

  return (
    <Dialog
      open={open}
      onClose={(_, reason) => {
        if (reason === "backdropClick" && isGenerating) return;
        handleClose();
      }}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Avatar
            variant="rounded"
            sx={{
              bgcolor: alpha(theme.palette.secondary.main, 0.12),
              color: "secondary.main",
              width: 36,
              height: 36,
            }}
          >
            <AutoAwesomeRoundedIcon />
          </Avatar>
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
              {t("Quiz.aiTitle")}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {t("Quiz.aiSubtitle")}
            </Typography>
          </Box>
        </Stack>
      </DialogTitle>

      <DialogContent sx={{ pt: 1 }}>
        <Stack spacing={2.5}>
          <TextField
            label={t("Quiz.aiTopicLabel")}
            placeholder={t("Quiz.aiTopicPlaceholder")}
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            fullWidth
            autoFocus
            multiline
            minRows={2}
            disabled={isGenerating}
          />

          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 0.75 }}>
              {t("Quiz.aiCount")}
            </Typography>
            <ToggleButtonGroup
              value={count}
              exclusive
              fullWidth
              size="small"
              onChange={(_, v) => v != null && setCount(v as number)}
              disabled={isGenerating}
            >
              <ToggleButton value={5} sx={{ flex: 1 }}>5</ToggleButton>
              <ToggleButton value={10} sx={{ flex: 1 }}>10</ToggleButton>
              <ToggleButton value={15} sx={{ flex: 1 }}>15</ToggleButton>
              <ToggleButton value={20} sx={{ flex: 1 }}>20</ToggleButton>
            </ToggleButtonGroup>
          </Box>

          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 0.75 }}>
              {t("Quiz.aiDifficulty")}
            </Typography>
            <ToggleButtonGroup
              value={difficulty}
              exclusive
              fullWidth
              size="small"
              onChange={(_, v) => v && setDifficulty(v)}
              disabled={isGenerating}
            >
              <ToggleButton value="easy" sx={{ flex: 1 }}>
                {t("Quiz.aiEasy")}
              </ToggleButton>
              <ToggleButton value="medium" sx={{ flex: 1 }}>
                {t("Quiz.aiMedium")}
              </ToggleButton>
              <ToggleButton value="hard" sx={{ flex: 1 }}>
                {t("Quiz.aiHard")}
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>

          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 0.75 }}>
              {t("Quiz.aiLanguage")}
            </Typography>
            <ToggleButtonGroup
              value={language}
              exclusive
              fullWidth
              size="small"
              onChange={(_, v) => v && setLanguage(v)}
              disabled={isGenerating}
            >
              <ToggleButton value="en" sx={{ flex: 1 }}>English</ToggleButton>
              <ToggleButton value="km" sx={{ flex: 1 }}>ភាសាខ្មែរ</ToggleButton>
            </ToggleButtonGroup>
          </Box>

          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 0.75 }}>
              {t("Quiz.aiQuestionType")}
            </Typography>
            <ToggleButtonGroup
              value={qType}
              exclusive
              fullWidth
              size="small"
              onChange={(_, v) => v && setQType(v)}
              disabled={isGenerating}
            >
              <ToggleButton value="choice" sx={{ flex: 1 }}>
                {t("Quiz.aiTypeChoice")}
              </ToggleButton>
              <ToggleButton value="free" sx={{ flex: 1 }}>
                {t("Quiz.aiTypeFree")}
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleClose} color="inherit" disabled={isGenerating}>
          {t("Common.cancel")}
        </Button>
        <Button
          variant="contained"
          color="secondary"
          onClick={handleGenerate}
          disabled={isGenerating || !topic.trim()}
          startIcon={
            isGenerating ? (
              <CircularProgress size={16} color="inherit" />
            ) : (
              <AutoAwesomeRoundedIcon />
            )
          }
        >
          {isGenerating
            ? t("Quiz.aiGenerating")
            : t("Quiz.aiGenerate")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
