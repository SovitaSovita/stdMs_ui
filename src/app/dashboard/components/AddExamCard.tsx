"use client";

import * as React from "react";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import InsightsRoundedIcon from "@mui/icons-material/InsightsRounded";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useTheme } from "@mui/material/styles";
import { useRouter } from "next/navigation";
import { useAtom, useAtomValue } from "jotai";
import { ScreenExamAtom } from "@/app/libs/jotai/commonAtom";

export default function AddExamCard() {
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down("sm"));
  const router = useRouter();
  const [activeView, setActiveView] = useAtom(ScreenExamAtom);
  
  const handleClick = () => {
    setActiveView("create")
  };

  return (
    <Card sx={{ height: "100%", grid: 6 }} className="w-full">
      <CardContent>
        <InsightsRoundedIcon />
        <Typography
          component="h2"
          variant="subtitle2"
          gutterBottom
          sx={{ fontWeight: "600" }}
        >
          Create New Exam
        </Typography>
        <Typography sx={{ color: "text.secondary", mb: "8px" }} className="line-clamp-2">
          Create new exam type Montly or Semester exam
        </Typography>
        <Button
          variant="contained"
          size="small"
          color="primary"
          endIcon={<ChevronRightRoundedIcon />}
          fullWidth={isSmallScreen}
          onClick={handleClick}
        >
          Create Exam
        </Button>
      </CardContent>
    </Card>
  );
}
