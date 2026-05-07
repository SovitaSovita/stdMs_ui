"use client";

import * as React from "react";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  Typography,
  alpha,
  useTheme,
} from "@mui/material";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import RadioButtonUncheckedRoundedIcon from "@mui/icons-material/RadioButtonUncheckedRounded";
import SchoolIcon from "@mui/icons-material/School";
import GroupsIcon from "@mui/icons-material/Groups";
import LibraryBooksIcon from "@mui/icons-material/LibraryBooks";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

type OnboardingChecklistDialogProps = {
  open: boolean;
  onClose: () => void;
  hasClassroom: boolean;
  hasStudents: boolean;
  hasSubjects: boolean;
};

type StepItemProps = {
  done: boolean;
  title: string;
  description: string;
  icon: React.ReactNode;
  actionLabel: string;
  onAction?: () => void;
};

function StepItem({
  done,
  title,
  description,
  icon,
  actionLabel,
  onAction,
}: StepItemProps) {
  const theme = useTheme();
  const accent = done ? theme.palette.success.main : theme.palette.primary.main;
  return (
    <Stack
      direction="row"
      spacing={2}
      alignItems="center"
      sx={{
        p: 2,
        borderRadius: 2,
        border: `1px solid ${theme.palette.divider}`,
        bgcolor: done ? alpha(accent, 0.06) : "transparent",
      }}
    >
      <Box
        sx={{
          width: 40,
          height: 40,
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          bgcolor: alpha(accent, 0.15),
          color: accent,
          flexShrink: 0,
        }}
      >
        {icon}
      </Box>
      <Box sx={{ flexGrow: 1, minWidth: 0 }}>
        <Stack direction="row" alignItems="center" spacing={1}>
          {done ? (
            <CheckCircleRoundedIcon
              sx={{ fontSize: 18, color: theme.palette.success.main }}
            />
          ) : (
            <RadioButtonUncheckedRoundedIcon
              sx={{ fontSize: 18, color: theme.palette.text.disabled }}
            />
          )}
          <Typography
            variant="subtitle1"
            sx={{
              fontWeight: 700,
              textDecoration: done ? "line-through" : "none",
              color: done ? "text.secondary" : "text.primary",
            }}
          >
            {title}
          </Typography>
        </Stack>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          {description}
        </Typography>
      </Box>
      {!done && onAction && (
        <Button
          variant="contained"
          size="small"
          endIcon={<ArrowForwardRoundedIcon />}
          onClick={onAction}
          sx={{ flexShrink: 0 }}
        >
          {actionLabel}
        </Button>
      )}
    </Stack>
  );
}

export default function OnboardingChecklistDialog({
  open,
  onClose,
  hasClassroom,
  hasStudents,
  hasSubjects,
}: OnboardingChecklistDialogProps) {
  const t = useTranslations();
  const router = useRouter();

  const totalSteps = 3;
  const doneSteps =
    (hasClassroom ? 1 : 0) + (hasStudents ? 1 : 0) + (hasSubjects ? 1 : 0);

  return (
    <Dialog
      open={open}
      onClose={(_, reason) => {
        if (reason === "backdropClick") return;
        onClose();
      }}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle sx={{ pb: 1 }}>
        {t("Onboarding.title")}
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          {t("Onboarding.subtitle", { done: doneSteps, total: totalSteps })}
        </Typography>
      </DialogTitle>
      <DialogContent>
        <Stack spacing={1.5} sx={{ mt: 1 }}>
          <StepItem
            done={hasClassroom}
            title={t("Onboarding.classroomTitle")}
            description={t("Onboarding.classroomDesc")}
            icon={<SchoolIcon />}
            actionLabel={t("Common.create")}
          />
          <StepItem
            done={hasStudents}
            title={t("Onboarding.studentsTitle")}
            description={t("Onboarding.studentsDesc")}
            icon={<GroupsIcon />}
            actionLabel={t("Common.add")}
            onAction={() => {
              onClose();
              router.push("/students");
            }}
          />
          <StepItem
            done={hasSubjects}
            title={t("Onboarding.subjectsTitle")}
            description={t("Onboarding.subjectsDesc")}
            icon={<LibraryBooksIcon />}
            actionLabel={t("Common.add")}
            onAction={() => {
              onClose();
              router.push("/subjects");
            }}
          />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} color="inherit">
          {t("Onboarding.later")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
