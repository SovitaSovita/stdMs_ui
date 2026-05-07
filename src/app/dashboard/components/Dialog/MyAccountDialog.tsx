"use client";

import * as React from "react";
import {
  Avatar,
  Badge,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  TextField,
  Tooltip,
  Typography,
  alpha,
  useTheme,
} from "@mui/material";
import PersonRoundedIcon from "@mui/icons-material/PersonRounded";
import SaveRoundedIcon from "@mui/icons-material/SaveRounded";
import PhotoCameraRoundedIcon from "@mui/icons-material/PhotoCameraRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import { useFormik } from "formik";
import * as yup from "yup";
import { useTranslations } from "next-intl";
import { useSession } from "next-auth/react";
import AuthService from "@/app/service/AuthService";
import UploadService from "@/app/service/UploadService";
import useNotifications from "@/app/libs/hooks/useNotifications/useNotifications";
import { invalidateSessionCache } from "@/app/utils/axios/Common";

type MyAccountDialogProps = {
  open: boolean;
  onClose: () => void;
};

function getInitials(name?: string | null) {
  if (!name) return "?";
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function MyAccountDialog({ open, onClose }: MyAccountDialogProps) {
  const t = useTranslations();
  const theme = useTheme();
  const notifications = useNotifications();
  const { data: session, update } = useSession();
  const user: any = session?.user ?? {};

  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isUploading, setIsUploading] = React.useState(false);
  const [uploadProgress, setUploadProgress] = React.useState(0);
  // Picked-but-not-uploaded file. Upload defers until Save so closing the
  // modal without saving never leaves an orphan file on the server.
  const [pendingFile, setPendingFile] = React.useState<File | null>(null);
  const [pendingPreviewUrl, setPendingPreviewUrl] = React.useState<string | null>(
    null
  );
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const MAX_UPLOAD_BYTES = 5 * 1024 * 1024; // 5 MB

  // Revoke the object URL when it's replaced or the dialog unmounts.
  React.useEffect(() => {
    return () => {
      if (pendingPreviewUrl) URL.revokeObjectURL(pendingPreviewUrl);
    };
  }, [pendingPreviewUrl]);

  const clearPendingFile = React.useCallback(() => {
    setPendingFile(null);
    setPendingPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
  }, []);

  const validationSchema = yup.object({
    fullname: yup
      .string()
      .trim()
      .max(100, t("Account.maxFullname"))
      .required(t("Account.fullnameRequired")),
    email: yup
      .string()
      .trim()
      .email(t("Account.invalidEmail"))
      .nullable()
      .transform((v) => (v === "" ? null : v)),
    profile: yup
      .string()
      .trim()
      .url(t("Account.invalidUrl"))
      .nullable()
      .transform((v) => (v === "" ? null : v)),
  });

  const formik = useFormik({
    enableReinitialize: true,
    initialValues: {
      fullname: user.fullname ?? "",
      email: user.email ?? "",
      profile: user.profile ?? "",
    },
    validationSchema,
    onSubmit: async (values, helpers) => {
      // Step 1 — if a file was staged, upload it now to get a public URL.
      let resolvedProfile = values.profile;
      if (pendingFile) {
        setIsUploading(true);
        setUploadProgress(0);
        try {
          const upload = await UploadService.uploadImage(pendingFile, {
            onProgress: (pct) => setUploadProgress(pct),
          });
          const url = upload?.payload?.url;
          if (!url) {
            notifications.show(t("Account.uploadFailed"), {
              severity: "error",
              autoHideDuration: 5000,
            });
            return;
          }
          resolvedProfile = url;
        } catch (err: any) {
          const apiMsg =
            err?.response?.data?.detail ||
            err?.response?.data?.message ||
            err?.message;
          notifications.show(apiMsg || t("Account.uploadFailed"), {
            severity: "error",
            autoHideDuration: 5000,
          });
          return;
        } finally {
          setIsUploading(false);
          setUploadProgress(0);
        }
      }

      // Step 2 — build the partial profile body. Only send changed fields.
      const payload: { fullname?: string; email?: string; profile?: string } = {};
      if (values.fullname !== (user.fullname ?? "")) {
        payload.fullname = values.fullname.trim();
      }
      if (values.email !== (user.email ?? "")) {
        payload.email = values.email.trim();
      }
      if (resolvedProfile !== (user.profile ?? "")) {
        payload.profile = (resolvedProfile ?? "").trim();
      }

      if (Object.keys(payload).length === 0) {
        notifications.show(t("Account.noChanges"), { severity: "info" });
        return;
      }

      setIsSubmitting(true);
      try {
        const result: any = await AuthService.updateProfile(payload);
        const updated = result?.payload;
        if (result?.status === 200 || result?.success === true) {
          // Sync NextAuth session so the sidebar/header reflect new data live.
          await update({
            fullname: updated?.fullname ?? payload.fullname,
            email: updated?.email ?? payload.email,
            profile: updated?.profile ?? payload.profile,
          });
          // Drop the axios session cache so the next request sees the fresh JWT.
          invalidateSessionCache();

          notifications.show(
            result?.message || t("Account.updateSuccess"),
            { severity: "success", autoHideDuration: 4000 }
          );
          // Persist the resolved URL into form state and clear the pending file.
          helpers.resetForm({
            values: { ...values, profile: resolvedProfile },
          });
          clearPendingFile();
          onClose();
        } else {
          notifications.show(
            result?.message || t("Account.updateFailed"),
            { severity: "error", autoHideDuration: 5000 }
          );
        }
      } catch (err: any) {
        const apiMsg =
          err?.response?.data?.detail ||
          err?.response?.data?.message ||
          err?.message;
        notifications.show(apiMsg || t("Account.updateFailed"), {
          severity: "error",
          autoHideDuration: 5000,
        });
      } finally {
        setIsSubmitting(false);
      }
    },
  });

  const handlePickAvatar = () => {
    if (isSubmitting || isUploading) return;
    fileInputRef.current?.click();
  };

  // Stage the picked file locally — the actual upload happens at Save time.
  const handleAvatarFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      notifications.show(t("Account.uploadInvalidType"), {
        severity: "error",
        autoHideDuration: 4000,
      });
      return;
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      notifications.show(t("Account.uploadTooLarge"), {
        severity: "error",
        autoHideDuration: 4000,
      });
      return;
    }

    // Replace any previous pending file (and its blob URL).
    setPendingPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(file);
    });
    setPendingFile(file);
  };

  const handleClose = () => {
    if (isSubmitting || isUploading) return;
    formik.resetForm();
    clearPendingFile();
    onClose();
  };

  const previewName = formik.values.fullname || user.username;
  // Prefer the locally-staged file's blob URL so the preview shows what will
  // be uploaded after Save.
  const previewAvatar =
    pendingPreviewUrl || formik.values.profile || user.profile;
  const hasChanges = formik.dirty || pendingFile !== null;

  // Coerces formik field errors (which can be FormikErrors<any> for nested
  // shapes) into a plain string for MUI's helperText prop.
  const fieldError = (name: keyof typeof formik.values): string | undefined => {
    const err = formik.errors[name];
    if (!formik.touched[name]) return undefined;
    return typeof err === "string" ? err : undefined;
  };

  // Avatar click-to-view (large preview).
  const [viewerOpen, setViewerOpen] = React.useState(false);
  const handleViewAvatar = () => {
    if (!previewAvatar) return;
    setViewerOpen(true);
  };

  return (
    <>
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
              bgcolor: alpha(theme.palette.primary.main, 0.12),
              color: "primary.main",
              width: 36,
              height: 36,
            }}
          >
            <PersonRoundedIcon />
          </Avatar>
          <Box>
            <Typography
              variant="subtitle1"
              sx={{ fontWeight: 700, lineHeight: 1.2 }}
            >
              {t("Account.title")}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {t("Account.subtitle")}
            </Typography>
          </Box>
        </Stack>
      </DialogTitle>

      <Box
        component="form"
        onSubmit={formik.handleSubmit}
        noValidate
        autoComplete="off"
      >
        <DialogContent sx={{ pt: 1 }}>
          {/* Hidden file input drives the avatar picker */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            hidden
            onChange={handleAvatarFile}
          />

          {/* Profile preview */}
          <Stack
            direction="row"
            spacing={2}
            alignItems="center"
            sx={{
              p: 2,
              mb: 2,
              borderRadius: 2,
              bgcolor: alpha(theme.palette.primary.main, 0.04),
              border: `1px solid ${theme.palette.divider}`,
            }}
          >
            <Tooltip
              title={
                isUploading
                  ? `${t("Account.uploading")} ${uploadProgress}%`
                  : t("Account.uploadAvatar")
              }
              placement="top"
            >
              <Badge
                overlap="circular"
                anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                badgeContent={
                  <IconButton
                    size="small"
                    onClick={handlePickAvatar}
                    disabled={isUploading || isSubmitting}
                    sx={{
                      width: 28,
                      height: 28,
                      bgcolor: theme.palette.primary.main,
                      color: theme.palette.primary.contrastText,
                      border: `2px solid ${theme.palette.background.paper}`,
                      "&:hover": {
                        bgcolor: theme.palette.primary.dark,
                      },
                      "&.Mui-disabled": {
                        bgcolor: theme.palette.action.disabledBackground,
                        color: theme.palette.action.disabled,
                      },
                    }}
                    aria-label={t("Account.uploadAvatar")}
                  >
                    {isUploading ? (
                      <CircularProgress size={14} color="inherit" />
                    ) : (
                      <PhotoCameraRoundedIcon sx={{ fontSize: 16 }} />
                    )}
                  </IconButton>
                }
              >
                <Avatar
                  src={previewAvatar || undefined}
                  alt={previewName}
                  onClick={previewAvatar ? handleViewAvatar : handlePickAvatar}
                  sx={{
                    width: 64,
                    height: 64,
                    fontSize: 20,
                    fontWeight: 700,
                    bgcolor: alpha(theme.palette.primary.main, 0.15),
                    color: "primary.main",
                    cursor:
                      isUploading || isSubmitting ? "default" : "pointer",
                    transition: "filter .2s",
                    "&:hover": {
                      filter:
                        isUploading || isSubmitting ? "none" : "brightness(0.9)",
                    },
                  }}
                >
                  {getInitials(previewName)}
                </Avatar>
              </Badge>
            </Tooltip>
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }} noWrap>
                {previewName || "—"}
              </Typography>
              <Typography variant="caption" color="text.secondary" noWrap>
                @{user.username || "—"}
                {user.role ? ` · ${user.role}` : ""}
              </Typography>
              {pendingFile && (
                <Typography
                  variant="caption"
                  sx={{
                    display: "block",
                    mt: 0.5,
                    color: "warning.main",
                    fontWeight: 600,
                  }}
                  noWrap
                >
                  {t("Account.pendingUpload", { name: pendingFile.name })}
                </Typography>
              )}
            </Box>
          </Stack>

          <Stack spacing={2.5}>
            <TextField
              name="fullname"
              label={t("Account.fullname")}
              fullWidth
              value={formik.values.fullname}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.fullname && Boolean(formik.errors.fullname)}
              helperText={fieldError("fullname")}
            />

            <TextField
              name="email"
              type="email"
              label={t("Account.email")}
              placeholder="name@example.com"
              fullWidth
              value={formik.values.email}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.email && Boolean(formik.errors.email)}
              helperText={fieldError("email")}
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
            disabled={isSubmitting || isUploading || !hasChanges}
            startIcon={
              isSubmitting || isUploading ? (
                <CircularProgress size={16} color="inherit" />
              ) : (
                <SaveRoundedIcon />
              )
            }
          >
            {isUploading
              ? `${t("Account.uploading")} ${uploadProgress}%`
              : isSubmitting
                ? t("Settings.saving")
                : t("Common.save")}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>

    {/* Avatar viewer — large preview, click anywhere or Esc to close. */}
    <Dialog
      open={viewerOpen}
      onClose={() => setViewerOpen(false)}
      maxWidth="md"
      slotProps={{
        paper: {
          sx: {
            bgcolor: "transparent",
            boxShadow: "none",
            overflow: "visible",
          },
        },
      }}
    >
      <Box
        onClick={() => setViewerOpen(false)}
        sx={{
          position: "relative",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "zoom-out",
        }}
      >
        <IconButton
          aria-label="close"
          onClick={(e) => {
            e.stopPropagation();
            setViewerOpen(false);
          }}
          sx={{
            position: "absolute",
            top: 8,
            right: 8,
            color: "common.white",
            bgcolor: alpha("#000", 0.4),
            "&:hover": { bgcolor: alpha("#000", 0.6) },
          }}
        >
          <CloseRoundedIcon />
        </IconButton>
        {previewAvatar ? (
          <Box
            component="img"
            src={previewAvatar}
            alt={previewName}
            sx={{
              maxWidth: "90vw",
              maxHeight: "85vh",
              borderRadius: 2,
              boxShadow: 6,
              display: "block",
            }}
          />
        ) : null}
      </Box>
    </Dialog>
    </>
  );
}
