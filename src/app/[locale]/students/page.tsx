"use client";

import {
  Settings,
  StudentCountType,
  StudentsInfo,
  StudentsRequestUpsertType,
  StuInfoDetailResponseType,
} from "@/app/constants/type";
import { DeleteConfirmationDialog } from "@/app/dashboard/components/Dialog/DeleteConfirmationDialog";
import { InsertOneStudentDialog } from "@/app/dashboard/components/Dialog/InsertOneStudentDialog";
import { classroomAtom, examsAtom, studentsAtom } from "@/app/libs/jotai/classroomAtom";
import StudentService from "@/app/service/StudentService";
import { Box, Button, Typography } from "@mui/material";
import {
  DataGrid,
  GridColDef,
  GridRenderCellParams,
  GridRowId,
  GridRowSelectionModel,
} from "@mui/x-data-grid";
import { useAtom, useAtomValue } from "jotai";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useState } from "react";
import { showAlertAtom } from "@/app/libs/jotai/alertAtom";
import dayjs from "dayjs";
import GroupAddIcon from "@mui/icons-material/GroupAdd";
import DeleteSweepIcon from "@mui/icons-material/DeleteSweep";
import { CustomStuInfoFooterComponent } from "@/app/dashboard/components/Common/CustomStuInfoFooterComponent";
import {
  getInitialSettings,
  SETTINGS_STORAGE_KEY,
} from "@/app/utils/axios/Common";
import { ImportStudentsDialog } from "@/app/dashboard/components/Dialog/ImportStudentsDialog";
import DriveFolderUploadIcon from "@mui/icons-material/DriveFolderUpload";
import useClassroomData from "@/app/libs/hooks/useClassroomData";

declare module "@mui/x-data-grid" {
  interface FooterPropsOverrides {
    studentInfoCount?: StudentCountType;
    extraControls?: React.ReactNode;
  }
}

export default function Page() {
  const t = useTranslations();

  const columns: GridColDef<(typeof rows)[number]>[] = [
    {
      field: "orderNo",
      headerName: t("CommonField.id"),
      headerClassName: "font-siemreap",
      width: 90,
      editable: false,
      // renderCell: (params) =>
      //   params.api.getRowIndexRelativeToVisibleRows(params.id) + 1,
    },
    {
      field: "idCard",
      headerName: t("CommonField.idCard"),
      headerClassName: "font-siemreap",
      width: 90,
      editable: true,
    },
    {
      field: "fullName",
      headerName: t("CommonField.fullName"),
      headerClassName: "font-siemreap",
      width: 150,
      editable: true,
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
      editable: true,
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
      editable: true,
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
      editable: true,
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

  // const [students, setStudents] = useState<StuInfoDetailResponseType>();
  const [rows, setRows] = useState<StudentsInfo[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const classroom = useAtomValue(classroomAtom);
  const exams = useAtomValue(examsAtom);
  const [students, setStudents] = useAtom(studentsAtom);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [, showAlert] = useAtom(showAlertAtom);
  const { refetch } = useClassroomData(classroom);

  const [rowSelectionModel, setRowSelectionModel] =
    useState<GridRowSelectionModel>({
      type: "include", // or 'exclude'
      ids: new Set<GridRowId>([]),
    });

  useEffect(() => {
    if (students?.student) {
      setRows(students.student);
    }
  }, [students?.student]);

  const [settings, setSettings] = useState<Settings>(getInitialSettings());

  useEffect(() => {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  const handleDeleteStudents = async () => {
    const ids = Array.from(rowSelectionModel.ids) as string[];
    if (ids.length === 0) return;

    const tempIds = ids.filter((id) => String(id).startsWith("temp-"));
    const dbIds = ids.filter((id) => !String(id).startsWith("temp-"));

    // Remove unsaved (temp) rows immediately
    if (tempIds.length > 0) {
      setRows((prev) => prev.filter((r) => !tempIds.includes(r.id)));
    }

    // Delete saved rows via API
    if (dbIds.length > 0 && classroom?.id) {
      const result = await StudentService.deleteList(dbIds, classroom?.id);
      if (result?.status === 200) {
        setRows((prev) => prev.filter((r) => !dbIds.includes(r.id)));
        showAlert({
          message: result?.message || "Deleted successfully.",
          severity: "success",
        });
      } else {
        showAlert({
          message: "Failed to delete records.",
          severity: "error",
        });
      }
    }
  };

  const processRowUpdate = async (
    newRow: StudentsInfo,
    oldRow: StudentsInfo,
    params: { rowId: GridRowId }
  ): Promise<StudentsInfo> => {
    setIsLoading(true);

    try {
      if (rows.length >= 60) {
        showAlert({
          message: "Cannot add more than 60 students.",
          severity: "error",
        });
        return oldRow;
      }
      // ✅ Detect new rows using a special tempId prefix
      const isTempRow = String(newRow.id).startsWith("temp-");

      if (!newRow.fullName) {
        showAlert({
          message:
            t("CommonField.fullName") +
            t("CommonValidate.cannotEmpty") +
            " " +
            t("CommonValidate.inputFirst", {
              fullName: t("CommonField.fullName"),
            }),
          severity: "error",
        });
        return oldRow;
      }

      const sendData: StudentsRequestUpsertType = {
        ...newRow,
        classId: classroom?.id,
        dateOfBirth: newRow.dateOfBirth ? dayjs(newRow.dateOfBirth).format("YYYY-MM-DD") : "",
      };

      // Remove id if new (backend will auto-generate one)
      if (isTempRow) delete (sendData as any).id;

      if (!sendData.classId) {
        setIsLoading(false);
        return oldRow;
      }

      const result = await StudentService.upsertStudent(sendData);

      if (result?.status === 200) {
        const updated = result?.payload;

        //Insern new
        if (isTempRow && updated?.id) {
          // Replace temp ID with real DB ID
          const newStudent = { ...newRow, id: updated.id };
          setRows((prev) =>
            prev.map((r) =>
              r.id === newRow.id ? { ...newRow, id: newStudent.id } : r
            )
          );
          showAlert({
            message: "Student added successfully.",
            severity: "success",
          });
          return newStudent;
        } else {
          //Update old
          setRows((prev) => prev.map((r) => (r.id === newRow.id ? newRow : r)));
          showAlert({
            message: "Student updated successfully.",
            severity: "success",
          });
          return newRow;
        }
      } else {
        showAlert({
          message: "Failed to save student.",
          severity: "error",
        });
        return oldRow;
      }
    } catch (error) {
      console.error("processRowUpdate error:", error);
      return oldRow; // rollback
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddMulti = () => {
    const tempId = `temp-${Date.now()}`;
    setRows((prev) => [
      ...prev,
      {
        id: tempId,
        classId: classroom?.id,
        fullName: "",
        idCard: "",
        gender: "M",
        dateOfBirth: "2000-01-01",
        fatherName: "",
        fatherOccupation: "",
        montherName: "",
        montherOccupation: "",
        placeOfBirth: "",
        address: "",
      },
    ]);
  };

  const studentInfoCount = useMemo<StudentCountType>(() => {
    const tMale = rows.filter((row) => row.gender == "M");
    const tFemale = rows.filter((row) => row.gender == "F");

    return {
      total: rows.length,
      totalMale: tMale.length,
      totalFemale: tFemale.length,
    };
  }, [rows]);

  return (
    <>
      <Box sx={{ width: "100%", maxWidth: { sm: "100%", md: "1700px" } }}>
        <Box display={"flex"} mb={2} gap={1} justifyContent={"space-between"}>
          <Typography
            component="h2"
            variant="h6"
            sx={{ display: { xs: "none", sm: "block" } }}
          >
            Overview
          </Typography>
          <Box display={"flex"} gap={1}>
            {/* This button is for inserting a single student */}
            <InsertOneStudentDialog />

            {/* this button is another option for Insert in table row */}
            <Button
              onClick={handleAddMulti}
              variant="contained"
              size="small"
              startIcon={<GroupAddIcon />}
            >
              {t("Student.btn.multiAdd")}
            </Button>

            {/* This button is for importing students from Excel */}
            {Number(students?.total) === 0 ? <ImportStudentsDialog /> : null}

            <Button
              onClick={() => setDeleteDialogOpen(true)}
              disabled={rowSelectionModel.ids.size === 0}
              variant="contained"
              color="error"
              size="small"
              startIcon={<DeleteSweepIcon />}
            >
              {t("Student.btn.deleteStu")}
            </Button>
          </Box>
        </Box>
        <Box className="font-siemreap" sx={{ height: 600, width: "100%" }}>
          <DataGrid
            rows={rows}
            columns={columns}
            loading={isLoading}
            initialState={{
              pagination: {
                paginationModel: {
                  pageSize: 40,
                },
              },
            }}
            pageSizeOptions={[10, 15, 40, 60]}
            checkboxSelection
            onRowSelectionModelChange={(newRowSelectionModel) => {
              setRowSelectionModel(newRowSelectionModel);
            }}
            rowSelectionModel={rowSelectionModel}
            disableRowSelectionOnClick
            processRowUpdate={processRowUpdate}
            density={settings.density}
            showCellVerticalBorder={settings.showCellBorders}
            showColumnVerticalBorder={settings.showColumnBorders}
            slots={{
              footer: CustomStuInfoFooterComponent,
            }}
            slotProps={{
              footer: {
                studentInfoCount,
                extraControls: null, // You can pass extra controls here if needed
              },
            }}
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
          title={t("Common.titleDeleteConfirm")}
          message={t("Student.deleteConfirmation")}
          confirmText={t("Common.delete")}
          cancelText={t("Common.cancel")}
        />
      </Box>
    </>
  );
}
