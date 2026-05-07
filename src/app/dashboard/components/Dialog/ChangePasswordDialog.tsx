"use client";

import * as React from "react";
import {
  Avatar,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  InputAdornment,
  LinearProgress,
  Stack,
  TextField,
  Typography,
  alpha,
  useTheme,
} from "@mui/material";
import LockResetRoundedIcon from "@mui/icons-material/LockResetRounded";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";
import VisibilityOffRoundedIcon from "@mui/icons-material/VisibilityOffRounded";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import { useFormik } from "formik";
import * as yup from "yup";
import { useTranslations } from "next-intl";
import AuthService from "@/app/service/AuthService";
import useNotifications from "@/app/libs/hooks/useNotifications/useNotifications";

type Strength = {
  score: number; // 0..4
  color: "error" | "warning" | "info" | "success";
};

function scorePassword(pw: string): Strength {
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  const colors: Strength["color"][] = [
    "error",
    "error",
    "warning",
    "info",
    "success",
  ];
  return { score, color: colors[score] };
}

function RuleRow({ ok, label }: { ok: boolean; label: string }) {
  const theme = useTheme();
  const color = ok ? theme.palette.success.main : theme.palette.text.disabled;
  return (
    <Stack direction="row" spacing={0.75} alignItems="center">
      {ok ? (
        <CheckRoundedIcon sx={{ fontSize: 16, color }} />
      ) : (
        <CloseRoundedIcon sx={{ fontSize: 16, color }} />
      )}
      <Typography
        variant="caption"
        sx={{ color: ok ? "success.main" : "text.secondary" }}
      >
        {label}
      </Typography>
    </Stack>
  );
}

type ChangePasswordDialogProps = {
  open: boolean;
  onClose: () => void;
};

export default function ChangePasswordDialog({
  open,
  onClose,
}: ChangePasswordDialogProps) {
  const t = useTranslations();
  const theme = useTheme();
  const notifications = useNotifications();

  const [showCurrent, setShowCurrent] = React.useState(false);
  const [showNew, setShowNew] = React.useState(false);
  const [showConfirm, setShowConfirm] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const validationSchema = yup.object({
    currentPassword: yup.string().required(t("Settings.currentRequired")),
    newPassword: yup
      .string()
      .min(8, t("Settings.minLength"))
      .matches(/[A-Z]/, t("Settings.needUpper"))
      .matches(/[a-z]/, t("Settings.needLower"))
      .matches(/\d/, t("Settings.needDigit"))
      .required(t("Settings.newRequired"))
      .notOneOf(
        [yup.ref("currentPassword")],
        t("Settings.sameAsCurrent")
      ),
    confirmPassword: yup
      .string()
      .oneOf([yup.ref("newPassword")], t("Settings.confirmMismatch"))
      .required(t("Settings.confirmRequired")),
  });

  const formik = useFormik({
    initialValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
    validationSchema,
    onSubmit: async (values, helpers) => {
      setIsSubmitting(true);
      try {
        const result: any = await AuthService.changePassword(values);
        if (result?.status === 200 || result?.success === true) {
          notifications.show(
            result?.message || t("Settings.changeSuccess"),
            { severity: "success", autoHideDuration: 4000 }
          );
          helpers.resetForm();
          onClose();
        } else {
          notifications.show(
            result?.message || t("Settings.changeFailed"),
            { severity: "error", autoHideDuration: 5000 }
          );
        }
      } catch (err: any) {
        const apiMsg =
          err?.response?.data?.detail ||
          err?.response?.data?.message ||
          err?.message;
        notifications.show(apiMsg || t("Settings.changeFailed"), {
          severity: "error",
          autoHideDuration: 5000,
        });
      } finally {
        setIsSubmitting(false);
      }
    },
  });

  const handleClose = () => {
    if (isSubmitting) return;
    formik.resetForm();
    setShowCurrent(false);
    setShowNew(false);
    setShowConfirm(false);
    onClose();
  };

  const newPw = formik.values.newPassword;
  const strength = React.useMemo(() => scorePassword(newPw), [newPw]);
  const strengthPct = (strength.score / 4) * 100;

  return (
    <Dialog
      open={open}
      onClose={(_, reason) => {
        if (reason === "backdropClick" || reason === "escapeKeyDown") {
          if (isSubmitting) return;
        }
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
              bgcolor: alpha(theme.palette.warning.main, 0.12),
              color: "warning.main",
              width: 36,
              height: 36,
            }}
          >
            <LockResetRoundedIcon />
          </Avatar>
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
              {t("Settings.changePassword")}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {t("Settings.changePasswordHint")}
            </Typography>
          </Box>
        </Stack>
      </DialogTitle>

      <Box component="form" onSubmit={formik.handleSubmit} noValidate autoComplete="off">
        <DialogContent sx={{ pt: 1 }}>
          <Stack spacing={2.5}>
            <TextField
              name="currentPassword"
              label={t("Settings.currentPassword")}
              type={showCurrent ? "text" : "password"}
              autoComplete="current-password"
              fullWidth
              value={formik.values.currentPassword}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={
                formik.touched.currentPassword &&
                Boolean(formik.errors.currentPassword)
              }
              helperText={
                formik.touched.currentPassword && formik.errors.currentPassword
              }
              slotProps={{
                input: {
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        size="small"
                        edge="end"
                        onClick={() => setShowCurrent((p) => !p)}
                        aria-label={
                          showCurrent
                            ? t("SignIn.hidePassword")
                            : t("SignIn.showPassword")
                        }
                      >
                        {showCurrent ? (
                          <VisibilityOffRoundedIcon fontSize="small" />
                        ) : (
                          <VisibilityRoundedIcon fontSize="small" />
                        )}
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
            />

            <Box>
              <TextField
                name="newPassword"
                label={t("Settings.newPassword")}
                type={showNew ? "text" : "password"}
                autoComplete="new-password"
                fullWidth
                value={formik.values.newPassword}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={
                  formik.touched.newPassword &&
                  Boolean(formik.errors.newPassword)
                }
                helperText={
                  formik.touched.newPassword && formik.errors.newPassword
                }
                slotProps={{
                  input: {
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          size="small"
                          edge="end"
                          onClick={() => setShowNew((p) => !p)}
                          aria-label={
                            showNew
                              ? t("SignIn.hidePassword")
                              : t("SignIn.showPassword")
                          }
                        >
                          {showNew ? (
                            <VisibilityOffRoundedIcon fontSize="small" />
                          ) : (
                            <VisibilityRoundedIcon fontSize="small" />
                          )}
                        </IconButton>
                      </InputAdornment>
                    ),
                  },
                }}
              />

              {newPw.length > 0 && (
                <Box sx={{ mt: 1 }}>
                  <Stack
                    direction="row"
                    alignItems="center"
                    spacing={1}
                    sx={{ mb: 0.5 }}
                  >
                    <LinearProgress
                      variant="determinate"
                      value={strengthPct}
                      color={strength.color}
                      sx={{ flex: 1, height: 6, borderRadius: 999 }}
                    />
                    <Typography
                      variant="caption"
                      sx={{
                        color: `${strength.color}.main`,
                        fontWeight: 700,
                        minWidth: 60,
                        textAlign: "right",
                      }}
                    >
                      {t(`Settings.strength.${strength.score}`)}
                    </Typography>
                  </Stack>
                  <Stack
                    direction="row"
                    flexWrap="wrap"
                    rowGap={0.5}
                    columnGap={2}
                    sx={{ mt: 0.5 }}
                  >
                    <RuleRow
                      ok={newPw.length >= 8}
                      label={t("Settings.rule8Chars")}
                    />
                    <RuleRow
                      ok={/[A-Z]/.test(newPw) && /[a-z]/.test(newPw)}
                      label={t("Settings.ruleMixedCase")}
                    />
                    <RuleRow
                      ok={/\d/.test(newPw)}
                      label={t("Settings.ruleDigit")}
                    />
                    <RuleRow
                      ok={/[^A-Za-z0-9]/.test(newPw)}
                      label={t("Settings.ruleSymbol")}
                    />
                  </Stack>
                </Box>
              )}
            </Box>

            <TextField
              name="confirmPassword"
              label={t("Settings.confirmPassword")}
              type={showConfirm ? "text" : "password"}
              autoComplete="new-password"
              fullWidth
              value={formik.values.confirmPassword}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={
                formik.touched.confirmPassword &&
                Boolean(formik.errors.confirmPassword)
              }
              helperText={
                formik.touched.confirmPassword &&
                formik.errors.confirmPassword
              }
              slotProps={{
                input: {
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        size="small"
                        edge="end"
                        onClick={() => setShowConfirm((p) => !p)}
                        aria-label={
                          showConfirm
                            ? t("SignIn.hidePassword")
                            : t("SignIn.showPassword")
                        }
                      >
                        {showConfirm ? (
                          <VisibilityOffRoundedIcon fontSize="small" />
                        ) : (
                          <VisibilityRoundedIcon fontSize="small" />
                        )}
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
            />
          </Stack>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            type="button"
            onClick={handleClose}
            color="inherit"
            disabled={isSubmitting}
          >
            {t("Common.cancel")}
          </Button>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            disabled={isSubmitting || !formik.dirty}
            startIcon={
              isSubmitting ? (
                <CircularProgress size={16} color="inherit" />
              ) : (
                <LockResetRoundedIcon />
              )
            }
          >
            {isSubmitting
              ? t("Settings.saving")
              : t("Settings.changePassword")}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}
