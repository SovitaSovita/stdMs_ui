"use client";

import * as React from "react";
import MuiAvatar from "@mui/material/Avatar";
import MuiListItemAvatar from "@mui/material/ListItemAvatar";
import MenuItem from "@mui/material/MenuItem";
import ListItemText from "@mui/material/ListItemText";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListSubheader from "@mui/material/ListSubheader";
import Select, { SelectChangeEvent, selectClasses } from "@mui/material/Select";
import Divider from "@mui/material/Divider";
import { styled } from "@mui/material/styles";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import DevicesRoundedIcon from "@mui/icons-material/DevicesRounded";
import SmartphoneRoundedIcon from "@mui/icons-material/SmartphoneRounded";
import ConstructionRoundedIcon from "@mui/icons-material/ConstructionRounded";
import ClassroomService from "@/app/service/ClassroomService";
import { ClassInfoResponseType, ClassResponseType } from "@/app/constants/type";
import { useSetAtom } from "jotai";
import { classroomAtom } from "@/app/libs/jotai/classroomAtom";
import { useTranslations } from "next-intl";

const Avatar = styled(MuiAvatar)(({ theme }) => ({
  width: 28,
  height: 28,
  backgroundColor: (theme.vars || theme).palette.background.paper,
  color: (theme.vars || theme).palette.text.secondary,
  border: `1px solid ${(theme.vars || theme).palette.divider}`,
}));

const ListItemAvatar = styled(MuiListItemAvatar)({
  minWidth: 0,
  marginRight: 12,
});

const STORAGE_KEY = "selectedClassroomId";

export default function SelectContent() {
  const t = useTranslations("Common");
  const [classrooms, setClassrooms] = React.useState<ClassInfoResponseType[]>(
    []
  );
  const [classroomId, setClassroomId] = React.useState<string>("");
  const setClassroomAtom = useSetAtom(classroomAtom);

  // load classrooms
  const getCurrentClasses = async () => {
    const result = await ClassroomService.getInfoList();
    if (result) {
      setClassrooms(result);

      // Restore previously selected classroom (if exists)
      const savedId = localStorage.getItem(STORAGE_KEY);
      const selectedId = savedId || result[0]?.id?.toString();
      setClassroomId(selectedId);
      getClassDetail(selectedId);
    }
  };

  // fetch class detail
  const getClassDetail = async (classId: string) => {
    if (!classId) return;
    const result = await ClassroomService.getById(classId);
    if (result) {
      setClassroomAtom(result);
    }
  };

  const handleChange = (event: SelectChangeEvent) => {
    const id = event.target.value as string;
    setClassroomId(id);
    localStorage.setItem(STORAGE_KEY, id); // ✅ persist selected classroom
    getClassDetail(id);
  };

  React.useEffect(() => {
    getCurrentClasses();
  }, []);

  return (
    <Select
      labelId="classroom-select"
      id="classroom-simple-select"
      value={classroomId}
      onChange={handleChange}
      displayEmpty
      fullWidth
      inputProps={{ "aria-label": "Select classroom" }}
      sx={{
        maxHeight: 56,
        width: 215,
        [`& .${selectClasses.select}`]: {
          display: "flex",
          alignItems: "center",
          gap: "2px",
          pl: 1,
        },
      }}
    >
      <ListSubheader>{t("classroom")}</ListSubheader>
      {classrooms.map((row) => (
        <MenuItem key={row.id} value={row.id}>
          <ListItemAvatar>
            <Avatar alt={row.name}>
              <SmartphoneRoundedIcon sx={{ fontSize: "1rem" }} />
            </Avatar>
          </ListItemAvatar>
          <ListItemText
            primary={t("classroom") + " " + row.name}
            secondary={t("studyYear") + " " + row.year}
          />
        </MenuItem>
      ))}
      <Divider sx={{ mx: -1 }} />
      <MenuItem value="add">
        <ListItemIcon>
          <AddRoundedIcon />
        </ListItemIcon>
        <ListItemText
          primary={t("createClassroom")}
          // secondary="Create your class"
        />
      </MenuItem>
    </Select>
  );
}
