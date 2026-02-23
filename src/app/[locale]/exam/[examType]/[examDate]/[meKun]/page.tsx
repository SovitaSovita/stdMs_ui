"use client";

import { ImportScoreByAi } from "@/app/dashboard/components/Dialog/ImportScoreByAi";
import { HonorRollChart } from "@/app/dashboard/components/examType/HonorRollChart";
import { MonthlyNsemesterGrid } from "@/app/dashboard/components/examType/MonthlyNsemesterGrid";
import { SemesterlyAverageGrid } from "@/app/dashboard/components/examType/SemesterlyAverageGrid";
import { SemesterlyGrid } from "@/app/dashboard/components/examType/SemesterlyGrid";
import {
  classroomAtom,
  studentsAtom,
  top5StudentsAtom,
} from "@/app/libs/jotai/classroomAtom";
import { StudentMonthlyExamsAvgResponse } from "@/app/constants/type";
import { Box, Button, Tab, Tabs, Typography, useTheme } from "@mui/material";
import { useAtom, useSetAtom } from "jotai";
import { useTranslations } from "next-intl";
import { use, useState } from "react";

type Params = {
  examType: string;
  examDate: string;
  meKun: number;
};

interface TabPanelProps {
  children?: React.ReactNode;
  dir?: string;
  index: number;
  value: number;
}

export default function Page({ params }: { params: Promise<Params> }) {
  const { examType, examDate, meKun } = use(params);
  const theme = useTheme();
  const t = useTranslations();
  const setTop5Students = useSetAtom(top5StudentsAtom);

  //hide/show each scores cols of datagrid
  const [showSubjects, setShowSubjects] = useState<boolean>(true);
  const [tabValue, setTabValue] = useState(0);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setShowSubjects((prev) => newValue === 0); // Show subjects only on the first tab
    setTabValue(newValue);
  };

  // Handler to extract top 5 students and set atom
  const handleProcessedRowsChange = (rows: any[]) => {
    if (!rows || rows.length === 0) {
      setTop5Students([]);
      return;
    }
    // Filter and sort by mRanking, take top 5
    const top5 = rows
      .filter((row) => row.mRanking && row.mRanking >= 1 && row.mRanking <= 5)
      .sort((a, b) => a.mRanking - b.mRanking)
      .slice(0, 5);
    setTop5Students(top5);
  };

  return (
    <>
      <Box sx={{ width: "100%", maxWidth: { sm: "100%", md: "1700px" } }}>
        <div className="flex justify-between">
          <Typography
            component="h2"
            variant="h6"
            sx={{ mb: 2, textTransform: "capitalize" }}
          >
            {examType === "monthly"
              ? t("Common.monthly")
              : t("Common.semester")}
          </Typography>
        </div>

        <Box>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            indicatorColor="secondary"
            textColor="inherit"
            variant="fullWidth"
            aria-label="full width tabs example"
          >
            <Tab
              label={
                examType === "monthly"
                  ? t("MonthlyExam.monthlyScores")
                  : t("SemesterExam.semesterScores")
              }
              {...a11yProps(0)}
            />
            <Tab
              label={
                examType === "monthly"
                  ? t("MonthlyExam.viewRanking")
                  : t("SemesterExam.semesterlyAverageRanking")
              }
              {...a11yProps(1)}
            />
            {examType === "semester" && (
              <Tab label={t("SemesterExam.viewRanking")} {...a11yProps(2)} />
            )}

            <Tab
              label={t("MonthlyExam.viewHonorRollChart")}
              {...a11yProps(3)}
            />
          </Tabs>
          <TabPanel value={tabValue} index={0} dir={theme.direction}>
            {tabValue == 0 && examType === "monthly" ? (
              <MonthlyNsemesterGrid
                examDate={examDate}
                examType={examType}
                meKun={meKun}
                showSubjects={showSubjects}
                onProcessedRowsChange={handleProcessedRowsChange}
              />
            ) : (
              <SemesterlyGrid
                examDate={examDate}
                examType={examType}
                meKun={meKun}
                onProcessedRowsChange={handleProcessedRowsChange}
              />
            )}
          </TabPanel>
          <TabPanel value={tabValue} index={1} dir={theme.direction}>
            {tabValue == 1 && examType === "monthly" ? (
              <MonthlyNsemesterGrid
                examDate={examDate}
                examType={examType}
                meKun={meKun}
                showSubjects={showSubjects}
                onProcessedRowsChange={handleProcessedRowsChange}
              />
            ) : (
              <SemesterlyAverageGrid
                examDate={examDate}
                examType={examType}
                isShow={false}
                onProcessedRowsChange={handleProcessedRowsChange}
              />
            )}
          </TabPanel>
          {tabValue == 2 && examType === "semester" && (
            <TabPanel value={tabValue} index={2} dir={theme.direction}>
              <SemesterlyAverageGrid
                examDate={examDate}
                examType={examType}
                isShow={true}
                onProcessedRowsChange={handleProcessedRowsChange}
              />
            </TabPanel>
          )}

          {/* Honor Roll Chart Tab */}
          <TabPanel value={tabValue} index={examType === "monthly" ? 2 : 3} dir={theme.direction}>
            { tabValue == (examType === "monthly" ? 2 : 3) && <HonorRollChart />}
          </TabPanel>
        </Box>
      </Box>
    </>
  );
}

function a11yProps(index: number) {
  return {
    id: `full-width-tab-${index}`,
    "aria-controls": `full-width-tabpanel-${index}`,
  };
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`full-width-tabpanel-${index}`}
      aria-labelledby={`full-width-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}
