"use client";

import * as React from "react";
import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  IconButton,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
  alpha,
  useTheme,
} from "@mui/material";
import TimerRoundedIcon from "@mui/icons-material/TimerRounded";
import PlayArrowRoundedIcon from "@mui/icons-material/PlayArrowRounded";
import PauseRoundedIcon from "@mui/icons-material/PauseRounded";
import RestartAltRoundedIcon from "@mui/icons-material/RestartAltRounded";
import VolumeUpRoundedIcon from "@mui/icons-material/VolumeUpRounded";
import VolumeOffRoundedIcon from "@mui/icons-material/VolumeOffRounded";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import RemoveRoundedIcon from "@mui/icons-material/RemoveRounded";
import { useTranslations } from "next-intl";

type Mode = "countdown" | "stopwatch";

const PRESETS_SEC = [60, 180, 300, 600, 900, 1500, 1800, 3600, 7200];
const MAX_TARGET_SEC = 60 * 60 * 4; // 4 hours

// "MM:SS.cs"  →  short form
// "HH:MM:SS.cs" → when the value crosses an hour
function format(secs: number) {
  const safe = Math.max(0, secs);
  const total = Math.floor(safe);
  const cs = Math.floor((safe - total) * 100);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const csStr = String(cs).padStart(2, "0");
  const mm = String(m).padStart(2, "0");
  const ss = String(s).padStart(2, "0");
  if (h > 0) {
    const hh = String(h).padStart(2, "0");
    return `${hh}:${mm}:${ss}.${csStr}`;
  }
  return `${mm}:${ss}.${csStr}`;
}

function formatPreset(sec: number) {
  if (sec >= 3600) {
    const h = sec / 3600;
    return Number.isInteger(h) ? `${h}h` : `${h.toFixed(1)}h`;
  }
  if (sec >= 60) return `${sec / 60}m`;
  return `${sec}s`;
}

// Plays a short beep using the Web Audio API — no audio files required.
function playBeep() {
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
    gain.gain.exponentialRampToValueAtTime(0.4, ctx.currentTime + 0.02);
    osc.start();
    // 3 short beeps
    [0, 0.35, 0.7].forEach((t) => {
      gain.gain.setValueAtTime(0.4, ctx.currentTime + t);
      gain.gain.setValueAtTime(0.0001, ctx.currentTime + t + 0.18);
    });
    osc.stop(ctx.currentTime + 0.95);
    setTimeout(() => ctx.close(), 1200);
  } catch {
    /* ignore audio errors */
  }
}

export default function Page() {
  const t = useTranslations();
  const theme = useTheme();

  const [mode, setMode] = React.useState<Mode>("countdown");
  const [targetSec, setTargetSec] = React.useState<number>(300);
  const [secs, setSecs] = React.useState<number>(300);
  const [running, setRunning] = React.useState(false);
  const [soundOn, setSoundOn] = React.useState(true);
  const [finished, setFinished] = React.useState(false);

  // Keep `secs` in sync with target when in countdown mode and not running.
  React.useEffect(() => {
    if (mode === "countdown" && !running) {
      setSecs(targetSec);
      setFinished(false);
    }
  }, [targetSec, mode, running]);

  // Reset when mode changes.
  React.useEffect(() => {
    setRunning(false);
    setFinished(false);
    setSecs(mode === "countdown" ? targetSec : 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  // Tick — uses requestAnimationFrame so centiseconds update smoothly.
  React.useEffect(() => {
    if (!running) return;
    const start = performance.now();
    const initial = secs;
    let raf = 0;
    const tick = () => {
      const elapsed = (performance.now() - start) / 1000;
      if (mode === "countdown") {
        const left = Math.max(0, initial - elapsed);
        setSecs(left);
        if (left <= 0) {
          setRunning(false);
          setFinished(true);
          if (soundOn) playBeep();
          return;
        }
      } else {
        setSecs(initial + elapsed);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, mode]);

  const handleStartPause = () => {
    if (mode === "countdown" && secs <= 0) {
      // Re-arm from target.
      setSecs(targetSec);
      setFinished(false);
      setRunning(true);
      return;
    }
    setRunning((r) => !r);
    if (finished) setFinished(false);
  };

  const handleReset = () => {
    setRunning(false);
    setFinished(false);
    setSecs(mode === "countdown" ? targetSec : 0);
  };

  const adjust = (delta: number) => {
    if (mode === "countdown") {
      const newTarget = Math.max(10, Math.min(MAX_TARGET_SEC, targetSec + delta));
      setTargetSec(newTarget);
    }
  };

  const progress =
    mode === "countdown" && targetSec > 0
      ? Math.max(0, Math.min(1, secs / targetSec))
      : 0;

  const accent =
    mode === "countdown"
      ? finished
        ? theme.palette.success.main
        : progress < 0.2
          ? theme.palette.error.main
          : theme.palette.primary.main
      : theme.palette.info.main;

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
            <TimerRoundedIcon />
          </Avatar>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
              {t("Timer.title")}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {t("Timer.subtitle")}
            </Typography>
          </Box>
        </Stack>
        <Stack direction="row" spacing={1} alignItems="center">
          <ToggleButtonGroup
            value={mode}
            exclusive
            size="small"
            onChange={(_, v) => v && setMode(v)}
          >
            <ToggleButton value="countdown">{t("Timer.countdown")}</ToggleButton>
            <ToggleButton value="stopwatch">{t("Timer.stopwatch")}</ToggleButton>
          </ToggleButtonGroup>
          <IconButton
            onClick={() => setSoundOn((v) => !v)}
            aria-label={soundOn ? t("Timer.muteSound") : t("Timer.unmuteSound")}
            sx={{
              border: `1px solid ${theme.palette.divider}`,
              borderRadius: 2,
            }}
          >
            {soundOn ? <VolumeUpRoundedIcon /> : <VolumeOffRoundedIcon />}
          </IconButton>
        </Stack>
      </Stack>

      <Card
        variant="outlined"
        sx={{
          position: "relative",
          overflow: "hidden",
          background: `linear-gradient(135deg, ${alpha(accent, 0.06)} 0%, ${alpha(
            accent,
            0.02
          )} 100%)`,
          textAlign: "center",
          animation: finished ? "flashFinish 600ms ease 3 both" : undefined,
          "@keyframes flashFinish": {
            "0%, 100%": { backgroundColor: alpha(accent, 0.06) },
            "50%": { backgroundColor: alpha(accent, 0.22) },
          },
        }}
      >
        <CardContent sx={{ py: { xs: 4, md: 8 } }}>
          {/* Progress ring */}
          <Box
            sx={{
              position: "relative",
              display: "inline-flex",
              mb: 4,
            }}
          >
            <Box
              sx={{
                width: { xs: 220, md: 320 },
                height: { xs: 220, md: 320 },
                borderRadius: "50%",
                background:
                  mode === "countdown"
                    ? `conic-gradient(${accent} ${progress * 360}deg, ${alpha(
                        accent,
                        0.15
                      )} 0deg)`
                    : `conic-gradient(${accent} ${
                        ((secs % 60) / 60) * 360
                      }deg, ${alpha(accent, 0.15)} 0deg)`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "background .3s",
              }}
            >
              <Box
                sx={{
                  width: { xs: 196, md: 288 },
                  height: { xs: 196, md: 288 },
                  borderRadius: "50%",
                  bgcolor: "background.paper",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexDirection: "column",
                }}
              >
                <Typography
                  sx={{
                    fontFamily:
                      "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                    fontWeight: 800,
                    // Shrink when the value crosses an hour (longer string).
                    fontSize:
                      secs >= 3600
                        ? { xs: 36, md: 56 }
                        : { xs: 48, md: 72 },
                    lineHeight: 1,
                    color: accent,
                    letterSpacing: -2,
                  }}
                >
                  {format(secs)}
                </Typography>
                {mode === "countdown" && (
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ mt: 1 }}
                  >
                    {finished
                      ? t("Timer.timesUp")
                      : t("Timer.target", {
                          value: format(targetSec).replace(/\.00$/, ""),
                        })}
                  </Typography>
                )}
                {mode === "stopwatch" && (
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ mt: 1 }}
                  >
                    {t("Timer.stopwatchHint")}
                  </Typography>
                )}
              </Box>
            </Box>
          </Box>

          {/* Adjusters (countdown only) */}
          {mode === "countdown" && !running && (
            <Stack
              direction="row"
              spacing={0.5}
              justifyContent="center"
              alignItems="center"
              sx={{ mb: 2 }}
            >
              <IconButton
                size="small"
                onClick={() => adjust(-60)}
                aria-label="-1 min"
              >
                <RemoveRoundedIcon />
              </IconButton>
              <Chip label="1m" size="small" sx={{ minWidth: 44 }} />
              <IconButton
                size="small"
                onClick={() => adjust(60)}
                aria-label="+1 min"
              >
                <AddRoundedIcon />
              </IconButton>
              <Box sx={{ width: 16 }} />
              <IconButton
                size="small"
                onClick={() => adjust(-10)}
                aria-label="-10 sec"
              >
                <RemoveRoundedIcon />
              </IconButton>
              <Chip label="10s" size="small" sx={{ minWidth: 44 }} />
              <IconButton
                size="small"
                onClick={() => adjust(10)}
                aria-label="+10 sec"
              >
                <AddRoundedIcon />
              </IconButton>
            </Stack>
          )}

          {/* Presets (countdown only) */}
          {mode === "countdown" && (
            <Stack
              direction="row"
              spacing={0.75}
              justifyContent="center"
              flexWrap="wrap"
              useFlexGap
              rowGap={0.75}
              sx={{ mb: 4 }}
            >
              {PRESETS_SEC.map((sec) => (
                <Chip
                  key={sec}
                  label={formatPreset(sec)}
                  variant={targetSec === sec ? "filled" : "outlined"}
                  color={targetSec === sec ? "primary" : "default"}
                  onClick={() => setTargetSec(sec)}
                  disabled={running}
                  sx={{ fontWeight: 600, minWidth: 56 }}
                />
              ))}
            </Stack>
          )}

          {/* Controls */}
          <Stack
            direction="row"
            spacing={1.5}
            justifyContent="center"
            alignItems="center"
          >
            <Button
              variant="contained"
              size="large"
              color={running ? "warning" : "primary"}
              onClick={handleStartPause}
              startIcon={
                running ? <PauseRoundedIcon /> : <PlayArrowRoundedIcon />
              }
              sx={{
                fontWeight: 700,
                px: 4,
                py: 1.25,
                borderRadius: 999,
                minWidth: 160,
              }}
            >
              {running
                ? t("Timer.pause")
                : finished || (mode === "countdown" && secs <= 0)
                  ? t("Timer.restart")
                  : t("Timer.start")}
            </Button>
            <Button
              variant="outlined"
              size="large"
              color="inherit"
              onClick={handleReset}
              startIcon={<RestartAltRoundedIcon />}
              sx={{ borderRadius: 999, py: 1.25, px: 3 }}
            >
              {t("Timer.reset")}
            </Button>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}
