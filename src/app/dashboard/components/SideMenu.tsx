"use client";

import * as React from "react";
import { alpha, styled, useTheme } from "@mui/material/styles";
import Avatar from "@mui/material/Avatar";
import MuiDrawer, { drawerClasses } from "@mui/material/Drawer";
import Box from "@mui/material/Box";
import Divider from "@mui/material/Divider";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import SchoolRoundedIcon from "@mui/icons-material/SchoolRounded";
import SelectContent from "./SelectContent";
import MenuContent from "./MenuContent";
import OptionsMenu from "./OptionsMenu";
import { useSession } from "next-auth/react";

const drawerWidth = 256;

const Drawer = styled(MuiDrawer)({
  width: drawerWidth,
  flexShrink: 0,
  boxSizing: "border-box",
  mt: 10,
  [`& .${drawerClasses.paper}`]: {
    width: drawerWidth,
    boxSizing: "border-box",
  },
});

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

  const username = session?.user?.username;
  const fullname = session?.user?.fullname;
  const profile = session?.user?.profile;
  const role = session?.user?.role;

  return (
    <Drawer
      variant="permanent"
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
          alignItems: "center",
          gap: 1.25,
          px: 2,
          py: 2,
          mt: "calc(var(--template-frame-height, 0px) + 4px)",
        }}
      >
        <Avatar
          variant="rounded"
          sx={{
            width: 36,
            height: 36,
            bgcolor: alpha(theme.palette.primary.main, 0.12),
            color: "primary.main",
            borderRadius: 1.5,
          }}
        >
          <SchoolRoundedIcon />
        </Avatar>
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
      </Box>

      <Divider />

      {/* Classroom selector */}
      <Box sx={{ p: 1.5 }}>
        <SelectContent />
      </Box>

      <Divider />

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
      <Box sx={{ p: 1.5 }}>
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
      </Box>
    </Drawer>
  );
}
