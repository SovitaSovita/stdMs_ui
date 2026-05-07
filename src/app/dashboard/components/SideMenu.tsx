"use client";

import * as React from "react";
import { alpha, styled, useTheme } from "@mui/material/styles";
import Avatar from "@mui/material/Avatar";
import MuiDrawer, { drawerClasses } from "@mui/material/Drawer";
import Box from "@mui/material/Box";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import SchoolRoundedIcon from "@mui/icons-material/SchoolRounded";
import ChevronLeftRoundedIcon from "@mui/icons-material/ChevronLeftRounded";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import SelectContent from "./SelectContent";
import MenuContent from "./MenuContent";
import OptionsMenu from "./OptionsMenu";
import { useSession } from "next-auth/react";
import {
  SIDEBAR_COLLAPSED_WIDTH,
  SIDEBAR_WIDTH,
  useSidebar,
} from "./SidebarContext";

const Drawer = styled(MuiDrawer, {
  shouldForwardProp: (prop) => prop !== "collapsed",
})<{ collapsed: boolean }>(({ theme, collapsed }) => ({
  width: collapsed ? SIDEBAR_COLLAPSED_WIDTH : SIDEBAR_WIDTH,
  flexShrink: 0,
  boxSizing: "border-box",
  whiteSpace: "nowrap",
  transition: theme.transitions.create("width", {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.shorter,
  }),
  [`& .${drawerClasses.paper}`]: {
    width: collapsed ? SIDEBAR_COLLAPSED_WIDTH : SIDEBAR_WIDTH,
    boxSizing: "border-box",
    overflowX: "hidden",
    transition: theme.transitions.create("width", {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.shorter,
    }),
  },
}));

function getInitials(name?: string | null) {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function SideMenu() {
  const { data: session }: { data: any } = useSession();
  const theme = useTheme();
  const { collapsed, toggle } = useSidebar();

  const username = session?.user?.username;
  const fullname = session?.user?.fullname;
  const profile = session?.user?.profile;
  const role = session?.user?.role;

  return (
    <Drawer
      variant="permanent"
      collapsed={collapsed}
      sx={{
        display: { xs: "none", md: "block" },
        [`& .${drawerClasses.paper}`]: {
          backgroundColor: "background.paper",
          borderRight: `1px solid ${theme.palette.divider}`,
        },
      }}
    >
      {/* Brand header */}
      <Box
        sx={{
          display: "flex",
          flexDirection: collapsed ? "column" : "row",
          alignItems: "center",
          gap: collapsed ? 1 : 1.25,
          px: collapsed ? 1 : 2,
          py: 2,
          mt: "calc(var(--template-frame-height, 0px) + 4px)",
          justifyContent: collapsed ? "center" : "space-between",
        }}
      >
        <Stack
          direction="row"
          alignItems="center"
          spacing={1.25}
          sx={{ minWidth: 0, flex: collapsed ? "0 0 auto" : 1 }}
        >
          <Avatar
            variant="rounded"
            sx={{
              width: 36,
              height: 36,
              bgcolor: alpha(theme.palette.primary.main, 0.12),
              color: "primary.main",
              borderRadius: 1.5,
              flexShrink: 0,
            }}
          >
            <SchoolRoundedIcon />
          </Avatar>
          {!collapsed && (
            <Box sx={{ minWidth: 0 }}>
              <Typography
                variant="subtitle1"
                sx={{ fontWeight: 700, lineHeight: 1.1 }}
                noWrap
              >
                STD-MS
              </Typography>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ lineHeight: 1.2 }}
                noWrap
              >
                Student Management
              </Typography>
            </Box>
          )}
        </Stack>

        {/* Collapse / expand toggle — stays inside the sidebar bounds */}
        <Tooltip
          title={collapsed ? "Expand menu" : "Collapse menu"}
          placement="right"
        >
          <IconButton
            size="small"
            onClick={toggle}
            aria-label={collapsed ? "Expand menu" : "Collapse menu"}
            sx={{
              border: `1px solid ${theme.palette.divider}`,
              bgcolor: "background.paper",
              width: 28,
              height: 28,
              flexShrink: 0,
              "&:hover": {
                bgcolor: alpha(theme.palette.primary.main, 0.08),
                color: "primary.main",
              },
            }}
          >
            {collapsed ? (
              <ChevronRightRoundedIcon sx={{ fontSize: 18 }} />
            ) : (
              <ChevronLeftRoundedIcon sx={{ fontSize: 18 }} />
            )}
          </IconButton>
        </Tooltip>
      </Box>

      <Divider />

      {/* Classroom selector — hidden when collapsed (it needs full width) */}
      {!collapsed && (
        <Box sx={{ p: 1.5 }}>
          <SelectContent />
        </Box>
      )}

      {!collapsed && <Divider />}

      {/* Menu items */}
      <Box
        sx={{
          overflow: "auto",
          flexGrow: 1,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <MenuContent />
      </Box>

      {/* User profile card */}
      <Box sx={{ p: collapsed ? 1 : 1.5 }}>
        {collapsed ? (
          <Tooltip title={fullname || username || ""} placement="right">
            <Stack alignItems="center">
              <Avatar
                alt={username}
                src={profile}
                sx={{
                  width: 36,
                  height: 36,
                  fontSize: 13,
                  fontWeight: 700,
                  bgcolor: alpha(theme.palette.primary.main, 0.15),
                  color: "primary.main",
                }}
              >
                {getInitials(fullname || username)}
              </Avatar>
            </Stack>
          </Tooltip>
        ) : (
          <Stack
            direction="row"
            alignItems="center"
            spacing={1.25}
            sx={{
              p: 1,
              borderRadius: 2,
              bgcolor: alpha(theme.palette.primary.main, 0.04),
              border: `1px solid ${theme.palette.divider}`,
              transition: "background-color .15s ease",
              "&:hover": {
                bgcolor: alpha(theme.palette.primary.main, 0.08),
              },
            }}
          >
            <Avatar
              alt={username}
              src={profile}
              sx={{
                width: 38,
                height: 38,
                fontSize: 14,
                fontWeight: 700,
                bgcolor: alpha(theme.palette.primary.main, 0.15),
                color: "primary.main",
              }}
            >
              {getInitials(fullname || username)}
            </Avatar>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography
                variant="body2"
                sx={{ fontWeight: 600, lineHeight: 1.2 }}
                noWrap
              >
                {fullname || username || "—"}
              </Typography>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ lineHeight: 1.2 }}
                noWrap
              >
                {role || username || ""}
              </Typography>
            </Box>
            <OptionsMenu />
          </Stack>
        )}
      </Box>
    </Drawer>
  );
}
