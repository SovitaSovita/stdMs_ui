import * as React from "react";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Box from "@mui/material/Box";
import { useTranslations } from "next-intl";
import { StudentTabPanel } from "./StudentTabPanel";
import { SubjectTabPanel } from "./SubjectTabPanel";
import { ExamTabPanel } from "./ExamTabPanel";

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function CustomTabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && <Box pt={2.5}>{children}</Box>}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `simple-tab-${index}`,
    "aria-controls": `simple-tabpanel-${index}`,
  };
}

export default function CustomClassTab() {
  const t = useTranslations();
  const [value, setValue] = React.useState(0);

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  return (
    <Box sx={{ width: "100%" }}>
      <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
        <Tabs
          value={value}
          onChange={handleChange}
          aria-label="basic tabs example"
        >
          <Tab label={t("Common.student")} {...a11yProps(0)} />
          <Tab label={t("Common.subject")} {...a11yProps(1)} />
          <Tab label={t("Common.exam")} {...a11yProps(3)} />
          <Tab label={t("Common.attendance")} {...a11yProps(2)} />
        </Tabs>
      </Box>
      <CustomTabPanel value={value} index={0}>
        <StudentTabPanel />
      </CustomTabPanel>
      <CustomTabPanel value={value} index={1}>
        <SubjectTabPanel />
      </CustomTabPanel>
      <CustomTabPanel value={value} index={2}>
        <ExamTabPanel />
      </CustomTabPanel>
      <CustomTabPanel value={value} index={3}>
        <div className="w-full text-center">
          {t("Common.attendance")} Comming soon!!
        </div>
      </CustomTabPanel>
    </Box>
  );
}
