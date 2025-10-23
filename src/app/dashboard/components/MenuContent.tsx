"use client";

import * as React from "react";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Stack from "@mui/material/Stack";
import HomeRoundedIcon from "@mui/icons-material/HomeRounded";
import AnalyticsRoundedIcon from "@mui/icons-material/AnalyticsRounded";
import PeopleRoundedIcon from "@mui/icons-material/PeopleRounded";
import AssignmentRoundedIcon from "@mui/icons-material/AssignmentRounded";
import SettingsRoundedIcon from "@mui/icons-material/SettingsRounded";
import InfoRoundedIcon from "@mui/icons-material/InfoRounded";
import HelpRoundedIcon from "@mui/icons-material/HelpRounded";
import { usePathname, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

const mainListItems = [
  { key: "home", text: "Home", icon: <HomeRoundedIcon />, path: "/" },
  {
    key: "classroom",
    text: "Classroom",
    icon: <AnalyticsRoundedIcon />,
    path: "/classrooms",
  },
  {
    key: "student",
    text: "Student",
    icon: <PeopleRoundedIcon />,
    path: "/students",
  },
  {
    key: "monthlyExam",
    text: "Monthly Exam",
    icon: <AssignmentRoundedIcon />,
    path: "/monthly-exam",
  },
];

const secondaryListItems = [
  {
    key: "setting",
    text: "Settings",
    icon: <SettingsRoundedIcon />,
    path: "/settings",
  },
  { key: "about", text: "About", icon: <InfoRoundedIcon />, path: "/about" },
  {
    key: "feedback",
    text: "Feedback",
    icon: <HelpRoundedIcon />,
    path: "/feedback",
  },
];

export default function MenuContent() {
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations("MenuList");

  return (
    <Stack
      className="font-siemreap"
      sx={{ flexGrow: 1, p: 1, justifyContent: "space-between" }}
    >
      <List dense>
        {mainListItems.map((item, index) => (
          <ListItem key={index} disablePadding sx={{ display: "block" }}>
            <ListItemButton
              selected={pathname === item.path}
              onClick={() => router.push(item.path)}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={t(item.key)} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
      <List dense>
        {secondaryListItems.map((item, index) => (
          <ListItem key={index} disablePadding sx={{ display: "block" }}>
            <ListItemButton
              selected={pathname === item.path}
              onClick={() => router.push(item.path)}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={t(item.key)} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Stack>
  );
}
