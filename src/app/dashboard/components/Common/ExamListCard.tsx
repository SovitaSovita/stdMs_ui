"use client";

import * as React from "react";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import StarsIcon from "@mui/icons-material/Stars";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import VisibilityIcon from "@mui/icons-material/Visibility";
import EventAvailableIcon from "@mui/icons-material/EventAvailable";
import { ExamResponse } from "@/app/constants/type";
import { useTranslations } from "next-intl";
import {
  Avatar,
  Box,
  Chip,
  Divider,
  Grid,
  IconButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Stack,
  Tooltip,
  alpha,
  useTheme,
} from "@mui/material";
import ExamService from "@/app/service/ExamService";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { ScreenExamAtom } from "@/app/libs/jotai/commonAtom";
import dayjs from "dayjs";
import { useRouter } from "next/navigation";
import useClassroomData from "@/app/libs/hooks/useClassroomData";
import { classroomAtom, examAtom } from "@/app/libs/jotai/classroomAtom";
import useNotifications from "@/app/libs/hooks/useNotifications/useNotifications";
import { DeleteConfirmationDialog } from "../Dialog/DeleteConfirmationDialog";
import EmptyStateCard from "./EmptyStateCard";

type ExamListCardProps = {
  enableEdit?: "visible" | "hidden";
  examsOverride?: ExamResponse[];
};

export default function ExamListCard(props: ExamListCardProps) {
  const { enableEdit = "visible", examsOverride } = props;
  const router = useRouter();
  const t = useTranslations();
  const theme = useTheme();
  const setActiveView = useSetAtom(ScreenExamAtom);
  const classroom = useAtomValue(classroomAtom);
  const { exams, refetch } = useClassroomData(classroom, { autoFetch: false });
  const [exam, setExam] = useAtom(examAtom);
  const notification = useNotifications();
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [menuAnchor, setMenuAnchor] = React.useState<{
    el: HTMLElement;
    exam: ExamResponse;
  } | null>(null);

  const list = examsOverride ?? exams;

  const handleDeleteExam = async () => {
    try {
      if (!exam?.id) return;
      const result = await ExamService.delete(exam?.id);
      if (result?.status == 200) {
        notification.show("Exam deleted successfully.", {
          severity: "success",
          autoHideDuration: 3000,
        });
        refetch.fetchExams();
      }
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.detail ||
        error?.message ||
        "An error occurred while creating the exam";
      notification.show(errorMessage, {
        severity: "error",
        autoHideDuration: 3000,
      });
    }
  };

  const renderEmptyState = () => (
    <Card variant="outlined" sx={{ p: 4 }}>
      <EmptyStateCard
        title={t("Exam.noExams")}
        buttonLabel={t("Exam.createExam")}
        onButtonClick={() => {
          setActiveView("create");
          setExam({} as ExamResponse);
          router.push("/exam?screen=create");
        }}
        minHeight={280}
      />
    </Card>
  );

  if (list.length === 0) {
    return renderEmptyState();
  }

  const handleOpenMenu = (
    e: React.MouseEvent<HTMLButtonElement>,
    exam: ExamResponse
  ) => {
    e.stopPropagation();
    setMenuAnchor({ el: e.currentTarget, exam });
  };

  const handleCloseMenu = () => setMenuAnchor(null);

  const handleEdit = () => {
    if (!menuAnchor) return;
    const target = menuAnchor.exam;
    setActiveView("modify");
    setExam(target);
    router.push(`/exam?screen=modify&examId=${target.id}`);
    handleCloseMenu();
  };

  const handleAskDelete = () => {
    if (!menuAnchor) return;
    setExam(menuAnchor.exam);
    setDeleteDialogOpen(true);
    handleCloseMenu();
  };

  const handleViewDetails = (target: ExamResponse) => {
    setExam(target);
    router.push(
      `exam/${target.examType.toLowerCase()}/${dayjs(target.examDate).format(
        "MMYYYY"
      )}/${target.meKun}`
    );
  };

  return (
    <>
      <Grid container spacing={3}>
        {list.map((examItem) => {
          const isSemester = examItem.examType === "SEMESTER";
          const accent = isSemester
            ? theme.palette.warning.main
            : theme.palette.info.main;

          return (
            <Grid size={{ xs: 12, sm: 6, lg: 4 }} key={examItem.id}>
              <Card
                variant="outlined"
                sx={{
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  position: "relative",
                  overflow: "hidden",
                  transition: "all .25s ease",
                  "&:hover": {
                    borderColor: alpha(accent, 0.5),
                    transform: "translateY(-3px)",
                    boxShadow: theme.shadows[3],
                  },
                  "&::before": {
                    content: '""',
                    position: "absolute",
                    inset: 0,
                    height: 4,
                    background: accent,
                  },
                }}
              >
                <CardContent
                  sx={{ flex: 1, pt: 3, display: "flex", flexDirection: "column" }}
                >
                  {/* Top row: type chip + actions */}
                  <Stack
                    direction="row"
                    alignItems="center"
                    justifyContent="space-between"
                    sx={{ mb: 1.5 }}
                  >
                    <Chip
                      icon={
                        isSemester ? (
                          <EventAvailableIcon sx={{ fontSize: 16 }} />
                        ) : (
                          <CalendarMonthIcon sx={{ fontSize: 16 }} />
                        )
                      }
                      label={t(
                        `Common.${examItem.examType?.toLowerCase()}`
                      )}
                      size="small"
                      sx={{
                        bgcolor: alpha(accent, 0.12),
                        color: accent,
                        border: `1px solid ${alpha(accent, 0.25)}`,
                        "& .MuiChip-icon": { color: accent },
                        fontWeight: 600,
                      }}
                    />
                    {enableEdit === "visible" && (
                      <Tooltip title={t("Common.manage")}>
                        <IconButton
                          size="small"
                          onClick={(e) => handleOpenMenu(e, examItem)}
                          sx={{
                            color: "text.secondary",
                            "&:hover": { color: "primary.main" },
                          }}
                        >
                          <MoreVertIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                  </Stack>

                  {/* Title */}
                  <Typography
                    variant="h6"
                    component="h4"
                    sx={{ fontWeight: 700, mb: 0.5, lineHeight: 1.3 }}
                  >
                    {examItem.title}
                  </Typography>

                  {/* Semester chip */}
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ mb: 1.5 }}
                  >
                    {t("Common.semesterNum", { num: examItem.semesterNumber })}
                  </Typography>

                  {/* Description */}
                  {examItem.description ? (
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{
                        mb: 2,
                        lineHeight: 1.5,
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                      }}
                    >
                      {examItem.description}
                    </Typography>
                  ) : (
                    <Box sx={{ mb: 2 }} />
                  )}

                  {/* Info rows */}
                  <Stack
                    direction="row"
                    spacing={1}
                    alignItems="center"
                    sx={{ color: "text.secondary", mb: 0.75 }}
                  >
                    <CalendarMonthIcon fontSize="small" />
                    <Typography variant="caption">
                      {examItem.examDate}
                      {examItem.time
                        ? ` • ${examItem.time.slice(0, 5)}`
                        : null}
                    </Typography>
                  </Stack>

                  <Stack direction="row" spacing={1.5} sx={{ mt: 1.25 }}>
                    <Chip
                      size="small"
                      icon={<StarsIcon sx={{ fontSize: 14 }} />}
                      label={`${t("Common.mekun")} · ${examItem.meKun}`}
                      sx={{
                        bgcolor: alpha(theme.palette.warning.main, 0.1),
                        color: theme.palette.warning.dark,
                        "& .MuiChip-icon": {
                          color: theme.palette.warning.main,
                        },
                        fontWeight: 600,
                      }}
                    />
                    {isSemester && (
                      <Chip
                        size="small"
                        label={`Sem · ${examItem.meKunSemester ?? 3}`}
                        sx={{
                          bgcolor: alpha(theme.palette.success.main, 0.1),
                          color: theme.palette.success.dark,
                          fontWeight: 600,
                        }}
                      />
                    )}
                  </Stack>
                </CardContent>

                <Divider />

                <Box sx={{ p: 1.5 }}>
                  <Button
                    fullWidth
                    variant="contained"
                    size="small"
                    startIcon={<VisibilityIcon />}
                    onClick={() => handleViewDetails(examItem)}
                    sx={{ textTransform: "none", fontWeight: 600 }}
                  >
                    {t("Exam.viewDetails")}
                  </Button>
                </Box>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      <Menu
        anchorEl={menuAnchor?.el ?? null}
        open={Boolean(menuAnchor)}
        onClose={handleCloseMenu}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <MenuItem onClick={handleEdit}>
          <ListItemIcon>
            <EditOutlinedIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>{t("Common.edit")}</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleAskDelete} sx={{ color: "error.main" }}>
          <ListItemIcon sx={{ color: "error.main" }}>
            <DeleteOutlineIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>{t("Common.delete")}</ListItemText>
        </MenuItem>
      </Menu>

      <DeleteConfirmationDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDeleteExam}
        itemName="exams"
        title={t("Common.titleDeleteConfirm")}
        message={t("Common.deleteConfirmation", {
          subject: t("Common.exam"),
        })}
        confirmText={t("Common.delete")}
        cancelText={t("Common.cancel")}
      />
    </>
  );
}
