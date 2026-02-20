"use client";
import { Typography, List, ListItem, ListItemText, Paper } from "@mui/material";
import { useAtomValue } from "jotai";
import { top5StudentsAtom } from "@/app/libs/jotai/classroomAtom";

type HonorRollChartProps = {};

export const HonorRollChart = (props: HonorRollChartProps) => {
  // Get top 5 students from atom
  const top5 = useAtomValue(top5StudentsAtom);
  console.log("top5 >>", top5);

  return (
    <Paper elevation={2} sx={{ p: 2, mb: 2 }}>
      <Typography variant="h6" sx={{ mb: 2, fontWeight: "bold" }}>
        Honor Roll (Top 5 Students)
      </Typography>
      <List>
        {top5.length === 0 && (
          <ListItem>
            <ListItemText primary="No students in top 5." />
          </ListItem>
        )}
        {top5.map((student) => (
          <ListItem key={student.id} divider>
            <ListItemText
              primary={`${student.mRanking}. ${student.fullName}`}
              secondary={`Ranking: ${student.mRanking ?? "-"} | Avg: ${student.average ?? "-"}`}
            />
          </ListItem>
        ))}
      </List>
    </Paper>
  );
};
