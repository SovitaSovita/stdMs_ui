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
import { useClassroomSWR } from "@/app/libs/swr/classroomSWR";

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

export default function SelectContent() {
  const [classrooms, setClassrooms] = React.useState<ClassInfoResponseType[]>(
    []
  );
  const [classroomId, setClassroomId] = React.useState<string>("");
  const { data, isLoading, mutate } = useClassroomSWR(classroomId);

  const handleChange = (event: SelectChangeEvent) => {
    setClassroomId(event.target.value as string);
  };

  const getCurrentClasses = async () => {
    const result = await ClassroomService.getInfoList();
    if (result) {
      setClassrooms(result);
      setClassroomId(result[0]?.id.toString());

      //get class detail
      mutate();
    }
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
      inputProps={{ "aria-label": "Select classroom" }}
      fullWidth
      sx={{
        maxHeight: 56,
        width: 215,
        "&.MuiList-root": {
          p: "8px",
        },
        [`& .${selectClasses.select}`]: {
          display: "flex",
          alignItems: "center",
          gap: "2px",
          pl: 1,
        },
      }}
    >
      <ListSubheader sx={{ pt: 0 }}>Classroom</ListSubheader>
      {classrooms.map((row) => (
        <MenuItem value={row.id}>
          <ListItemAvatar>
            <Avatar alt={row.name}>
              <SmartphoneRoundedIcon sx={{ fontSize: "1rem" }} />
            </Avatar>
          </ListItemAvatar>
          <ListItemText primary={row.name} secondary={row.grade} />
        </MenuItem>
      ))}
      <Divider sx={{ mx: -1 }} />
      <MenuItem value={40}>
        <ListItemIcon>
          <AddRoundedIcon />
        </ListItemIcon>
        <ListItemText primary="Add Classroom" secondary="Create your class" />
      </MenuItem>
    </Select>
  );
}
