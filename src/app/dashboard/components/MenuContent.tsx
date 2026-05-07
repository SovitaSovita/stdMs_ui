"use client";

import * as React from "react";
import { alpha, useTheme } from "@mui/material/styles";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Stack from "@mui/material/Stack";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import Collapse from "@mui/material/Collapse";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import { useSidebar } from "./SidebarContext";
import HomeRoundedIcon from "@mui/icons-material/HomeRounded";
import GroupsRoundedIcon from "@mui/icons-material/GroupsRounded";
import LibraryBooksRoundedIcon from "@mui/icons-material/LibraryBooksRounded";
import AssignmentRoundedIcon from "@mui/icons-material/AssignmentRounded";
import BarChartRoundedIcon from "@mui/icons-material/BarChartRounded";
import TrackChangesRoundedIcon from "@mui/icons-material/TrackChangesRounded";
import MenuBookRoundedIcon from "@mui/icons-material/MenuBookRounded";
import CasinoRoundedIcon from "@mui/icons-material/CasinoRounded";
import Diversity3RoundedIcon from "@mui/icons-material/Diversity3Rounded";
import TimerRoundedIcon from "@mui/icons-material/TimerRounded";
import EmojiEventsRoundedIcon from "@mui/icons-material/EmojiEventsRounded";
import QuizRoundedIcon from "@mui/icons-material/QuizRounded";
import InfoRoundedIcon from "@mui/icons-material/InfoRounded";
import HelpRoundedIcon from "@mui/icons-material/HelpRounded";
import { usePathname, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

type NavItem = {
  key: string;
  icon: React.ReactNode;
  path: string;
};

const mainListItems: NavItem[] = [
  { key: "home", icon: <HomeRoundedIcon />, path: "/" },
  { key: "student", icon: <GroupsRoundedIcon />, path: "/students" },
  { key: "subject", icon: <LibraryBooksRoundedIcon />, path: "/subjects" },
  { key: "exam", icon: <AssignmentRoundedIcon />, path: "/exam" },
];

const classroomFunItems: NavItem[] = [
  { key: "picker", icon: <CasinoRoundedIcon />, path: "/picker" },
  { key: "teams", icon: <Diversity3RoundedIcon />, path: "/teams" },
  { key: "timer", icon: <TimerRoundedIcon />, path: "/timer" },
  { key: "quiz", icon: <QuizRoundedIcon />, path: "/quiz" },
];

const reportListItems: NavItem[] = [
  { key: "annual", icon: <BarChartRoundedIcon />, path: "/annual" },
  { key: "tracker", icon: <TrackChangesRoundedIcon />, path: "/tracker" },
  { key: "record", icon: <MenuBookRoundedIcon />, path: "/record" },
];

const secondaryListItems: NavItem[] = [
  { key: "about", icon: <InfoRoundedIcon />, path: "/about" },
  { key: "feedback", icon: <HelpRoundedIcon />, path: "/feedback" },
];

const LOCALES = ["km", "en"];

export default function MenuContent() {
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations("MenuList");
  const theme = useTheme();
  const { collapsed } = useSidebar();

  // "Classroom fun" section — collapsible, defaults to closed.
  // The user's preference is persisted across reloads.
  const FUN_STORAGE_KEY = "funMenuOpen";
  const [funOpen, setFunOpen] = React.useState(false);
  React.useEffect(() => {
    try {
      const v = localStorage.getItem(FUN_STORAGE_KEY);
      if (v === "1") setFunOpen(true);
    } catch {
      /* ignore */
    }
  }, []);
  const toggleFun = () => {
    setFunOpen((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(FUN_STORAGE_KEY, next ? "1" : "0");
      } catch {
        /* ignore */
      }
      return next;
    });
  };

  const pathnameSplit = React.useMemo(() => {
    const regex = new RegExp(`^/(${LOCALES.join("|")})(?=/|$)`);
    return pathname.replace(regex, "") || "/";
  }, [pathname]);

  const isSelected = React.useCallback(
    (path: string) => {
      if (path === "/") return pathnameSplit === "/";
      return pathnameSplit === path || pathnameSplit.startsWith(`${path}/`);
    },
    [pathnameSplit]
  );

  const renderItem = (item: NavItem) => {
    const selected = isSelected(item.path);
    const button = (
      <ListItemButton
        selected={selected}
        onClick={() => router.push(item.path)}
        sx={{
          borderRadius: 1.5,
          py: 0.875,
          px: collapsed ? 0 : 1.25,
          minHeight: 44,
          justifyContent: collapsed ? "center" : "flex-start",
          position: "relative",
          transition: "all .15s ease",
          color: "text.secondary",
          "& .MuiListItemIcon-root": {
            color: "text.secondary",
            minWidth: collapsed ? 0 : 36,
            justifyContent: "center",
            transition: "color .15s ease",
          },
          "&:hover": {
            bgcolor: alpha(theme.palette.primary.main, 0.06),
            color: "text.primary",
            "& .MuiListItemIcon-root": { color: "text.primary" },
          },
          "&.Mui-selected": {
            bgcolor: alpha(theme.palette.primary.main, 0.12),
            color: "primary.main",
            "& .MuiListItemIcon-root": { color: "primary.main" },
            "&:hover": {
              bgcolor: alpha(theme.palette.primary.main, 0.16),
            },
            // Left accent bar (hidden when collapsed)
            "&::before": collapsed
              ? undefined
              : {
                  content: '""',
                  position: "absolute",
                  left: 4,
                  top: 8,
                  bottom: 8,
                  width: 3,
                  borderRadius: 2,
                  bgcolor: "primary.main",
                },
          },
        }}
      >
        <ListItemIcon>{item.icon}</ListItemIcon>
        {!collapsed && (
          <ListItemText
            primary={t(item.key)}
            primaryTypographyProps={{
              fontSize: 14,
              fontWeight: selected ? 600 : 500,
            }}
          />
        )}
      </ListItemButton>
    );

    return (
      <ListItem key={item.key} disablePadding sx={{ display: "block", px: 1 }}>
        {collapsed ? (
          <Tooltip title={t(item.key)} placement="right" arrow>
            {button}
          </Tooltip>
        ) : (
          button
        )}
      </ListItem>
    );
  };

  return (
    <Stack
      className="font-siemreap"
      sx={{ flexGrow: 1, py: 1, justifyContent: "space-between" }}
    >
      <Stack spacing={0.25}>
        {!collapsed && <SectionLabel>{t("sectionMain")}</SectionLabel>}
        <List dense disablePadding>
          {mainListItems.map(renderItem)}
        </List>

        {!collapsed && <SectionLabel>{t("sectionReports")}</SectionLabel>}
        <List dense disablePadding>
          {reportListItems.map(renderItem)}
        </List>

        {collapsed ? (
          // Mini-mode: always render the icons; tooltips on hover handle labels.
          <List dense disablePadding>
            {classroomFunItems.map(renderItem)}
          </List>
        ) : (
          <>
            <CollapsibleSectionLabel
              open={funOpen}
              onToggle={toggleFun}
            >
              {t("sectionFun")}
            </CollapsibleSectionLabel>
            <Collapse in={funOpen} timeout="auto" unmountOnExit>
              <List dense disablePadding>
                {classroomFunItems.map(renderItem)}
              </List>
            </Collapse>
          </>
        )}
      </Stack>

      <List dense disablePadding>
        {secondaryListItems.map((item) => (
          <ListItem
            key={item.key}
            disablePadding
            sx={{ display: "none", px: 1 }}
          >
            <ListItemButton
              selected={isSelected(item.path)}
              onClick={() => router.push(item.path)}
              sx={{ borderRadius: 1.5 }}
            >
              <ListItemIcon sx={{ minWidth: 36 }}>{item.icon}</ListItemIcon>
              <ListItemText primary={t(item.key)} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Stack>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <Typography
      variant="caption"
      sx={{
        display: "block",
        px: 2.5,
        pt: 2,
        pb: 0.5,
        color: "text.disabled",
        fontWeight: 700,
        letterSpacing: 0.8,
        textTransform: "uppercase",
        fontSize: 10.5,
      }}
    >
      {children}
    </Typography>
  );
}

function CollapsibleSectionLabel({
  children,
  open,
  onToggle,
}: {
  children: React.ReactNode;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <ListItem disablePadding sx={{ display: "block", px: 1, mt: 1.5 }}>
      <ListItemButton
        onClick={onToggle}
        sx={{
          borderRadius: 1.5,
          py: 0.25,
          px: 1.5,
          color: "text.disabled",
          "&:hover": { color: "text.secondary" },
        }}
      >
        <Typography
          variant="caption"
          sx={{
            flex: 1,
            fontWeight: 700,
            letterSpacing: 0.8,
            textTransform: "uppercase",
            fontSize: 10.5,
          }}
        >
          {children}
        </Typography>
        <ExpandMoreRoundedIcon
          sx={{
            fontSize: 18,
            transition: "transform .15s ease",
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
          }}
        />
      </ListItemButton>
    </ListItem>
  );
}
