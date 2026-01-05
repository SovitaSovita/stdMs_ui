import { Box, Card, CardContent, Stack, Typography } from "@mui/material";
import React, { useCallback, useEffect } from "react";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import GroupIcon from "@mui/icons-material/Group";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import AssignmentIcon from "@mui/icons-material/Assignment";
import AnalyticsIcon from "@mui/icons-material/Analytics";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import { useSession } from "next-auth/react";
import {
  classroomAtom,
  studentsAtom,
  subjectsAtom,
} from "@/app/libs/jotai/classroomAtom";
import { useAtom, useAtomValue } from "jotai";
import { useTranslations } from "next-intl";
import Link from "next/link";
import StudentService from "@/app/service/StudentService";
import SubjectService from "@/app/service/SubjectService";
import useClassroomData from "@/app/libs/hooks/useClassroomData";

export default function MainComponent() {
  const { data: session, status }: { data: any; status: any } = useSession();
  const classroom = useAtomValue(classroomAtom);
  const t = useTranslations();
  const { students, subjects, exams, refetch } = useClassroomData(classroom);

  return (
    <Box sx={{ width: "100%", maxWidth: { sm: "100%", md: "1700px" } }}>
      <Box display={"flex"} mb={2} gap={1} justifyContent={"space-between"}>
        <Box>
          <Typography
            component="h2"
            variant="h6"
            sx={{ display: { xs: "none", sm: "block" } }}
          >
            Dashboard Overview
          </Typography>
          <Typography
            component="p"
            variant="subtitle2"
            sx={{
              display: { xs: "none", sm: "block" },
              color: "text.secondary",
            }}
          >
            {t("Dashboard.welcome", { name: session?.user?.fullname || "User" })}
          </Typography>
        </Box>
      </Box>

      {/* <!-- Stats Grid --> */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {/* <!-- Stat Card 1 --> */}
        <Link href={"/classrooms"}>
          <Card variant="outlined" sx={{ height: "100%", flexGrow: 1 }}>
            <CardContent className="relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <GroupIcon sx={{ fontSize: 60 }} />
              </div>
              <div className="flex items-start justify-between mb-4">
                <div className="p-2 bg-blue-500/10 rounded-lg">
                  <GroupIcon color="primary" />
                </div>
                {/* <span className="flex items-center text-xs font-medium text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-full">
                  <TrendingUpIcon fontSize="inherit" className="mr-1" />
                  <Typography variant="caption">+2.4%</Typography>
                </span> */}
              </div>
              <Typography className="text-slate-400 text-sm font-medium mb-1">
                {t("Dashboard.totalStudents")}
              </Typography>
              <Typography variant="h3" component="div" fontWeight={600}>
                {students?.total}
              </Typography>
            </CardContent>
          </Card>
        </Link>

        {/* <!-- Stat Card 2 --> */}
        <Link href={"/classrooms"}>
          <Card variant="outlined" sx={{ height: "100%", flexGrow: 1 }}>
            <CardContent className="relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <MenuBookIcon sx={{ fontSize: 60 }} />
              </div>
              <div className="flex items-start justify-between mb-4">
                <div className="p-2 bg-purple-500/10 rounded-lg">
                  <MenuBookIcon color="secondary" />
                </div>
              </div>
              <Typography className="text-slate-400 text-sm font-medium mb-1">
                {t("Dashboard.totalSubjects")}
              </Typography>
              <Typography variant="h3" component="div" fontWeight={600}>
                {subjects?.length}
              </Typography>
            </CardContent>
          </Card>
        </Link>

        {/* <!-- Stat Card 3 --> */}
        <Link href={"/exam"}>
          <Card variant="outlined" sx={{ height: "100%", flexGrow: 1 }}>
            <CardContent className="relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <AssignmentIcon sx={{ fontSize: 60 }} />
              </div>
              <div className="flex items-start justify-between mb-4">
                <div className="p-2 bg-orange-500/10 rounded-lg">
                  <AssignmentIcon className="text-orange-400" />
                </div>
              </div>
              <Typography className="text-slate-400 text-sm font-medium mb-1">
                {t("Dashboard.totalExams")}
              </Typography>
              <Typography variant="h3" component="div" fontWeight={600}>
                {exams?.length}
              </Typography>
            </CardContent>
          </Card>
        </Link>

        {/* <!-- Stat Card 4 --> */}
        <Card variant="outlined" sx={{ height: "100%", flexGrow: 1 }}>
          <CardContent className="relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <AnalyticsIcon sx={{ fontSize: 60 }} />
            </div>
            <div className="flex items-start justify-between mb-4">
              <div className="p-2 bg-emerald-500/10 rounded-lg">
                <AnalyticsIcon className="text-emerald-400" />
              </div>
              <span className="flex items-center text-xs font-medium text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-full">
                <ArrowUpwardIcon fontSize="inherit" className="mr-1" />
                5%
              </span>
            </div>
            <Typography className="text-slate-400 text-sm font-medium mb-1">
              {t("Dashboard.avgClassScore")}
            </Typography>
            <Typography variant="h3" component="div" fontWeight={600}>
              85%
            </Typography>
          </CardContent>
        </Card>
      </div>
    </Box>
  );
}
