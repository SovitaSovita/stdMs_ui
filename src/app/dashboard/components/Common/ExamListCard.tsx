"use client";

import * as React from "react";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useTheme } from "@mui/material/styles";
import { ExamResponse } from "@/app/constants/type";
import { useTranslations } from "next-intl";
import { Box, Chip, Grid, IconButton, Menu, MenuItem } from "@mui/material";
import ExamService from "@/app/service/ExamService";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { showAlertAtom } from "@/app/libs/jotai/alertAtom";
import { ScreenExamAtom } from "@/app/libs/jotai/commonAtom";
import dayjs from "dayjs";
import { useRouter } from "next/navigation";
import useClassroomData from "@/app/libs/hooks/useClassroomData";
import { classroomAtom, examAtom } from "@/app/libs/jotai/classroomAtom";
import useNotifications from "@/app/libs/hooks/useNotifications/useNotifications";
import { DeleteConfirmationDialog } from "../Dialog/DeleteConfirmationDialog";
import AddIcon from "@mui/icons-material/Add";
import EmptyStateCard from "./EmptyStateCard";

type ExamListCardProps = {
  enableEdit?: "visible" | "hidden";
};

export default function ExamListCard(props: ExamListCardProps) {
  const { enableEdit = "visible" } = props;
  const router = useRouter();
  const t = useTranslations();
  const setActiveView = useSetAtom(ScreenExamAtom);
  const classroom = useAtomValue(classroomAtom);
  const { exams, refetch } = useClassroomData(classroom);
  const [exam, setExam] = useAtom(examAtom);
  const notification = useNotifications();
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);

  const handleDeleteExam = async () => {
    try {
      if (!exam?.id) return;
      const result = await ExamService.delete(exam?.id);
      if (result?.status == 200) {
        notification.show("Exam deleted successfully.", {
          severity: "success",
          autoHideDuration: 3000,
        });
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
    } finally {
      refetch.fetchExams();
    }
  };

  const renderEmptyState = () => {
    return (
      <EmptyStateCard
        title={t("Exam.noExams")}
        buttonLabel={t("Exam.createExam")}
        onButtonClick={() => {
          setActiveView("create");
          router.push("/exam?screen=create");
        }}
      />
    );
  };

  if (exams.length == 0) {
    return renderEmptyState();
  }

  return (
    <Grid container spacing={3}>
      {exams.map((exam) => (
        <Grid size={{ xs: 12, sm: 6, lg: 4 }} key={exam.id}>
          <Card
            sx={{
              height: "100%",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              border: "1px solid",
              borderColor: "divider",
              transition: "all 0.3s ease",
              "&:hover": {
                borderColor: "primary.main",
                transform: "translateY(-4px)",
                boxShadow: 2,
              },
              "&:hover .action-buttons": {
                opacity: 1,
              },
            }}
          >
            <CardContent>
              <Box
                display="flex"
                justifyContent="space-between"
                alignItems="flex-start"
                mb={2}
              >
                <Chip
                  label={exam.examType}
                  color={exam?.examType === "SEMESTER" ? "warning" : "primary"}
                  size="small"
                  variant="outlined"
                />
                <Box
                  visibility={enableEdit}
                  className="action-buttons"
                  display="flex"
                  gap={1}
                  sx={{
                    opacity: 0,
                    transition: "opacity 0.3s ease",
                  }}
                >
                  <button
                    onClick={() => {
                      setActiveView("modify");
                      setExam(exam);
                      router.push(`/exam?screen=modify&examId=${exam?.id}`);
                    }}
                    className="p-1 text-[#9dabb9] hover:text-white hover:bg-[#283039] rounded"
                  >
                    <span className="material-symbols-outlined text-sm">
                      {t("Common.edit")}
                    </span>
                  </button>
                  <button
                    onClick={() => {
                      setDeleteDialogOpen(true);
                    }}
                    className="p-1 text-[#9dabb9] hover:text-red-400 hover:bg-[#283039] rounded"
                  >
                    <span className="material-symbols-outlined text-sm">
                      {t("Common.delete")}
                    </span>
                  </button>
                </Box>
              </Box>

              <Typography variant="h6" component="h4" fontWeight={600} mb={1}>
                {exam?.title}
              </Typography>

              <Typography
                variant="body2"
                color="textSecondary"
                mb={3}
                sx={{ lineHeight: 1.4 }}
              >
                {exam?.description}
              </Typography>

              <Box
                display="flex"
                alignItems="center"
                gap={1}
                color="textSecondary"
              >
                <CalendarMonthIcon fontSize="small" />
                <Typography variant="caption">
                  {dayjs(exam?.examDate).format("DD-MM-YYYY")} •{" "}
                  {exam?.examTime}
                </Typography>
              </Box>
            </CardContent>

            <Box
              sx={{
                p: 2,
                pb: 0,
                borderTop: "1px solid",
                borderColor: "divider",
              }}
            >
              <Button
                fullWidth
                variant="outlined"
                size="small"
                onClick={() =>
                  router.push(
                    `exam/${exam?.examType.toLowerCase()}/${dayjs(
                      exam?.examDate
                    ).format("MMYYYY")}/${exam?.meKun}`
                  )
                }
              >
                View Details
              </Button>
            </Box>
          </Card>
        </Grid>
      ))}

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
    </Grid>
  );
}
