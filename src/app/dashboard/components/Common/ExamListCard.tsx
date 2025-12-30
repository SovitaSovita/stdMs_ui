"use client";

import * as React from "react";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useTheme } from "@mui/material/styles";
import { ExamResponse } from "@/app/constants/type";
import { useTranslations } from "next-intl";
import { Chip, IconButton, Menu, MenuItem } from "@mui/material";
import ExamService from "@/app/service/ExamService";
import { useAtom } from "jotai";
import { showAlertAtom } from "@/app/libs/jotai/alertAtom";
import { ScreenExamAtom } from "@/app/libs/jotai/commonAtom";
import dayjs from "dayjs";
import { useRouter } from "next/navigation";

type ExamListCardProps = {
  row: ExamResponse;
  setExam: React.Dispatch<React.SetStateAction<ExamResponse | undefined>>;
  handleGetExams: () => void;
};

export default function ExamListCard(props: ExamListCardProps) {
  const { row, setExam, handleGetExams } = props;
  const theme = useTheme();
  const router = useRouter();
  const t = useTranslations("Common");
  const [activeView, setActiveView] = useAtom(ScreenExamAtom);
  const [, showAlert] = useAtom(showAlertAtom);

  const isSmallScreen = useMediaQuery(theme.breakpoints.down("sm"));

  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleDeleteExam = async (id: string) => {
    try {
      if (!id) return;
      const result = await ExamService.delete(id);
      if (result?.status == 200) {
        showAlert({
          message: result?.message || "Deleted successfully.",
          severity: "success",
        });
      }
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.detail ||
        error?.message ||
        "An error occurred while creating the exam";

      showAlert({
        message: errorMessage,
        severity: "error",
      });
    } finally {
      handleClose();
      handleGetExams();
    }
  };

  return (
    <Card sx={{ height: "100%", grid: 6 }} className="w-full">
      <CardContent>
        <Typography
          height={50}
          component="h2"
          variant="subtitle2"
          gutterBottom
          sx={{ fontWeight: "600" }}
          className="line-clamp-2"
        >
          {row?.title}
        </Typography>
        <Typography
          component="h2"
          variant="subtitle2"
          gutterBottom
          sx={{ fontWeight: "600" }}
        >
          <Chip
            label={t(row?.examType.toLowerCase())}
            color={row?.examType === "SEMESTER" ? "warning" : "primary"}
            variant="outlined"
          />
        </Typography>

        <Typography sx={{ color: "text.secondary", mb: "8px" }}>
          {dayjs(row?.examDate).format("MM-YYYY")}
        </Typography>

        <div className="flex justify-between items-center">
          <Button
            variant="contained"
            size="small"
            color="primary"
            endIcon={<ChevronRightRoundedIcon />}
            fullWidth={isSmallScreen}
            onClick={() => router.push(`exam/${row?.examType.toLowerCase()}/${dayjs(row?.examDate).format("MMYYYY")}`)}
          >
            View
          </Button>

          {/* Edit || Delete tab */}
          <div>
            <IconButton
              aria-label="option-menu"
              aria-controls="menu-appbar"
              aria-haspopup="true"
              size="small"
              onClick={handleMenu}
              color="inherit"
            >
              <MoreVertIcon fontSize="small" />
            </IconButton>
            <Menu
              id="menu-appbar"
              anchorEl={anchorEl}
              anchorOrigin={{
                vertical: "top",
                horizontal: "right",
              }}
              keepMounted
              transformOrigin={{
                vertical: "top",
                horizontal: "right",
              }}
              open={Boolean(anchorEl)}
              onClose={handleClose}
            >
              <MenuItem
                onClick={() => {
                  setActiveView("modify");
                  setExam(row);
                }}
              >
                Edit
              </MenuItem>
              <MenuItem sx={{color: "red", fontWeight: 600}} onClick={() => {
                if(confirm("Do you still want to Delete this Exam?")){
                  handleDeleteExam(row?.id);
                }
              }}>
                Delete
              </MenuItem>
            </Menu>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
