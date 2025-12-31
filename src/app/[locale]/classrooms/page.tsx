"use client";

import { StudentsInfo, StuInfoDetailResponseType } from "@/app/constants/type";
import CustomizedTreeView from "@/app/dashboard/components/CustomizedTreeView";
import DashboardLayout from "@/app/dashboard/DashboardLayout";
import { classroomAtom, studentsAtom, subjectsAtom } from "@/app/libs/jotai/classroomAtom";
import ClassroomService from "@/app/service/ClassroomService";
import StudentService from "@/app/service/StudentService";
import { Box, Card, Chip, Divider, Stack, Typography } from "@mui/material";
import Grid from "@mui/material/Grid";
import { DataGrid, GridColDef, GridRenderCellParams } from "@mui/x-data-grid";
import dayjs from "dayjs";
import { useAtom, useAtomValue } from "jotai";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useState } from "react";
import SubjectService from "@/app/service/SubjectService";
import { SubjectResponse } from "@/app/constants/type/SubjectType";
import CustomClassTab from "@/app/dashboard/components/Common/Classroom/CustomClassTab";

export default function Page() {
  const { data: session, status }: { data: any; status: any } = useSession();
  const classroom = useAtomValue(classroomAtom);
  const t = useTranslations();

  const [students, setStudents] = useAtom(studentsAtom);
  const [subjects, setSubjects] = useAtom(subjectsAtom);

  const getStudentsInfo = useCallback(async () => {
    if (classroom) {
      const result = await StudentService.getInfoList(classroom?.id);
      if (result) {
        setStudents(result);
      }
    }
  }, [classroom?.id]);

  const getSubjects = useCallback(async () => {
    if (classroom) {
      const result = await SubjectService.getByClassId(classroom.id);
      if (result.length > 0) {
        setSubjects(result);
      } else setSubjects([]);
    }
  }, [classroom?.id]);

  useEffect(() => {
    getStudentsInfo();
    getSubjects();
  }, [getStudentsInfo, getSubjects]);

  return (
    <>
      <Box sx={{ width: "100%", maxWidth: { sm: "100%", md: "1700px" } }}>
        <Card
          sx={{
            borderRadius: 3,
            p: 2,
            boxShadow: "none",
          }}
        >
          <Grid container spacing={4} alignItems="center">
            {/* Left Details */}
            <Grid size={{ xs: 12, md: 7 }}>
              <Grid container spacing={3}>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <Typography
                    fontSize={14}
                    fontWeight={500}
                    color="textSecondary"
                  >
                    {t("Classroom.className")}
                  </Typography>
                  <Typography fontSize={18} fontWeight={600}>
                    {classroom?.name}
                  </Typography>
                </Grid>

                <Grid size={{ xs: 12, sm: 4 }}>
                  <Typography
                    fontSize={14}
                    fontWeight={500}
                    color="textSecondary"
                  >
                    {t("Classroom.gradeName")}
                  </Typography>
                  <Typography fontSize={18} fontWeight={600}>
                    {t("Common.grade")} {classroom?.grade}
                  </Typography>
                </Grid>

                <Grid size={{ xs: 12, sm: 4 }}>
                  <Typography
                    fontSize={14}
                    fontWeight={500}
                    color="textSecondary"
                  >
                    {t("Classroom.yearOfStudying")}
                  </Typography>
                  <Typography fontSize={18} fontWeight={600}>
                    {classroom?.year}
                  </Typography>
                </Grid>
              </Grid>
            </Grid>

            {/* Divider */}
            <Grid size={{ md: 0.3 }} display={{ xs: "none", md: "block" }}>
              <Divider orientation="vertical" color="textSecondary" />
            </Grid>

            {/* Right Stats */}
            <Grid size={{ xs: 12, md: 4.7 }}>
              <Box display="flex" gap={6}>
                {/* Total Students */}
                <Box>
                  <Typography
                    fontSize={14}
                    fontWeight={500}
                    mb={0.5}
                    color="textSecondary"
                  >
                    {t("Classroom.totalStu")}
                  </Typography>

                  <Typography fontSize={32} fontWeight={700}>
                    {students?.total}{" "}
                    <Typography
                      fontSize={14}
                      fontWeight={500}
                      mb={0.5}
                      component={"span"}
                      color="textSecondary"
                    >
                      {t("Common.people")}
                    </Typography>
                  </Typography>
                </Box>

                {/* Total Subjects */}
                <Box>
                  <Typography
                    fontSize={14}
                    fontWeight={500}
                    mb={0.5}
                    color="textSecondary"
                  >
                    {t("Classroom.totalSub")}
                  </Typography>

                  <Typography fontSize={32} fontWeight={700}>
                    {subjects?.length}{" "}
                    <Typography
                      fontSize={14}
                      fontWeight={500}
                      mb={0.5}
                      component={"span"}
                      color="textSecondary"
                    >
                      {t("Common.subject")}
                    </Typography>
                  </Typography>
                </Box>
              </Box>
            </Grid>
          </Grid>
        </Card>

        {/* ------Tabs------ */}
        <Box mt={2.5}>
          <CustomClassTab />
        </Box>
      </Box>
    </>
  );
}
