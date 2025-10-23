"use client";

import {
  StudentsInfo,
  StuInfoDetailResponseType,
} from "@/app/constants/type";
import { DeleteConfirmationDialog } from "@/app/dashboard/components/Dialog/DeleteConfirmationDialog";
import { InsertOneStudentDialog } from "@/app/dashboard/components/Dialog/InsertOneStudentDialog";
import DashboardLayout from "@/app/dashboard/DashboardLayout";
import { classroomAtom } from "@/app/libs/jotai/classroomAtom";
import StudentService from "@/app/service/StudentService";
import { Box, Button, Typography } from "@mui/material";
import {
  DataGrid,
  GridColDef,
  GridRowId,
  GridRowSelectionModel,
} from "@mui/x-data-grid";
import { useAtomValue } from "jotai";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";

export default function Page() {
  const t = useTranslations();
  const columns: GridColDef<(typeof rows)[number]>[] = [
    {
      field: "id",
      headerName: t("CommonField.id"),
      headerClassName: "font-siemreap",
      width: 90,
    },
    {
      field: "fullName",
      headerName: t("CommonField.fullName"),
      headerClassName: "font-siemreap",
      width: 150,
      editable: true,
      sortable: false,
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
      editable: true,
      sortable: false,
      disableColumnMenu: true,
      valueOptions: ["M", "F"],
    },
    {
      field: "dateOfBirth",
      headerName: t("CommonField.dateOfBirth"),
      headerClassName: "font-siemreap",
      width: 150,
      editable: true,
      sortable: false,
      disableColumnMenu: true,
    },
    {
      field: "fatherName",
      headerName: t("CommonField.fatherName"),
      headerClassName: "font-siemreap",
      width: 150,
      editable: true,
      sortable: false,
      disableColumnMenu: true,
    },
    {
      field: "fatherOccupation",
      headerName: t("CommonField.occupation"),
      headerClassName: "font-siemreap",
      width: 150,
      editable: true,
      sortable: false,
      disableColumnMenu: true,
    },
    {
      field: "montherName",
      headerName: t("CommonField.montherName"),
      headerClassName: "font-siemreap",
      width: 150,
      editable: true,
      sortable: false,
      disableColumnMenu: true,
    },
    {
      field: "montherOccupation",
      headerName: t("CommonField.occupation"),
      headerClassName: "font-siemreap",
      width: 150,
      editable: true,
      sortable: false,
      disableColumnMenu: true,
    },
    {
      field: "placeOfBirth",
      headerName: t("CommonField.placeOfBirth"),
      headerClassName: "font-siemreap",
      width: 200,
      editable: true,
      sortable: false,
      disableColumnMenu: true,
    },
    {
      field: "address",
      headerName: t("CommonField.address"),
      headerClassName: "font-siemreap",
      width: 200,
      editable: true,
      sortable: false,
      disableColumnMenu: true,
    },
  ];

  const [students, setStudents] = useState<StuInfoDetailResponseType>();
  const [rows, setRows] = useState<StudentsInfo[]>([]);
  const classroom = useAtomValue(classroomAtom);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const [rowSelectionModel, setRowSelectionModel] =
    useState<GridRowSelectionModel>({
      type: "include", // or 'exclude'
      ids: new Set<GridRowId>([]),
    });

  const getStudentsInfo = async () => {
    if (classroom) {
      const result = await StudentService.getInfoList(classroom?.id);
      if (result) {
        setStudents(result);
        setRows(result?.student);
      }
    }
  };

  useEffect(() => {
    if (classroom) {
      getStudentsInfo();
    }
  }, [classroom]);

  const handleDeleteStudents = async () => {
    const ids = Array.from(rowSelectionModel.ids) as number[];
    if (ids.length <= 0) return;
    const result = await StudentService.deleteList(ids);

    if (result?.status == 200) {
      alert(result?.message);
    }
  };

  return (
    <>
      <Box sx={{ width: "100%", maxWidth: { sm: "100%", md: "1700px" } }}>
        <Box display={"flex"} gap={1} justifyContent={"space-between"}>
          <Typography component="h2" variant="h6" sx={{ mb: 2 }}>
            Overview
          </Typography>

          <div className="flex gap-3">
            <InsertOneStudentDialog getStudentsInfo={getStudentsInfo} />

            <Button onClick={() => {}} variant="contained" size="small">
              {t("student.btn.multiAdd")}
            </Button>

            <Button
              onClick={() => setDeleteDialogOpen(true)}
              disabled={rowSelectionModel.ids.size === 0}
              variant="contained"
              color="error"
              size="small"
            >
              {t("student.btn.deleteStu")}
            </Button>
          </div>
        </Box>
        <Box className="font-siemreap" sx={{ height: 600, width: "100%" }}>
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
            pageSizeOptions={[10]}
            checkboxSelection
            onRowSelectionModelChange={(newRowSelectionModel) => {
              setRowSelectionModel(newRowSelectionModel);
            }}
            rowSelectionModel={rowSelectionModel}
            disableRowSelectionOnClick
            sx={{
              "& .MuiDataGrid-columnHeaderCheckbox .MuiCheckbox-root": {
                display: "none",
              },
            }}
          />
        </Box>

        <DeleteConfirmationDialog
          open={deleteDialogOpen}
          onClose={() => setDeleteDialogOpen(false)}
          onConfirm={handleDeleteStudents}
          itemName="students"
          itemCount={rowSelectionModel.ids.size}
          title={t("common.titleDeleteConfirm")}
          message={t("student.deleteConfirmation")}
          confirmText={t("common.delete")}
          cancelText={t("common.cancel")}
        />
      </Box>
    </>
  );
}
