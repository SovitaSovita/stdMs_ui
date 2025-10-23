"use client";

import DashboardLayout from "@/app/dashboard/DashboardLayout";
import { Box, Typography } from "@mui/material";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import { useSession } from "next-auth/react";
import { useMemo } from "react";

const rows = [
  {
    id: 1,
    lastName: "Snow",
    firstName: "Jon",
    gender: "F",
    totalScore: "244",
    average: "43.33",
    mRanking: "3",
    mGrade: "C",
    score: {
      m: 20,
      p: 34,
      c: 32,
      b: 55,
      es: 99,
      h: 59,
      g: 88,
      i: 86,
      he: 70,
      en: 50,
      ed: 40,
      si: 80,
      it: 80,
    },
  },
  {
    id: 2,
    lastName: "Lannister",
    firstName: "Cersei",
    gender: "M",
    totalScore: "244",
    average: "43.33",
    mRanking: "1",
    mGrade: "A",
    score: {
      m: 20,
      p: 34,
      c: 32,
      b: 55,
      es: 99,
      h: 59,
      g: 88,
      i: 86,
      he: 70,
      en: 50,
      ed: 40,
      si: 80,
      it: 99,
    },
  },
  {
    id: 3,
    lastName: "Lannister",
    firstName: "Jaime",
    gender: "M",
    totalScore: "244",
    average: "43.33",
    mRanking: "2",
    mGrade: "B",
    score: {
      m: 20,
      p: 34,
      c: 32,
      b: 55,
      es: 99,
      h: 59,
      g: 88,
      i: 86,
      he: 70,
      en: 50,
      ed: 40,
      si: 80,
      it: 70,
    },
  },
  {
    id: 4,
    lastName: "Stark",
    firstName: "Arya",
    gender: "M",
    score: {
      m: 20,
      p: 34,
      c: 32,
      b: 55,
      es: 99,
      h: 59,
      g: 88,
      i: 86,
      he: 70,
      en: 50,
      ed: 40,
      si: 80,
      it: 100,
    },
  },
  {
    id: 5,
    lastName: "Targaryen",
    firstName: "Daenerys",
    gender: "F",
    score: {
      m: 20,
      p: 34,
      c: 32,
      b: 55,
      es: 99,
      h: 59,
      g: 88,
      i: 86,
      he: 70,
      en: 50,
      ed: 40,
      si: 80,
      it: 90,
    },
  },
  {
    id: 6,
    lastName: "Melisandre",
    firstName: null,
    gender: "M",
    score: {
      m: 20,
      p: 34,
      c: 32,
      b: 55,
      es: 99,
      h: 59,
      g: 88,
      i: 86,
      he: 70,
      en: 50,
      ed: 40,
      si: 80,
      it: 60,
    },
  },
  {
    id: 7,
    lastName: "Clifford",
    firstName: "Ferrara",
    gender: "F",
    score: {
      m: 20,
      p: 34,
      c: 32,
      b: 55,
      es: 99,
      h: 59,
      g: 88,
      i: 86,
      he: 70,
      en: 50,
      ed: 40,
      si: 80,
      it: 60,
    },
  },
  {
    id: 8,
    lastName: "Frances",
    firstName: "Rossini",
    gender: "F",
    score: {
      m: 20,
      p: 34,
      c: 32,
      b: 55,
      es: 99,
      h: 59,
      g: 88,
      i: 86,
      he: 70,
      en: 50,
      ed: 40,
      si: 80,
      it: 100,
    },
  },
  {
    id: 9,
    lastName: "Roxie",
    firstName: "Harvey",
    gender: "M",
    score: {
      m: 20,
      p: 34,
      c: 32,
      b: 55,
      es: 99,
      h: 59,
      g: 88,
      i: 86,
      he: 70,
      en: 50,
      ed: 40,
      si: 80,
      it: 90,
    },
  },
];

export default function Page() {
  const { data: session, status }: { data: any; status: any } = useSession();

  const columns = useMemo(() => {
    const staticColumns: GridColDef<(typeof rows)[number]>[] = [
      {
        field: "id",
        headerName: "ល​​រ",
        headerClassName: "font-siemreap",
        width: 90,
      },
      {
        field: "fullname",
        headerName: "គោត្តនាម និងនាម",
        headerClassName: "font-siemreap",
        width: 150,
        valueGetter: (value, row) =>
          `${row.firstName || ""} ${row.lastName || ""}`,
        editable: true,
        sortable: false,
        disableColumnMenu: true,
      },
      {
        field: "gender",
        headerName: "ភេទ",
        headerClassName: "font-siemreap",
        type: "singleSelect",
        width: 100,
        align: "center",
        headerAlign: "center",
        editable: true,
        sortable: false,
        disableColumnMenu: true,
        valueOptions: ["M", "F"],
      },
    ];
    const staticColumns2: GridColDef<(typeof rows)[number]>[] = [
      {
        field: "totalScore",
        headerName: "ពិ.សរុប",
        headerClassName: "font-siemreap",
        align: "center",
        headerAlign: "center",
        width: 150,
        editable: true,
        sortable: false,
        disableColumnMenu: true,
      },
      {
        field: "average",
        headerName: "ម.ភាគ",
        headerClassName: "font-siemreap",
        cellClassName: "font-semibold",
        type: "string",
        width: 100,
        align: "center",
        headerAlign: "center",
        editable: true,
        sortable: false,
        disableColumnMenu: true,
      },
      {
        field: "mRanking",
        headerName: "ចំ.ថ្នាក់",
        headerClassName: "font-siemreap",
        cellClassName: "text-red-500 font-semibold",
        type: "string",
        width: 100,
        align: "center",
        headerAlign: "center",
        editable: true,
        sortable: false,
        disableColumnMenu: true,
      },
      {
        field: "mGrade",
        headerName: "និទ្ទេស",
        headerClassName: "font-siemreap",
        cellClassName: "text-red-500 font-semibold",
        type: "string",
        width: 100,
        align: "center",
        headerAlign: "center",
        editable: true,
        sortable: false,
        disableColumnMenu: true,
      },
    ];

    // Safely extract score keys with null checks
    const scoreKeys =
      rows.length > 0 && rows[0].score ? Object.keys(rows[0].score) : [];

    const dynamicScoreColumns: GridColDef[] = scoreKeys.map((key) => ({
      field: key,
      headerName: key.toUpperCase(),
      type: "string",
      width: 40,
      align: "center",
      headerAlign: "center",
      editable: true,
      sortable: false,
      disableColumnMenu: true,
      valueGetter: (value, row, column) => {
        const field = column.field;
        const scoreArr = row.score;
        if (!scoreArr) return "";
        return scoreArr[field] || 0; // Return first score object's value
      },
    }));

    return [...staticColumns, ...dynamicScoreColumns, ...staticColumns2];
  }, []);

  return (
    <>
      <Box sx={{ width: "100%", maxWidth: { sm: "100%", md: "1700px" } }}>
        <Typography component="h2" variant="h6" sx={{ mb: 2 }}>
          Overview
        </Typography>
        <Box className="font-siemreap" sx={{ height: 400, width: "100%" }}>
          <DataGrid
            rows={rows}
            columns={columns}
            initialState={{
              pagination: {
                paginationModel: {
                  pageSize: 5,
                },
              },
            }}
            pageSizeOptions={[5]}
            checkboxSelection
            disableRowSelectionOnClick
          />
        </Box>
      </Box>
    </>
  );
}
