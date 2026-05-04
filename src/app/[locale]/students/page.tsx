"use client";

import {
  Settings,
  StudentCountType,
  StudentsInfo,
  StudentsRequestUpsertType,
} from "@/app/constants/type";
import { DeleteConfirmationDialog } from "@/app/dashboard/components/Dialog/DeleteConfirmationDialog";
import { InsertOneStudentDialog } from "@/app/dashboard/components/Dialog/InsertOneStudentDialog";
import { classroomAtom, studentsAtom } from "@/app/libs/jotai/classroomAtom";
import StudentService from "@/app/service/StudentService";
import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Grid,
  Stack,
  Typography,
  alpha,
  useTheme,
} from "@mui/material";
import {
  DataGrid,
  GridColDef,
  GridRenderCellParams,
  GridRowId,
  GridRowSelectionModel,
} from "@mui/x-data-grid";
import { useAtomValue } from "jotai";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import useNotifications from "@/app/libs/hooks/useNotifications/useNotifications";
import dayjs from "dayjs";
import GroupAddIcon from "@mui/icons-material/GroupAdd";
import DeleteSweepIcon from "@mui/icons-material/DeleteSweep";
import GroupsIcon from "@mui/icons-material/Groups";
import ManIcon from "@mui/icons-material/Man";
import WomanIcon from "@mui/icons-material/Woman";
import SchoolIcon from "@mui/icons-material/School";
import { CustomDataGridToolbar } from "@/app/dashboard/components/Common/CustomDataGridToolbar";
import EmptyStateCard from "@/app/dashboard/components/Common/EmptyStateCard";
import {
  getInitialSettings,
  SETTINGS_STORAGE_KEY,
} from "@/app/utils/axios/Common";
import { ImportStudentsDialog } from "@/app/dashboard/components/Dialog/ImportStudentsDialog";

declare module "@mui/x-data-grid" {
  interface FooterPropsOverrides {
    studentInfoCount?: StudentCountType;
    extraControls?: React.ReactNode;
  }
}

type StatTone = "primary" | "info" | "secondary";

function StudentStatCard({
  label,
  value,
  icon,
  tone,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  tone: StatTone;
}) {
  const theme = useTheme();
  const color = theme.palette[tone].main;

  return (
    <Card
      variant="outlined"
      sx={{
        height: "100%",
        position: "relative",
        overflow: "hidden",
        transition: "transform .2s ease, box-shadow .2s ease",
        "&:hover": {
          transform: "translateY(-2px)",
          boxShadow: theme.shadows[3],
        },
      }}
    >
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          background: `linear-gradient(135deg, ${alpha(color, 0.12)} 0%, ${alpha(
            color,
            0
          )} 60%)`,
          pointerEvents: "none",
        }}
      />
      <CardContent sx={{ position: "relative" }}>
        <Stack direction="row" alignItems="center" spacing={2}>
          <Avatar
            sx={{
              bgcolor: alpha(color, 0.15),
              color,
              width: 48,
              height: 48,
            }}
          >
            {icon}
          </Avatar>
          <Box>
            <Typography variant="body2" color="text.secondary">
              {label}
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 700, lineHeight: 1.1 }}>
              {String(value).padStart(2, "0")}
            </Typography>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}

function getInitials(name?: string) {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function Page() {
  const t = useTranslations();
  const theme = useTheme();

  const [rows, setRows] = useState<StudentsInfo[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const classroom = useAtomValue(classroomAtom);
  const students = useAtomValue(studentsAtom);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const notification = useNotifications();

  const [rowSelectionModel, setRowSelectionModel] =
    useState<GridRowSelectionModel>({
      type: "include",
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

  const columns: GridColDef<StudentsInfo>[] = useMemo(
    () => [
      {
        field: "orderNo",
        headerName: t("CommonField.id"),
        headerClassName: "font-siemreap",
        width: 80,
        editable: false,
      },
      {
        field: "idCard",
        headerName: t("CommonField.idCard"),
        headerClassName: "font-siemreap",
        width: 100,
        editable: true,
      },
      {
        field: "fullName",
        headerName: t("CommonField.fullName"),
        headerClassName: "font-siemreap",
        width: 220,
        editable: true,
        sortable: true,
        disableColumnMenu: true,
        renderCell: (params: GridRenderCellParams<StudentsInfo>) => {
          const isFemale = params.row.gender === "F";
          const tone = isFemale
            ? theme.palette.secondary.main
            : theme.palette.info.main;
          return (
            <Stack
              direction="row"
              alignItems="center"
              spacing={1.25}
              sx={{ height: "100%" }}
            >
              <Avatar
                sx={{
                  width: 28,
                  height: 28,
                  fontSize: 12,
                  fontWeight: 700,
                  bgcolor: alpha(tone, 0.15),
                  color: tone,
                }}
              >
                {getInitials(params.value)}
              </Avatar>
              <Typography variant="body2" noWrap>
                {params.value || "—"}
              </Typography>
            </Stack>
          );
        },
      },
      {
        field: "gender",
        headerName: t("CommonField.sex"),
        headerClassName: "font-siemreap",
        type: "singleSelect",
        width: 110,
        align: "center",
        headerAlign: "center",
        editable: true,
        sortable: false,
        disableColumnMenu: true,
        valueOptions: [
          { value: "M", label: t("Common.male") },
          { value: "F", label: t("Common.female") },
        ],
        renderCell: (params: GridRenderCellParams<StudentsInfo>) => {
          const isFemale = params.value === "F";
          const tone = isFemale
            ? theme.palette.secondary.main
            : theme.palette.info.main;
          return (
            <Chip
              size="small"
              icon={
                isFemale ? (
                  <WomanIcon sx={{ fontSize: 16 }} />
                ) : (
                  <ManIcon sx={{ fontSize: 16 }} />
                )
              }
              label={isFemale ? t("Common.female") : t("Common.male")}
              sx={{
                bgcolor: alpha(tone, 0.12),
                color: tone,
                border: `1px solid ${alpha(tone, 0.25)}`,
                "& .MuiChip-icon": { color: tone },
                fontWeight: 600,
              }}
            />
          );
        },
      },
      {
        field: "dateOfBirth",
        headerName: t("CommonField.dateOfBirth"),
        type: "date",
        headerClassName: "font-siemreap",
        width: 140,
        editable: true,
        sortable: false,
        disableColumnMenu: true,
        valueGetter: (value) => (value ? new Date(value as string) : null),
        valueFormatter: (value) => {
          if (!value) return "";
          return dayjs(value as Date).format("DD-MM-YYYY");
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
    ],
    [t, theme.palette.info.main, theme.palette.secondary.main]
  );

  const handleDeleteStudents = async () => {
    const ids = Array.from(rowSelectionModel.ids) as string[];
    if (ids.length === 0) return;

    const tempIds = ids.filter((id) => String(id).startsWith("temp-"));
    const dbIds = ids.filter((id) => !String(id).startsWith("temp-"));

    if (tempIds.length > 0) {
      setRows((prev) => prev.filter((r) => !tempIds.includes(r.id)));
    }

    if (dbIds.length > 0 && classroom?.id) {
      const result = await StudentService.deleteList(dbIds, classroom?.id);
      if (result?.status === 200) {
        setRows((prev) => prev.filter((r) => !dbIds.includes(r.id)));
        notification.show(result?.message || "Deleted successfully.", {
          severity: "success",
        });
      } else {
        notification.show("Failed to delete records.", {
          severity: "error",
        });
      }
    }

    setRowSelectionModel({ type: "include", ids: new Set<GridRowId>([]) });
  };

  const processRowUpdate = async (
    newRow: StudentsInfo,
    oldRow: StudentsInfo
  ): Promise<StudentsInfo> => {
    setIsLoading(true);

    try {
      if (rows.length >= 60) {
        notification.show("Cannot add more than 60 students.", {
          severity: "error",
        });
        return oldRow;
      }
      const isTempRow = String(newRow.id).startsWith("temp-");

      if (!newRow.fullName) {
        notification.show(
          t("CommonField.fullName") +
            t("CommonValidate.cannotEmpty") +
            " " +
            t("CommonValidate.inputFirst", {
              fullName: t("CommonField.fullName"),
            }),
          { severity: "error" }
        );
        return oldRow;
      }

      const sendData: StudentsRequestUpsertType = {
        ...newRow,
        classId: classroom?.id,
        dateOfBirth: newRow.dateOfBirth
          ? dayjs(newRow.dateOfBirth).format("YYYY-MM-DD")
          : "",
      };

      if (isTempRow) delete (sendData as any).id;

      if (!sendData.classId) {
        setIsLoading(false);
        return oldRow;
      }

      const result = await StudentService.upsertStudent(sendData);

      if (result?.status === 200) {
        const updated = result?.payload;

        if (isTempRow && updated?.id) {
          const newStudent = { ...newRow, id: updated.id };
          setRows((prev) =>
            prev.map((r) =>
              r.id === newRow.id ? { ...newRow, id: newStudent.id } : r
            )
          );
          notification.show("Student added successfully.", {
            severity: "success",
          });
          return newStudent;
        } else {
          setRows((prev) => prev.map((r) => (r.id === newRow.id ? newRow : r)));
          notification.show("Student updated successfully.", {
            severity: "success",
          });
          return newRow;
        }
      } else {
        notification.show("Failed to save student.", { severity: "error" });
        return oldRow;
      }
    } catch (error) {
      console.error("processRowUpdate error:", error);
      return oldRow;
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
      } as StudentsInfo,
    ]);
  };

  const studentInfoCount = useMemo<StudentCountType>(() => {
    const tMale = rows.filter((row) => row.gender === "M");
    const tFemale = rows.filter((row) => row.gender === "F");
    return {
      total: rows.length,
      totalMale: tMale.length,
      totalFemale: tFemale.length,
    };
  }, [rows]);

  const selectedCount = rowSelectionModel.ids.size;

  if (!classroom?.id) {
    return (
      <Box sx={{ width: "100%", maxWidth: { sm: "100%", md: "1700px" } }}>
        <Card variant="outlined" sx={{ p: 4 }}>
          <EmptyStateCard
            title={t("Common.classroom")}
            description={t("Common.createClassroom")}
            buttonLabel={t("Common.createClassroom")}
            onButtonClick={() => {}}
            minHeight={320}
          />
        </Card>
      </Box>
    );
  }

  return (
    <Box sx={{ width: "100%", maxWidth: { sm: "100%", md: "1700px" } }}>
      {/* Page header */}
      <Stack
        direction={{ xs: "column", sm: "row" }}
        alignItems={{ xs: "flex-start", sm: "center" }}
        justifyContent="space-between"
        spacing={1}
        sx={{ mb: 3 }}
      >
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <Avatar
            sx={{
              bgcolor: alpha(theme.palette.primary.main, 0.12),
              color: "primary.main",
              width: 44,
              height: 44,
            }}
          >
            <SchoolIcon />
          </Avatar>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
              {t("Student.title")}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {[classroom?.name, classroom?.grade, classroom?.year]
                .filter(Boolean)
                .join(" • ")}
            </Typography>
          </Box>
        </Stack>
      </Stack>

      {/* Stat cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 4 }}>
          <StudentStatCard
            label={t("Common.total")}
            value={studentInfoCount.total}
            icon={<GroupsIcon />}
            tone="primary"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <StudentStatCard
            label={t("Common.male")}
            value={studentInfoCount.totalMale}
            icon={<ManIcon />}
            tone="info"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <StudentStatCard
            label={t("Common.female")}
            value={studentInfoCount.totalFemale}
            icon={<WomanIcon />}
            tone="secondary"
          />
        </Grid>
      </Grid>

      {/* Table card */}
      <Card variant="outlined">
        <CardContent
          sx={{
            display: "flex",
            flexDirection: { xs: "column", md: "row" },
            alignItems: { xs: "stretch", md: "center" },
            justifyContent: "space-between",
            gap: 1.5,
            pb: 1.5,
          }}
        >
          {/* Left: title or selection bar */}
          {selectedCount > 0 ? (
            <Stack direction="row" alignItems="center" spacing={1.5}>
              <Chip
                color="primary"
                label={`${selectedCount} ${t("Common.student")}`}
                sx={{ fontWeight: 600 }}
              />
              <Button
                onClick={() => setDeleteDialogOpen(true)}
                variant="outlined"
                color="error"
                size="small"
                startIcon={<DeleteSweepIcon />}
              >
                {t("Student.btn.deleteStu")}
              </Button>
            </Stack>
          ) : (
            <Stack direction="row" alignItems="center" spacing={1}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                {t("Student.title")}
              </Typography>
              <Chip
                size="small"
                variant="outlined"
                label={`${studentInfoCount.total}/60`}
              />
            </Stack>
          )}

          {/* Right: action buttons */}
          <Stack
            direction="row"
            spacing={1}
            flexWrap="wrap"
            useFlexGap
            sx={{ rowGap: 1 }}
          >
            <InsertOneStudentDialog />
            <Button
              onClick={handleAddMulti}
              variant="outlined"
              size="small"
              startIcon={<GroupAddIcon />}
            >
              {t("Student.btn.multiAdd")}
            </Button>
            {Number(students?.total) === 0 ? <ImportStudentsDialog /> : null}
          </Stack>
        </CardContent>

        <Divider />

        <Box className="font-siemreap" sx={{ height: 600, width: "100%" }}>
          <DataGrid
            rows={rows}
            columns={columns}
            loading={isLoading}
            initialState={{
              pagination: { paginationModel: { pageSize: 40 } },
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
            showToolbar
            slots={{ toolbar: CustomDataGridToolbar }}
            slotProps={{
              toolbar: {
                settings,
                onSettingsChange: setSettings,
                toolbarButtons: {
                  search: true,
                  settings: true,
                  export: true,
                  toggleColumn: true,
                  exportTitle: t("Student.title"),
                },
              },
            }}
            sx={{
              border: 0,
              "& .MuiDataGrid-columnHeaderCheckbox .MuiCheckbox-root": {
                display: "none",
              },
              "& .MuiDataGrid-columnHeaders": {
                bgcolor: alpha(theme.palette.primary.main, 0.04),
              },
              "& .MuiDataGrid-row:hover": {
                bgcolor: alpha(theme.palette.primary.main, 0.04),
              },
            }}
          />
        </Box>
      </Card>

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
  );
}
