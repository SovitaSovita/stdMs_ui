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
  FormControlLabel,
  Grid,
  IconButton,
  Slider,
  Stack,
  Switch,
  Tooltip,
  Typography,
  alpha,
  useTheme,
} from "@mui/material";
import CasinoRoundedIcon from "@mui/icons-material/CasinoRounded";
import HistoryRoundedIcon from "@mui/icons-material/HistoryRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import RestartAltRoundedIcon from "@mui/icons-material/RestartAltRounded";
import StopRoundedIcon from "@mui/icons-material/StopRounded";
import TimerRoundedIcon from "@mui/icons-material/TimerRounded";
import HourglassEmptyRoundedIcon from "@mui/icons-material/HourglassEmptyRounded";
import PlayArrowRoundedIcon from "@mui/icons-material/PlayArrowRounded";
import PauseRoundedIcon from "@mui/icons-material/PauseRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import ManIcon from "@mui/icons-material/Man";
import WomanIcon from "@mui/icons-material/Woman";
import GroupsRoundedIcon from "@mui/icons-material/GroupsRounded";
import { useAtomValue } from "jotai";
import { useTranslations } from "next-intl";
import { classroomAtom, studentsAtom } from "@/app/libs/jotai/classroomAtom";
import useClassroomData from "@/app/libs/hooks/useClassroomData";
import EmptyStateCard from "@/app/dashboard/components/Common/EmptyStateCard";
import { StudentsInfo } from "@/app/constants/type";

function getInitials(name?: string) {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

type SpinSlot = {
  current: StudentsInfo | null;
  spinning: boolean;
};

function formatMMSS(secs: number) {
  const safe = Math.max(0, Math.floor(secs));
  const m = Math.floor(safe / 60);
  const s = safe % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

// Three short beeps via the Web Audio API — no audio asset needed.
function playPickerBeep() {
  try {
    const Ctx =
      (window as any).AudioContext || (window as any).webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    osc.start();
    [0, 0.35, 0.7].forEach((t) => {
      gain.gain.setValueAtTime(0.4, ctx.currentTime + t);
      gain.gain.setValueAtTime(0.0001, ctx.currentTime + t + 0.18);
    });
    osc.stop(ctx.currentTime + 0.95);
    setTimeout(() => ctx.close(), 1200);
  } catch {
    /* ignore */
  }
}

export default function Page() {
  const t = useTranslations();
  const theme = useTheme();

  const classroom = useAtomValue(classroomAtom);
  const students = useAtomValue(studentsAtom);
  // Re-fetch on direct page load so refreshing the URL still has the roster.
  useClassroomData(classroom);

  const roster: StudentsInfo[] = React.useMemo(
    () => students?.student ?? [],
    [students]
  );

  const [count, setCount] = React.useState<number>(1);
  const [excludePicked, setExcludePicked] = React.useState<boolean>(true);
  // Use Number.POSITIVE_INFINITY to signal "manual stop" mode — the spin
  // never auto-settles, the user has to click Stop.
  const [spinDurationMs, setSpinDurationMs] = React.useState<number>(1500);
  const isManualMode = !Number.isFinite(spinDurationMs);
  const [history, setHistory] = React.useState<StudentsInfo[]>([]);
  const [slots, setSlots] = React.useState<SpinSlot[]>([
    { current: null, spinning: false },
  ]);
  const isAnySpinning = slots.some((s) => s.spinning);

  // Each slot owns its own running setTimeout id and target finalist so we
  // can cleanly cancel a spin in-flight when the user hits Stop.
  const slotTimersRef = React.useRef<Map<number, ReturnType<typeof setTimeout>>>(
    new Map()
  );
  const finalistsRef = React.useRef<(StudentsInfo | null)[]>([]);

  // Cancel any in-flight timers when the component unmounts.
  React.useEffect(() => {
    return () => {
      slotTimersRef.current.forEach((id) => clearTimeout(id));
      slotTimersRef.current.clear();
    };
  }, []);

  // ─── Answer timer (countdown that auto-arms after a pick settles) ────────
  const [answerTimerEnabled, setAnswerTimerEnabled] = React.useState(false);
  const [answerTimerSec, setAnswerTimerSec] = React.useState<number>(120); // 2 min
  const [timerSecsLeft, setTimerSecsLeft] = React.useState<number | null>(
    null
  );
  const [timerRunning, setTimerRunning] = React.useState(false);
  const [timerFinished, setTimerFinished] = React.useState(false);
  const prevSpinningRef = React.useRef(false);

  // When all slots stop spinning AND a pick exists AND the toggle is on,
  // auto-start the answer countdown.
  React.useEffect(() => {
    const hasPick = slots.some((s) => s.current);
    if (
      prevSpinningRef.current &&
      !isAnySpinning &&
      hasPick &&
      answerTimerEnabled
    ) {
      setTimerSecsLeft(answerTimerSec);
      setTimerRunning(true);
      setTimerFinished(false);
    }
    prevSpinningRef.current = isAnySpinning;
  }, [isAnySpinning, slots, answerTimerEnabled, answerTimerSec]);

  // Countdown tick — uses requestAnimationFrame for smooth digits.
  React.useEffect(() => {
    if (!timerRunning || timerSecsLeft === null) return;
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
        playPickerBeep();
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timerRunning]);

  const handleTimerToggle = () => {
    if (timerSecsLeft === null) return;
    if (timerFinished) {
      // Restart from full duration after Time's up.
      setTimerSecsLeft(answerTimerSec);
      setTimerFinished(false);
      setTimerRunning(true);
      return;
    }
    setTimerRunning((r) => !r);
  };

  const handleTimerReset = () => {
    setTimerSecsLeft(answerTimerSec);
    setTimerFinished(false);
    setTimerRunning(false);
  };

  const handleTimerClose = () => {
    setTimerSecsLeft(null);
    setTimerRunning(false);
    setTimerFinished(false);
  };

  // Pool of "still pickable" students based on history + exclusion toggle.
  const availablePool = React.useMemo(() => {
    if (!excludePicked) return roster;
    const pickedIds = new Set(history.map((s) => s.id));
    return roster.filter((s) => !pickedIds.has(s.id));
  }, [roster, history, excludePicked]);

  // Keep slots length in sync with `count` (preserve existing values).
  React.useEffect(() => {
    setSlots((prev) => {
      if (prev.length === count) return prev;
      if (prev.length < count) {
        return [
          ...prev,
          ...Array.from({ length: count - prev.length }, () => ({
            current: null as StudentsInfo | null,
            spinning: false,
          })),
        ];
      }
      return prev.slice(0, count);
    });
  }, [count]);

  const pickRandomFrom = (pool: StudentsInfo[]) =>
    pool[Math.floor(Math.random() * pool.length)];

  const handlePick = () => {
    if (availablePool.length === 0) return;

    // Decide the final picks up front so each slot animates independently
    // toward a known target (used unless the user hits Stop early).
    const finalists: StudentsInfo[] = [];
    const pool = [...availablePool];
    const desired = Math.min(count, pool.length);
    for (let i = 0; i < desired; i++) {
      const idx = Math.floor(Math.random() * pool.length);
      finalists.push(pool[idx]);
      pool.splice(idx, 1); // unique within this batch
    }
    finalistsRef.current = finalists;

    // Cancel any leftover timers (defensive — Pick should only fire when
    // nothing is spinning, but be safe).
    slotTimersRef.current.forEach((id) => clearTimeout(id));
    slotTimersRef.current.clear();

    // Start every slot spinning.
    setSlots((prev) =>
      prev.map((s, i) => ({
        current: finalists[i] ?? s.current,
        spinning: i < finalists.length,
      }))
    );

    finalists.forEach((finalStudent, slotIndex) => {
      let elapsed = 0;
      // In manual mode the loop runs forever until handleStop clears it.
      const totalMs = isManualMode
        ? Number.POSITIVE_INFINITY
        : spinDurationMs + slotIndex * 250; // staggered settle
      const startDelay = 60;
      const endDelay = 260;
      // Manual mode flashes at a steady, brisk pace (no deceleration).
      const manualDelay = 80;

      const tick = () => {
        slotTimersRef.current.delete(slotIndex);
        if (!isManualMode && elapsed >= totalMs) {
          // Land on the predetermined final pick.
          setSlots((prev) =>
            prev.map((s, i) =>
              i === slotIndex
                ? { current: finalStudent, spinning: false }
                : s
            )
          );
          setHistory((h) => [finalStudent, ...h]);
          return;
        }
        const flash = pickRandomFrom(roster);
        setSlots((prev) =>
          prev.map((s, i) =>
            i === slotIndex ? { current: flash, spinning: true } : s
          )
        );
        const delay = isManualMode
          ? manualDelay
          : startDelay +
            (endDelay - startDelay) * (elapsed / totalMs);
        elapsed += delay;
        const id = setTimeout(tick, delay);
        slotTimersRef.current.set(slotIndex, id);
      };
      tick();
    });
  };

  const stopOneByOne = isManualMode && slots.length > 1;

  // Resolve the winner for a slot index from the current state.
  const resolveWinner = React.useCallback(
    (slot: SpinSlot, index: number): StudentsInfo | null => {
      return (
        slot.current ??
        finalistsRef.current[index] ??
        (availablePool.length > 0 ? pickRandomFrom(availablePool) : null)
      );
    },
    [availablePool]
  );

  // Stop a single slot — used both for "stop all" iterations and the
  // one-by-one manual flow.
  const stopSlot = (index: number, prev: SpinSlot[]): {
    next: SpinSlot[];
    winner: StudentsInfo | null;
  } => {
    const slot = prev[index];
    if (!slot || !slot.spinning) return { next: prev, winner: null };
    const timerId = slotTimersRef.current.get(index);
    if (timerId) clearTimeout(timerId);
    slotTimersRef.current.delete(index);
    const winner = resolveWinner(slot, index);
    const next = prev.map((s, i) =>
      i === index ? { current: winner, spinning: false } : s
    );
    return { next, winner };
  };

  // Stop in-flight spins. In manual + multi mode, a single Stop click
  // settles only the first still-spinning slot — click again for the next.
  // In all other modes, every slot stops at once (raffle-wheel feel).
  const handleStop = () => {
    if (!isAnySpinning) return;

    if (stopOneByOne) {
      const idx = slots.findIndex((s) => s.spinning);
      if (idx < 0) return;
      const { next, winner } = stopSlot(idx, slots);
      setSlots(next);
      if (winner) setHistory((h) => [winner, ...h]);
      return;
    }

    // Stop all at once.
    slotTimersRef.current.forEach((id) => clearTimeout(id));
    slotTimersRef.current.clear();

    setSlots((prev) => {
      const stopped: StudentsInfo[] = [];
      const next = prev.map((s, i) => {
        if (!s.spinning) return s;
        const winner = resolveWinner(s, i);
        if (winner) stopped.push(winner);
        return { current: winner, spinning: false };
      });
      if (stopped.length > 0) {
        setHistory((h) => [...stopped, ...h]);
      }
      return next;
    });
  };

  const handleResetHistory = () => setHistory([]);
  const handleResetSlots = () => {
    setSlots((prev) => prev.map(() => ({ current: null, spinning: false })));
  };

  const maxCount = Math.max(1, Math.min(10, roster.length || 1));

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
            description={t("Picker.noStudents")}
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
            <CasinoRoundedIcon />
          </Avatar>
          <Box>
            <Typography
              variant="h5"
              sx={{ fontWeight: 700, lineHeight: 1.2 }}
            >
              {t("Picker.title")}
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
            icon={<GroupsRoundedIcon sx={{ fontSize: 16 }} />}
            label={`${availablePool.length} / ${roster.length}`}
            sx={{ fontWeight: 600 }}
          />
        </Stack>
      </Stack>

      <Grid container spacing={2}>
        {/* Left: settings + actions */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>
                {t("Picker.settings")}
              </Typography>

              <Stack spacing={3}>
                <Box>
                  <Stack
                    direction="row"
                    alignItems="center"
                    justifyContent="space-between"
                    sx={{ mb: 0.5 }}
                  >
                    <Typography variant="body2" color="text.secondary">
                      {t("Picker.howMany")}
                    </Typography>
                    <Chip
                      size="small"
                      label={count}
                      color="primary"
                      sx={{ fontWeight: 700 }}
                    />
                  </Stack>
                  <Slider
                    value={count}
                    min={1}
                    max={maxCount}
                    step={1}
                    marks
                    onChange={(_, v) => setCount(v as number)}
                    disabled={isAnySpinning}
                  />
                </Box>

                <FormControlLabel
                  control={
                    <Switch
                      checked={excludePicked}
                      onChange={(_, v) => setExcludePicked(v)}
                      disabled={isAnySpinning}
                    />
                  }
                  label={
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {t("Picker.excludePicked")}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {t("Picker.excludePickedHint")}
                      </Typography>
                    </Box>
                  }
                />

                {/* Spin duration */}
                <Box>
                  <Stack
                    direction="row"
                    alignItems="center"
                    spacing={1}
                    sx={{ mb: 0.75 }}
                  >
                    <TimerRoundedIcon
                      fontSize="small"
                      sx={{ color: "text.secondary" }}
                    />
                    <Typography variant="body2" color="text.secondary">
                      {t("Picker.spinDuration")}
                    </Typography>
                  </Stack>
                  <ToggleButtonGroup
                    value={isManualMode ? "manual" : spinDurationMs}
                    exclusive
                    fullWidth
                    size="small"
                    onChange={(_, v) => {
                      if (v == null) return;
                      setSpinDurationMs(
                        v === "manual"
                          ? Number.POSITIVE_INFINITY
                          : (v as number)
                      );
                    }}
                    disabled={isAnySpinning}
                  >
                    <ToggleButton value={1500} sx={{ flex: 1 }}>
                      {t("Picker.durationNormal")}
                    </ToggleButton>
                    <ToggleButton value={3000} sx={{ flex: 1 }}>
                      {t("Picker.durationLong")}
                    </ToggleButton>
                    <ToggleButton value={5000} sx={{ flex: 1 }}>
                      {t("Picker.durationExtra")}
                    </ToggleButton>
                    <ToggleButton value="manual" sx={{ flex: 1 }}>
                      {t("Picker.durationManual")}
                    </ToggleButton>
                  </ToggleButtonGroup>
                  {isManualMode && (
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ display: "block", mt: 0.5 }}
                    >
                      {t("Picker.durationManualHint")}
                    </Typography>
                  )}
                </Box>

                {/* Answer timer */}
                <Box>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={answerTimerEnabled}
                        onChange={(_, v) => setAnswerTimerEnabled(v)}
                      />
                    }
                    label={
                      <Box>
                        <Stack
                          direction="row"
                          spacing={1}
                          alignItems="center"
                        >
                          <HourglassEmptyRoundedIcon
                            fontSize="small"
                            sx={{ color: "text.secondary" }}
                          />
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {t("Picker.answerTimer")}
                          </Typography>
                        </Stack>
                        <Typography variant="caption" color="text.secondary">
                          {t("Picker.answerTimerHint")}
                        </Typography>
                      </Box>
                    }
                  />
                  {answerTimerEnabled && (
                    <ToggleButtonGroup
                      value={answerTimerSec}
                      exclusive
                      fullWidth
                      size="small"
                      onChange={(_, v) => {
                        if (v != null) setAnswerTimerSec(v as number);
                      }}
                      sx={{ mt: 1 }}
                    >
                      <ToggleButton value={30} sx={{ flex: 1 }}>
                        30s
                      </ToggleButton>
                      <ToggleButton value={60} sx={{ flex: 1 }}>
                        1m
                      </ToggleButton>
                      <ToggleButton value={120} sx={{ flex: 1 }}>
                        2m
                      </ToggleButton>
                      <ToggleButton value={180} sx={{ flex: 1 }}>
                        3m
                      </ToggleButton>
                      <ToggleButton value={300} sx={{ flex: 1 }}>
                        5m
                      </ToggleButton>
                    </ToggleButtonGroup>
                  )}
                </Box>

                <Stack direction="row" spacing={1}>
                  {isAnySpinning ? (
                    <Button
                      variant="contained"
                      color="error"
                      size="large"
                      fullWidth
                      onClick={handleStop}
                      startIcon={<StopRoundedIcon />}
                      sx={{ fontWeight: 700, py: 1.25, borderRadius: 2 }}
                    >
                      {stopOneByOne
                        ? t("Picker.stopNext", {
                            remaining: slots.filter((s) => s.spinning).length,
                          })
                        : t("Picker.stop")}
                    </Button>
                  ) : (
                    <Button
                      variant="contained"
                      color="primary"
                      size="large"
                      fullWidth
                      onClick={handlePick}
                      disabled={availablePool.length === 0}
                      startIcon={<CasinoRoundedIcon />}
                      sx={{ fontWeight: 700, py: 1.25, borderRadius: 2 }}
                    >
                      {t("Picker.pick")}
                    </Button>
                  )}
                  <Tooltip title={t("Picker.resetSlots")}>
                    <span>
                      <IconButton
                        onClick={handleResetSlots}
                        disabled={isAnySpinning}
                        sx={{
                          border: `1px solid ${theme.palette.divider}`,
                          borderRadius: 2,
                        }}
                      >
                        <RefreshRoundedIcon />
                      </IconButton>
                    </span>
                  </Tooltip>
                </Stack>

                {availablePool.length === 0 && (
                  <Typography
                    variant="caption"
                    color="warning.main"
                    sx={{ fontWeight: 600 }}
                  >
                    {t("Picker.allPickedHint")}
                  </Typography>
                )}
              </Stack>
            </CardContent>
          </Card>

          {/* History */}
          <Card variant="outlined" sx={{ mt: 2 }}>
            <CardContent>
              <Stack
                direction="row"
                alignItems="center"
                justifyContent="space-between"
                sx={{ mb: 1.5 }}
              >
                <Stack direction="row" alignItems="center" spacing={1}>
                  <HistoryRoundedIcon
                    fontSize="small"
                    sx={{ color: "text.secondary" }}
                  />
                  <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                    {t("Picker.history")}
                  </Typography>
                  <Chip size="small" variant="outlined" label={history.length} />
                </Stack>
                {history.length > 0 && (
                  <Button
                    size="small"
                    color="inherit"
                    startIcon={<RestartAltRoundedIcon />}
                    onClick={handleResetHistory}
                    disabled={isAnySpinning}
                  >
                    {t("Picker.clear")}
                  </Button>
                )}
              </Stack>

              {history.length === 0 ? (
                <Typography variant="caption" color="text.secondary">
                  {t("Picker.historyEmpty")}
                </Typography>
              ) : (
                <Stack spacing={0.5} sx={{ maxHeight: 320, overflow: "auto" }}>
                  {history.slice(0, 30).map((s, i) => (
                    <Stack
                      key={`${s.id}-${i}`}
                      direction="row"
                      alignItems="center"
                      spacing={1.25}
                      sx={{
                        px: 1,
                        py: 0.75,
                        borderRadius: 1,
                        "&:hover": {
                          bgcolor: alpha(theme.palette.primary.main, 0.04),
                        },
                      }}
                    >
                      <Typography
                        variant="caption"
                        color="text.disabled"
                        sx={{ width: 22, textAlign: "right" }}
                      >
                        {history.length - i}
                      </Typography>
                      <Avatar
                        sx={{
                          width: 24,
                          height: 24,
                          fontSize: 10,
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
                      <Typography variant="body2" noWrap sx={{ flex: 1 }}>
                        {s.fullName}
                      </Typography>
                    </Stack>
                  ))}
                </Stack>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Right: pick stage */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Card
            variant="outlined"
            sx={{
              minHeight: 420,
              position: "relative",
              overflow: "hidden",
              background: `linear-gradient(135deg, ${alpha(
                theme.palette.primary.main,
                0.04
              )} 0%, ${alpha(theme.palette.info.main, 0.06)} 100%)`,
            }}
          >
            {/* Decorative blob */}
            <Box
              aria-hidden
              sx={{
                position: "absolute",
                width: 360,
                height: 360,
                borderRadius: "50%",
                top: -120,
                right: -120,
                background: `radial-gradient(circle, ${alpha(
                  theme.palette.primary.main,
                  0.08
                )} 0%, transparent 70%)`,
                pointerEvents: "none",
              }}
            />

            <CardContent
              sx={{
                position: "relative",
                p: { xs: 2, md: 3 },
                display: "flex",
                flexDirection: "column",
                gap: 2,
                minHeight: 420,
              }}
            >
              {/* Answer countdown banner */}
              {timerSecsLeft !== null && (
                <AnswerTimerBanner
                  secsLeft={timerSecsLeft}
                  total={answerTimerSec}
                  running={timerRunning}
                  finished={timerFinished}
                  onToggle={handleTimerToggle}
                  onReset={handleTimerReset}
                  onClose={handleTimerClose}
                />
              )}

              {!isAnySpinning && slots.every((s) => !s.current) ? (
                <Box
                  sx={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    textAlign: "center",
                    gap: 1,
                  }}
                >
                  <Avatar
                    sx={{
                      width: 88,
                      height: 88,
                      bgcolor: alpha(theme.palette.primary.main, 0.1),
                      color: "primary.main",
                    }}
                  >
                    <CasinoRoundedIcon sx={{ fontSize: 48 }} />
                  </Avatar>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    {t("Picker.idleTitle")}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {t("Picker.idleHint")}
                  </Typography>
                </Box>
              ) : (
                <Grid container spacing={2}>
                  {slots.map((slot, i) => (
                    <Grid
                      size={{
                        xs: 12,
                        sm: slots.length === 1 ? 12 : 6,
                        md: slots.length === 1 ? 12 : 6,
                        lg:
                          slots.length === 1
                            ? 12
                            : slots.length === 2
                              ? 6
                              : 4,
                      }}
                      key={i}
                    >
                      <SlotCard slot={slot} />
                    </Grid>
                  ))}
                </Grid>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}

function AnswerTimerBanner({
  secsLeft,
  total,
  running,
  finished,
  onToggle,
  onReset,
  onClose,
}: {
  secsLeft: number;
  total: number;
  running: boolean;
  finished: boolean;
  onToggle: () => void;
  onReset: () => void;
  onClose: () => void;
}) {
  const theme = useTheme();
  const t = useTranslations();
  const progress = total > 0 ? Math.max(0, Math.min(1, secsLeft / total)) : 0;
  const lowTime = !finished && progress < 0.2;
  const accent = finished
    ? theme.palette.error.main
    : lowTime
      ? theme.palette.error.main
      : theme.palette.primary.main;

  return (
    <Box
      sx={{
        position: "relative",
        overflow: "hidden",
        borderRadius: 2,
        border: `1px solid ${alpha(accent, 0.4)}`,
        bgcolor: alpha(accent, 0.06),
        p: { xs: 1.25, md: 1.75 },
        animation: finished
          ? "tFlash 600ms ease-in-out 3 both"
          : undefined,
        "@keyframes tFlash": {
          "0%, 100%": { backgroundColor: alpha(accent, 0.06) },
          "50%": { backgroundColor: alpha(accent, 0.28) },
        },
      }}
    >
      {/* Progress underlay — drains from the right as time passes. The
          width comes straight from rAF-updated `secsLeft`, so we don't add a
          CSS transition (which would fight per-frame updates and jitter). */}
      <Box
        aria-hidden
        sx={{
          position: "absolute",
          right: 0,
          top: 0,
          bottom: 0,
          width: `${progress * 100}%`,
          background: `linear-gradient(90deg, ${alpha(accent, 0.05)} 0%, ${alpha(
            accent,
            0.18
          )} 100%)`,
          pointerEvents: "none",
          willChange: "width",
        }}
      />
      <Stack
        direction="row"
        alignItems="center"
        spacing={1.5}
        sx={{ position: "relative" }}
      >
        <HourglassEmptyRoundedIcon sx={{ color: accent }} />
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography
            sx={{
              fontFamily:
                "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
              fontWeight: 800,
              fontSize: { xs: 22, md: 28 },
              lineHeight: 1.1,
              color: accent,
              letterSpacing: -1,
            }}
          >
            {formatMMSS(secsLeft)}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {finished
              ? t("Picker.timerFinished")
              : running
                ? t("Picker.timerRunning")
                : t("Picker.timerPaused")}
          </Typography>
        </Box>
        <Tooltip title={running ? t("Picker.timerPause") : t("Picker.timerStart")}>
          <IconButton
            size="small"
            onClick={onToggle}
            sx={{
              border: `1px solid ${alpha(accent, 0.5)}`,
              color: accent,
            }}
            aria-label={running ? t("Picker.timerPause") : t("Picker.timerStart")}
          >
            {running ? (
              <PauseRoundedIcon fontSize="small" />
            ) : (
              <PlayArrowRoundedIcon fontSize="small" />
            )}
          </IconButton>
        </Tooltip>
        <Tooltip title={t("Picker.timerReset")}>
          <IconButton
            size="small"
            onClick={onReset}
            sx={{ border: `1px solid ${theme.palette.divider}` }}
            aria-label={t("Picker.timerReset")}
          >
            <RestartAltRoundedIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title={t("Picker.timerClose")}>
          <IconButton
            size="small"
            onClick={onClose}
            sx={{ border: `1px solid ${theme.palette.divider}` }}
            aria-label={t("Picker.timerClose")}
          >
            <CloseRoundedIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Stack>
    </Box>
  );
}

function SlotCard({ slot }: { slot: SpinSlot }) {
  const theme = useTheme();
  const t = useTranslations();
  const s = slot.current;
  const isFemale = s?.gender === "F";
  const tone = isFemale
    ? theme.palette.secondary.main
    : theme.palette.info.main;

  return (
    <Box
      sx={{
        position: "relative",
        textAlign: "center",
        p: { xs: 2, md: 3 },
        borderRadius: 3,
        bgcolor: "background.paper",
        border: `2px solid ${
          slot.spinning ? theme.palette.primary.main : theme.palette.divider
        }`,
        transition: "border-color .2s, transform .2s",
        transform: slot.spinning ? "scale(0.98)" : "scale(1)",
        animation: !slot.spinning && s
          ? "pickedPop 360ms cubic-bezier(.2,1.4,.4,1) both"
          : undefined,
        "@keyframes pickedPop": {
          "0%": { transform: "scale(.85)" },
          "60%": { transform: "scale(1.05)" },
          "100%": { transform: "scale(1)" },
        },
      }}
    >
      {slot.spinning && (
        <Chip
          label={t("Picker.picking")}
          size="small"
          color="primary"
          sx={{
            position: "absolute",
            top: 12,
            left: 12,
            fontWeight: 700,
            animation: "blink 800ms ease-in-out infinite alternate",
            "@keyframes blink": {
              "0%": { opacity: 0.6 },
              "100%": { opacity: 1 },
            },
          }}
        />
      )}
      <Avatar
        sx={{
          width: { xs: 96, md: 128 },
          height: { xs: 96, md: 128 },
          mx: "auto",
          mb: 2,
          fontSize: { xs: 28, md: 40 },
          fontWeight: 800,
          bgcolor: alpha(tone, 0.18),
          color: tone,
          border: `4px solid ${alpha(tone, 0.25)}`,
          transition: "transform .15s",
          transform: slot.spinning ? "rotate(-3deg)" : "rotate(0deg)",
        }}
      >
        {s ? getInitials(s.fullName) : "?"}
      </Avatar>
      <Typography
        variant="h5"
        sx={{
          fontWeight: 800,
          lineHeight: 2.5,
          minHeight: 32,
          opacity: slot.spinning ? 0.7 : 1,
        }}
        noWrap
      >
        {s?.fullName ?? "—"}
      </Typography>
      {s && (
        <Stack
          direction="row"
          spacing={1}
          alignItems="center"
          justifyContent="center"
          sx={{ mt: 1 }}
        >
          <Chip
            size="small"
            icon={
              isFemale ? (
                <WomanIcon sx={{ fontSize: 16 }} />
              ) : (
                <ManIcon sx={{ fontSize: 16 }} />
              )
            }
            label={isFemale ? t("Common.female") : t("Common.male")}
            sx={{
              bgcolor: alpha(tone, 0.12),
              color: tone,
              "& .MuiChip-icon": { color: tone },
              fontWeight: 600,
            }}
          />
          {s.orderNo ? (
            <Chip
              size="small"
              variant="outlined"
              label={`#${s.orderNo}`}
            />
          ) : null}
        </Stack>
      )}
    </Box>
  );
}
