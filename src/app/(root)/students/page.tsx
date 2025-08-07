"use client";

import { Box, Typography } from "@mui/material";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import { useMemo } from "react";

const rows = [
  {
    id: 1,
    fullName: "Snow",
    dateOfBirth: "Jon",
    gender: "F",
  },
  {
    id: 2,
    fullName: "Lannister",
    dateOfBirth: "Cersei",
    gender: "M",
  },
  {
    id: 3,
    fullName: "Lannister",
    dateOfBirth: "Jaime",
    gender: "M",
  },
  {
    id: 4,
    fullName: "Stark",
    dateOfBirth: "Arya",
    gender: "M",
  },
  {
    id: 5,
    fullName: "Targaryen",
    dateOfBirth: "Daenerys",
    gender: "F",
  },
  {
    id: 6,
    fullName: "Melisandre",
    dateOfBirth: null,
    gender: "M",
  },
  {
    id: 7,
    fullName: "Clifford",
    dateOfBirth: "Ferrara",
    gender: "F",
  },
  {
    id: 8,
    fullName: "Frances",
    dateOfBirth: "Rossini",
    gender: "F",
  },
  {
    id: 9,
    fullName: "Roxie",
    dateOfBirth: "Harvey",
    gender: "M",
  },
];

export default function Page() {
  const columns: GridColDef<(typeof rows)[number]>[] = [
    {
      field: "id",
      headerName: "ល​​រ",
      headerClassName: "font-siemreap",
      width: 90,
    },
    {
      field: "fullName",
      headerName: "គោត្តនាម និងនាម",
      headerClassName: "font-siemreap",
      width: 150,
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
    {
      field: "dateOfBirth",
      headerName: "ថ្ងៃខែឆ្នាំកំណើត",
      headerClassName: "font-siemreap",
      width: 150,
      editable: true,
      sortable: false,
      disableColumnMenu: true,
    },
  ];
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
