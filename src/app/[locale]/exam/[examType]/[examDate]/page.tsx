"use client";

import { MonthlyNsemesterGrid } from "@/app/dashboard/components/examType/MonthlyNsemesterGrid";
import { SemesterlyGrid } from "@/app/dashboard/components/examType/SemesterlyGrid";
import { Box, Tab, Tabs, Typography, useTheme } from "@mui/material";
import { useTranslations } from "next-intl";
import { use, useState } from "react";

type Params = {
  examType: string;
  examDate: string;
};

interface TabPanelProps {
  children?: React.ReactNode;
  dir?: string;
  index: number;
  value: number;
}

export default function Page({ params }: { params: Promise<Params> }) {
  const { examType, examDate } = use(params);
  const theme = useTheme();
  const t = useTranslations();

  //hide/show each scores cols of datagrid
  const [showSubjects, setShowSubjects] = useState<boolean>(true);
  const [tabValue, setTabValue] = useState(0);
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setShowSubjects((prev) => !prev);
    setTabValue(newValue);
  };

  console.log(tabValue);

  return (
    <>
      <Box sx={{ width: "100%", maxWidth: { sm: "100%", md: "1700px" } }}>
        <div className="flex justify-between">
          <Typography component="h2" variant="h6" sx={{ mb: 2, textTransform: "capitalize" }}>
            {examType === "monthly" ? t("Common.monthly") : t("Common.semester")}
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
          </Tabs>
          <TabPanel value={tabValue} index={0} dir={theme.direction}>
            {tabValue == 0 && examType === "monthly" ? (
              <MonthlyNsemesterGrid
                examDate={examDate}
                examType={examType}
                showSubjects={showSubjects}
              />
            ) : (
              <SemesterlyGrid examDate={examDate} examType={examType} />
            )}
          </TabPanel>
          <TabPanel value={tabValue} index={1} dir={theme.direction}>
            {tabValue == 1 && examType === "monthly" ? (
              <MonthlyNsemesterGrid
                examDate={examDate}
                examType={examType}
                showSubjects={showSubjects}
              />
            ) : (
              <SemesterlyGrid examDate={examDate} examType={examType} />
            )}
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
