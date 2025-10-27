import {
  Avatar,
  Box,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
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
  const { students } = props;
  const t = useTranslations("Common")
  return (
    <>
      <Box sx={{ p: 2, display: "flex" }}>
        <List>
          <ListItem>
            <ListItemText primary={`${t("total")} ${String(students?.total || 0).padStart(2, "0")} ${t("people")}`} />
          </ListItem>
          <ListItem>
            <ListItemText primary={`${t("male")} ${String(students?.totalMale || 0).padStart(2, "0")} ${t("people")}`} />
          </ListItem>
          <ListItem>
            <ListItemText primary={`${t("female")} ${String(students?.totalFemale || 0).padStart(2, "0")} ${t("people")}`} />
          </ListItem>
        </List>
      </Box>
    </>
  );
};
