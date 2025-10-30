import {
  Avatar,
  Box,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import React from "react";
import GroupsIcon from "@mui/icons-material/Groups";
import Groups2Icon from "@mui/icons-material/Groups2";
import Groups3Icon from "@mui/icons-material/Groups3";
import WomanIcon from "@mui/icons-material/Woman";
import ManIcon from "@mui/icons-material/Man";
import { StuInfoDetailResponseType } from "@/app/constants/type";
import { GridSlotsComponentsProps } from "@mui/x-data-grid";
import { useTranslations } from "next-intl";

export const CustomStuInfoFooterComponent = (
  props: NonNullable<GridSlotsComponentsProps["footer"]>
) => {
  const { studentInfoCount, extraControls } = props;
  const t = useTranslations("Common");
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  return (
    <>
      <Box sx={{ p: 2, display: "" }}>
        {extraControls && (
          <Box
            sx={{
              my: 1,
              display: "flex",
              gap: 2,
              justifyContent: "end",
              flexDirection: isMobile ? "column" : "row",
              alignItems: isMobile ? "end" : "center",
              "& > *": { width: isMobile ? "auto" : "auto" },
            }}
          >
            {extraControls}
          </Box>
        )}
        <List>
          <ListItem>
            <ListItemText
              primary={`${t("total")} ${String(
                studentInfoCount?.total || 0
              ).padStart(2, "0")} ${t("people")}`}
            />
          </ListItem>
          <ListItem>
            <ListItemText
              primary={`${t("male")} ${String(
                studentInfoCount?.totalMale || 0
              ).padStart(2, "0")} ${t("people")}`}
            />
          </ListItem>
          <ListItem>
            <ListItemText
              primary={`${t("female")} ${String(
                studentInfoCount?.totalFemale || 0
              ).padStart(2, "0")} ${t("people")}`}
            />
          </ListItem>
        </List>
      </Box>
    </>
  );
};
