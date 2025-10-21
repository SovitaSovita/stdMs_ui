"use client";

import {
  StudentsInfo,
  StudentsRequestUpsertType,
  StuInfoDetailResponseType,
} from "@/app/constants/type";
import { DeleteConfirmationDialog } from "@/app/dashboard/components/Dialog/DeleteConfirmationDialog";
import { InsertOneStudentDialog } from "@/app/dashboard/components/Dialog/InsertOneStudentDialog";
import LanguageSwitcher from "@/app/dashboard/components/LanguageSwitcher";
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
    {
      field: "fatherName",
      headerName: "ឈ្មោះឪពុក",
      headerClassName: "font-siemreap",
      width: 150,
      editable: true,
      sortable: false,
      disableColumnMenu: true,
    },
    {
      field: "fatherOccupation",
      headerName: "មុខរបរ",
      headerClassName: "font-siemreap",
      width: 150,
      editable: true,
      sortable: false,
      disableColumnMenu: true,
    },
    {
      field: "montherName",
      headerName: "ឈ្មោះម្ដាយ",
      headerClassName: "font-siemreap",
      width: 150,
      editable: true,
      sortable: false,
      disableColumnMenu: true,
    },
    {
      field: "montherOccupation",
      headerName: "មុខរបរ",
      headerClassName: "font-siemreap",
      width: 150,
      editable: true,
      sortable: false,
      disableColumnMenu: true,
    },
    {
      field: "placeOfBirth",
      headerName: "ទីកន្លែងកំណើត",
      headerClassName: "font-siemreap",
      width: 200,
      editable: true,
      sortable: false,
      disableColumnMenu: true,
    },
    {
      field: "address",
      headerName: "ទីលំនៅបច្ចុប្បន្ន",
      headerClassName: "font-siemreap",
      width: 200,
      editable: true,
      sortable: false,
      disableColumnMenu: true,
    },
  ];
  const t = useTranslations("Home");

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
        <Box display={"flex"} justifyContent={"space-between"}>
          <Typography component="h2" variant="h6" sx={{ mb: 2 }}>
            Overview {t("title")}
          </Typography>

          <LanguageSwitcher />
          
          <div className="flex gap-3">
            <InsertOneStudentDialog getStudentsInfo={getStudentsInfo} />

            <Button onClick={() => {}} variant="contained" size="small">
              បញ្ជូលសិស្សច្រើន
            </Button>

            <Button
              onClick={() => setDeleteDialogOpen(true)}
              disabled={rowSelectionModel.ids.size === 0}
              variant="contained"
              color="error"
              size="small"
            >
              លុបសិស្ស
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
          title="បញ្ជាក់ការលុប"
          message={`តើអ្នកពិតជាចង់លុបសិស្សចេញពីបញ្ចីមែនទេ? ពត័មានដែលទាក់ទងនឹងសិស្សដែលអ្នកលុបត្រូវបាត់ទាំងអស់`}
          confirmText="លុប"
          cancelText="ថយក្រោយ"
        />
      </Box>
    </>
  );
}
