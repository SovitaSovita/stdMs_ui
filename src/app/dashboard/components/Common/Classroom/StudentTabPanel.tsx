import React from "react";
import { StudentsInfo, StuInfoDetailResponseType } from "@/app/constants/type";
import CustomizedTreeView from "@/app/dashboard/components/CustomizedTreeView";
import { classroomAtom, studentsAtom } from "@/app/libs/jotai/classroomAtom";
import StudentService from "@/app/service/StudentService";
import { Box, Button, Stack, Typography } from "@mui/material";
import Grid from "@mui/material/Grid";
import { DataGrid, GridColDef, GridRenderCellParams } from "@mui/x-data-grid";
import dayjs from "dayjs";
import { useAtom, useAtomValue } from "jotai";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";
import ManageAccountsIcon from "@mui/icons-material/ManageAccounts";
import { useRouter } from "next/navigation";

export const StudentTabPanel = () => {
  const t = useTranslations();
  const router = useRouter();
  const [students] = useAtom(studentsAtom);

  useEffect(() => {
    if (students) {
      setRows(students?.student);
    }
  }, [students]);

  const [rows, setRows] = useState<StudentsInfo[]>([]);
  const columns: GridColDef<(typeof rows)[number]>[] = [
    {
      field: "id",
      headerName: t("CommonField.id"),
      headerClassName: "font-siemreap",
      align: "center",
      headerAlign: "center",
      width: 70,
      editable: false,
      renderCell: (params) =>
        params.api.getRowIndexRelativeToVisibleRows(params.id) + 1,
    },
    {
      field: "idCard",
      headerName: t("CommonField.idCard"),
      headerClassName: "font-siemreap",
      width: 90,
      editable: false,
    },
    {
      field: "fullName",
      headerName: t("CommonField.fullName"),
      headerClassName: "font-siemreap",
      width: 150,
      editable: false,
      sortable: true,
      disableColumnMenu: true,
    },
    {
      field: "gender",
      headerName: t("CommonField.sex"),
      headerClassName: "font-siemreap",
      type: "singleSelect",
      width: 100,
      align: "center",
      headerAlign: "center",
      editable: false,
      sortable: false,
      disableColumnMenu: true,
      valueOptions: [
        { value: "M", label: t("Common.male") },
        { value: "F", label: t("Common.female") },
      ],
    },
    {
      field: "dateOfBirth",
      headerName: t("CommonField.dateOfBirth"),
      type: "date",
      headerClassName: "font-siemreap",
      width: 150,
      editable: false,
      sortable: false,
      disableColumnMenu: true,
      valueGetter: (value) => {
        return value ? new Date(value) : null;
      },
      valueFormatter: (value) => {
        if (!value) return "";
        return `${dayjs(value).format("DD-MM-YYYY")}`;
      },
    },
    {
      field: "fatherName",
      headerName: t("CommonField.fatherName"),
      headerClassName: "font-siemreap",
      width: 150,
      editable: false,
      sortable: false,
      disableColumnMenu: true,
      renderCell: (params: GridRenderCellParams) => {
        return <span>{params.value}</span>;
      },
    },
    {
      field: "fatherOccupation",
      headerName: t("CommonField.occupation"),
      headerClassName: "font-siemreap",
      width: 150,
      editable: false,
      sortable: false,
      disableColumnMenu: true,
    },
    {
      field: "montherName",
      headerName: t("CommonField.montherName"),
      headerClassName: "font-siemreap",
      width: 150,
      editable: false,
      sortable: false,
      disableColumnMenu: true,
    },
    {
      field: "montherOccupation",
      headerName: t("CommonField.occupation"),
      headerClassName: "font-siemreap",
      width: 150,
      editable: false,
      sortable: false,
      disableColumnMenu: true,
    },
    {
      field: "placeOfBirth",
      headerName: t("CommonField.placeOfBirth"),
      headerClassName: "font-siemreap",
      width: 200,
      editable: false,
      sortable: false,
      disableColumnMenu: true,
    },
    {
      field: "address",
      headerName: t("CommonField.address"),
      headerClassName: "font-siemreap",
      width: 200,
      editable: false,
      sortable: false,
      disableColumnMenu: true,
    },
  ];

  return (
    <div>
      {/* ------------- */}
      <Box display={"flex"} mb={2} gap={1} justifyContent={"space-between"}>
        <Typography
          component="h2"
          variant="h6"
          sx={{ display: { xs: "none", sm: "block" } }}
        >
          {t("Common.student")}
        </Typography>
        <Button
          onClick={() => router.push("/students")}
          variant="contained"
          size="small"
          startIcon={<ManageAccountsIcon />}
        >
          {t("Common.manage")}
        </Button>
      </Box>
      <Grid container spacing={2} columns={12}>
        <Grid size={{ xs: 12, lg: 12 }}>
          <DataGrid
            rows={rows}
            columns={columns}
            initialState={{
              pagination: {
                paginationModel: {
                  pageSize: 10,
                },
              },
            }}
            pageSizeOptions={[10, 15, 20, 50]}
            disableRowSelectionOnClick
          />
        </Grid>
      </Grid>
    </div>
  );
};
