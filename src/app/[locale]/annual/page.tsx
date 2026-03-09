"use client";

import React, { useCallback, useEffect } from "react";
import {examAtom, 
  classroomAtom,
  top5StudentsAtom,
} from "@/app/libs/jotai/classroomAtom";
import { Box, Tab, Tabs, Typography, useTheme } from "@mui/material";
import { useAtomValue, useSetAtom } from "jotai";
import { useTranslations } from "next-intl";
import { useState } from "react";
import useNotifications from "@/app/libs/hooks/useNotifications/useNotifications";
import AnnualReport from "@/app/dashboard/components/annual/AnnualReport";
import { HonorRollChart } from "@/app/dashboard/components/examType/HonorRollChart";
import { StudentAnnualAvgResponse } from "@/app/constants/type";
import ClassroomService from "@/app/service/ClassroomService";

interface TabPanelProps {
  children?: React.ReactNode;
  dir?: string;
  index: number;
  value: number;
}

export default function page() {
  const t = useTranslations();
  const theme = useTheme();
  const [isShow, setIsShow] = useState<boolean>(false);
  const setTop5Students = useSetAtom(top5StudentsAtom);
  const [tabValue, setTabValue] = useState(0);
  const exam = useAtomValue(examAtom);
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setIsShow((prev) => newValue === 0); // Show subjects only on the first tab
    setTabValue(newValue);
  };

  const [rows, setRows] = useState<StudentAnnualAvgResponse[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const classroom = useAtomValue(classroomAtom);
  const notification = useNotifications();

  const fetchAnnual = useCallback(async () => {
    try {
      if (!classroom?.id) return;
      if (!exam?.semesterNumber) return;

      setIsLoading(true);
      const result = await ClassroomService.getAnnualAvgs(classroom?.id);
      if (result) {
        setRows(result?.students);
        handleProcessedRowsChange(result?.students);
      }
    } catch {
      // swallow – we just show “no data”
    } finally {
      setIsLoading(false);
    }
  }, [classroom?.id, exam?.semesterNumber, exam?.meKunSemester]);

  useEffect(() => {
    if (classroom) {
      fetchAnnual();
    }
  }, [fetchAnnual, classroom?.id]);

  // Handler to extract top 5 students and set atom
  const handleProcessedRowsChange = (rows: any[]) => {
    if (!rows || rows.length === 0) {
      setTop5Students([]);
      return;
    }

    // Filter and sort by appropriate ranking, take top 5
    const rankingField = "annualRanking";
    const top5 = rows
      .filter((row) => {
        const val = row[rankingField];
        return val && val >= 1 && val <= 5;
      })
      .sort((a, b) => a[rankingField] - b[rankingField])
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
            {t("Annual.title")}
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
            <Tab label={t("Annual.annualAverage")} {...a11yProps(0)} />
            <Tab label={t("Annual.annualAverageRanking")} {...a11yProps(1)} />

            <Tab label={t("Annual.honorRoll")} {...a11yProps(3)} />
          </Tabs>
          <TabPanel value={tabValue} index={0} dir={theme.direction}>
            <AnnualReport
              isShow={true}
              rows={rows}
            />
          </TabPanel>
          <TabPanel value={tabValue} index={1} dir={theme.direction}>
            <AnnualReport
              isShow={false}
              rows={rows}
            />
          </TabPanel>
          <TabPanel value={tabValue} index={2} dir={theme.direction}>
            <HonorRollChart />
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
