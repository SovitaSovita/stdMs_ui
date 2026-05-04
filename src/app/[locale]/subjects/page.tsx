"use client";

import {
  SubjectResponse,
  SubjectUpsertRequest,
} from "@/app/constants/type/SubjectType";
import { Settings } from "@/app/constants/type";
import { AddSubjectDialog } from "@/app/dashboard/components/Dialog/AddSubjectDialog";
import { DeleteConfirmationDialog } from "@/app/dashboard/components/Dialog/DeleteConfirmationDialog";
import { CustomDataGridToolbar } from "@/app/dashboard/components/Common/CustomDataGridToolbar";
import EmptyStateCard from "@/app/dashboard/components/Common/EmptyStateCard";
import { classroomAtom, subjectsAtom } from "@/app/libs/jotai/classroomAtom";
import useNotifications from "@/app/libs/hooks/useNotifications/useNotifications";
import SubjectService from "@/app/service/SubjectService";
import {
  getInitialSettings,
  SETTINGS_STORAGE_KEY,
} from "@/app/utils/axios/Common";
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
  Tooltip,
  Typography,
  alpha,
  useTheme,
} from "@mui/material";
import {
  DataGrid,
  GridActionsCellItem,
  GridColDef,
  GridRenderCellParams,
  GridRowId,
  GridRowSelectionModel,
} from "@mui/x-data-grid";
import { useAtom, useAtomValue } from "jotai";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useState } from "react";
import DeleteIcon from "@mui/icons-material/Delete";
import DeleteSweepIcon from "@mui/icons-material/DeleteSweep";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import StarsIcon from "@mui/icons-material/Stars";
import PersonIcon from "@mui/icons-material/Person";
import SchoolIcon from "@mui/icons-material/School";
import LibraryBooksIcon from "@mui/icons-material/LibraryBooks";

type StatTone = "primary" | "info" | "secondary" | "success" | "warning";

function SubjectStatCard({
  label,
  value,
  icon,
  tone,
}: {
  label: string;
  value: string | number;
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
              {value}
            </Typography>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}

const SUBJECT_PALETTE = [
  "#1976d2",
  "#9c27b0",
  "#e91e63",
  "#f57c00",
  "#388e3c",
  "#0097a7",
  "#5d4037",
  "#455a64",
];

function colorForSubject(name?: string) {
  if (!name) return SUBJECT_PALETTE[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash << 5) - hash + name.charCodeAt(i);
    hash |= 0;
  }
  return SUBJECT_PALETTE[Math.abs(hash) % SUBJECT_PALETTE.length];
}

function getSubjectInitials(name?: string) {
  if (!name) return "?";
  const trimmed = name.trim();
  if (!trimmed) return "?";
  const parts = trimmed.split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

export default function Page() {
  const t = useTranslations();
  const theme = useTheme();
  const notifications = useNotifications();

  const classroom = useAtomValue(classroomAtom);
  const [subjects, setSubjects] = useAtom(subjectsAtom);

  const [rows, setRows] = useState<SubjectResponse[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<GridRowId | null>(null);
  const [rowSelectionModel, setRowSelectionModel] =
    useState<GridRowSelectionModel>({
      type: "include",
      ids: new Set<GridRowId>([]),
    });

  const [settings, setSettings] = useState<Settings>(getInitialSettings());

  useEffect(() => {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    if (subjects) setRows(subjects);
  }, [subjects]);

  const refetchSubjects = useCallback(async () => {
    if (!classroom?.id) return;
    const result = await SubjectService.getByClassId(classroom.id);
    setSubjects(result?.length ? result : []);
  }, [classroom?.id, setSubjects]);

  const handleDelete = async () => {
    const id = pendingDeleteId;
    if (!id) return;

    const isTemp = String(id).startsWith("temp-");

    if (isTemp) {
      setRows((prev) => prev.filter((r) => r.id !== id));
    } else {
      const result = await SubjectService.delete(String(id));
      if (result?.status === 200) {
        setRows((prev) => prev.filter((r) => r.id !== id));
        refetchSubjects();
        notifications.show(result?.message || "Deleted successfully.", {
          severity: "success",
          autoHideDuration: 3000,
        });
      } else {
        notifications.show("Failed to delete record.", {
          severity: "error",
          autoHideDuration: 3000,
        });
      }
    }

    setPendingDeleteId(null);
    setRowSelectionModel({ type: "include", ids: new Set<GridRowId>([]) });
  };

  const handleBulkDelete = async () => {
    const ids = Array.from(rowSelectionModel.ids) as string[];
    if (ids.length === 0) return;

    const tempIds = ids.filter((id) => String(id).startsWith("temp-"));
    const dbIds = ids.filter((id) => !String(id).startsWith("temp-"));

    if (tempIds.length > 0) {
      setRows((prev) => prev.filter((r) => !tempIds.includes(r.id)));
    }

    let succeeded = 0;
    for (const id of dbIds) {
      const result = await SubjectService.delete(id);
      if (result?.status === 200) succeeded++;
    }

    if (dbIds.length > 0) {
      if (succeeded > 0) {
        setRows((prev) => prev.filter((r) => !dbIds.includes(r.id)));
        refetchSubjects();
        notifications.show(`Deleted ${succeeded} subject(s) successfully.`, {
          severity: "success",
          autoHideDuration: 3000,
        });
      }
      if (succeeded < dbIds.length) {
        notifications.show("Some subjects could not be deleted.", {
          severity: "error",
          autoHideDuration: 3000,
        });
      }
    }

    setRowSelectionModel({ type: "include", ids: new Set<GridRowId>([]) });
  };

  const processRowUpdate = async (
    newRow: SubjectResponse,
    oldRow: SubjectResponse
  ): Promise<SubjectResponse> => {
    setIsLoading(true);
    try {
      if (
        newRow.name === oldRow.name &&
        newRow.nameKh === oldRow.nameKh &&
        newRow.teacherName === oldRow.teacherName &&
        newRow.maxScore === oldRow.maxScore &&
        newRow.credit === oldRow.credit &&
        newRow.description === oldRow.description
      ) {
        notifications.show(t("CommonValidate.noChange"), {
          severity: "info",
          autoHideDuration: 3000,
        });
        return oldRow;
      }

      const isTempRow = String(newRow.id).startsWith("temp-");

      if (!newRow.name) {
        notifications.show(t("CommonValidate.cannotEmpty"), {
          severity: "error",
          autoHideDuration: 3000,
        });
        return oldRow;
      }

      const sendData: SubjectUpsertRequest = {
        ...newRow,
        classId: classroom?.id,
      };
      if (isTempRow) delete (sendData as any).id;
      if (!sendData.classId) {
        setIsLoading(false);
        return oldRow;
      }

      const result = await SubjectService.upsert(sendData);
      if (result?.status === 200) {
        const updated = result?.payload;
        if (isTempRow && updated?.id) {
          const newSubject = { ...newRow, id: updated.id };
          setRows((prev) =>
            prev.map((r) =>
              r.id === newRow.id ? { ...newRow, id: newSubject.id } : r
            )
          );
          refetchSubjects();
          notifications.show(result?.message || "Subject added successfully.", {
            severity: "success",
            autoHideDuration: 3000,
          });
          return newSubject;
        } else {
          setRows((prev) => prev.map((r) => (r.id === newRow.id ? newRow : r)));
          refetchSubjects();
          notifications.show(
            result?.message || "Subject updated successfully.",
            { severity: "success", autoHideDuration: 3000 }
          );
          return newRow;
        }
      } else {
        notifications.show("Failed to save subject.", {
          severity: "error",
          autoHideDuration: 3000,
        });
        return oldRow;
      }
    } catch (error) {
      console.error("processRowUpdate error:", error);
      return oldRow;
    } finally {
      setIsLoading(false);
    }
  };

  const stats = useMemo(() => {
    const totalCredits = rows.reduce((sum, r) => {
      const n = Number(r.credit);
      return sum + (Number.isFinite(n) ? n : 0);
    }, 0);
    const assignedTeachers = rows.filter(
      (r) => r.teacherName && r.teacherName.trim() !== ""
    ).length;
    return {
      total: rows.length,
      totalCredits,
      assignedTeachers,
    };
  }, [rows]);

  const columns = useMemo<GridColDef<SubjectResponse>[]>(
    () => [
      {
        field: "id",
        headerName: t("CommonField.id"),
        headerClassName: "font-siemreap",
        width: 70,
        align: "center",
        headerAlign: "center",
        editable: false,
        filterable: false,
        sortable: true,
        disableColumnMenu: true,
        renderCell: (params) =>
          params.api.getRowIndexRelativeToVisibleRows(params.id) + 1,
      },
      {
        field: "name",
        headerName: t("CommonField.subject") + " (EN)",
        headerClassName: "font-siemreap",
        headerAlign: "left",
        align: "left",
        width: 200,
        editable: false,
        sortable: true,
        filterable: true,
        disableColumnMenu: true,
        renderCell: (params: GridRenderCellParams<SubjectResponse>) => {
          const color = colorForSubject(params.row.name);
          return (
            <Stack
              direction="row"
              alignItems="center"
              spacing={1.25}
              sx={{ height: "100%", minWidth: 0 }}
            >
              <Avatar
                variant="rounded"
                sx={{
                  width: 28,
                  height: 28,
                  fontSize: 11,
                  fontWeight: 700,
                  bgcolor: alpha(color, 0.15),
                  color,
                  flexShrink: 0,
                }}
              >
                {getSubjectInitials(params.row.name)}
              </Avatar>
              <Typography
                variant="body2"
                sx={{ fontWeight: 600, minWidth: 0 }}
                noWrap
              >
                {params.row.name || "—"}
              </Typography>
            </Stack>
          );
        },
      },
      {
        field: "nameKh",
        headerName: t("CommonField.subject") + " (KH)",
        headerClassName: "font-siemreap",
        headerAlign: "left",
        align: "left",
        width: 150,
        editable: false,
        sortable: true,
        filterable: false,
        disableColumnMenu: true,
      },
      {
        field: "teacherName",
        headerName: t("CommonField.teacherName"),
        headerClassName: "font-siemreap",
        headerAlign: "left",
        align: "left",
        width: 180,
        editable: true,
        sortable: false,
        filterable: false,
        disableColumnMenu: true,
        renderCell: (params: GridRenderCellParams<SubjectResponse>) => {
          const value = params.value as string | undefined;
          if (!value || !value.trim()) {
            return (
              <Chip
                size="small"
                variant="outlined"
                label={t("CommonField.teacherName")}
                sx={{ color: "text.disabled", borderStyle: "dashed" }}
              />
            );
          }
          return (
            <Stack
              direction="row"
              alignItems="center"
              spacing={1}
              sx={{ height: "100%" }}
            >
              <Avatar
                sx={{
                  width: 24,
                  height: 24,
                  fontSize: 11,
                  bgcolor: alpha(theme.palette.primary.main, 0.15),
                  color: "primary.main",
                }}
              >
                <PersonIcon sx={{ fontSize: 14 }} />
              </Avatar>
              <Typography variant="body2" noWrap>
                {value}
              </Typography>
            </Stack>
          );
        },
      },
      {
        field: "credit",
        type: "number",
        headerAlign: "center",
        align: "center",
        headerName: t("CommonField.credit"),
        headerClassName: "font-siemreap",
        width: 110,
        editable: true,
        sortable: true,
        filterable: false,
        disableColumnMenu: true,
        renderCell: (params: GridRenderCellParams<SubjectResponse>) => {
          const v = params.value as string | number | undefined;
          if (v === undefined || v === null || v === "") {
            return (
              <Typography variant="body2" color="text.disabled">
                —
              </Typography>
            );
          }
          return (
            <Chip
              size="small"
              icon={<StarsIcon sx={{ fontSize: 14 }} />}
              label={v}
              sx={{
                bgcolor: alpha(theme.palette.warning.main, 0.12),
                color: theme.palette.warning.dark,
                "& .MuiChip-icon": { color: theme.palette.warning.main },
                fontWeight: 600,
              }}
            />
          );
        },
      },
      {
        field: "maxScore",
        type: "number",
        headerAlign: "center",
        align: "center",
        headerName: t("CommonField.maxScore"),
        headerClassName: "font-siemreap",
        width: 130,
        editable: true,
        sortable: true,
        filterable: false,
        disableColumnMenu: true,
        renderCell: (params: GridRenderCellParams<SubjectResponse>) => {
          const v = Number(params.value ?? 0);
          if (!v) {
            return (
              <Typography variant="body2" color="text.disabled">
                —
              </Typography>
            );
          }
          return (
            <Chip
              size="small"
              label={v}
              sx={{
                bgcolor: alpha(theme.palette.success.main, 0.12),
                color: theme.palette.success.dark,
                fontWeight: 600,
              }}
            />
          );
        },
      },
      {
        field: "description",
        headerName: t("CommonField.description"),
        headerClassName: "font-siemreap",
        headerAlign: "left",
        align: "left",
        width: 240,
        editable: true,
        sortable: false,
        filterable: false,
        disableColumnMenu: true,
        renderCell: (params: GridRenderCellParams<SubjectResponse>) => {
          const v = params.value as string | undefined;
          if (!v) {
            return (
              <Typography variant="body2" color="text.disabled">
                —
              </Typography>
            );
          }
          return (
            <Tooltip title={v} placement="top-start">
              <Typography variant="body2" noWrap>
                {v}
              </Typography>
            </Tooltip>
          );
        },
      },
      {
        field: "actions",
        type: "actions",
        width: 80,
        headerAlign: "right",
        align: "right",
        getActions: ({ id }) => [
          <GridActionsCellItem
            key="delete"
            icon={<DeleteIcon color="error" />}
            label="Delete"
            onClick={() => {
              setPendingDeleteId(id);
              setDeleteDialogOpen(true);
            }}
          />,
        ],
      },
    ],
    [t, theme.palette.primary.main, theme.palette.success, theme.palette.warning]
  );

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
              {t("Common.subject")}
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
          <SubjectStatCard
            label={t("Common.subject")}
            value={String(stats.total).padStart(2, "0")}
            icon={<MenuBookIcon />}
            tone="primary"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <SubjectStatCard
            label={t("CommonField.credit")}
            value={stats.totalCredits}
            icon={<StarsIcon />}
            tone="warning"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <SubjectStatCard
            label={t("CommonField.teacherName")}
            value={`${stats.assignedTeachers}/${stats.total}`}
            icon={<PersonIcon />}
            tone="success"
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
          {selectedCount > 0 ? (
            <Stack direction="row" alignItems="center" spacing={1.5}>
              <Chip
                color="primary"
                label={`${selectedCount} ${t("Common.subject")}`}
                sx={{ fontWeight: 600 }}
              />
              <Button
                onClick={() => {
                  setPendingDeleteId(null);
                  setDeleteDialogOpen(true);
                }}
                variant="outlined"
                color="error"
                size="small"
                startIcon={<DeleteSweepIcon />}
              >
                {t("Common.delete")}
              </Button>
            </Stack>
          ) : (
            <Stack direction="row" alignItems="center" spacing={1}>
              <LibraryBooksIcon color="action" fontSize="small" />
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                {t("Common.subject")}
              </Typography>
              <Chip size="small" variant="outlined" label={stats.total} />
            </Stack>
          )}

          <Stack
            direction="row"
            spacing={1}
            flexWrap="wrap"
            useFlexGap
            sx={{ rowGap: 1 }}
          >
            <AddSubjectDialog />
          </Stack>
        </CardContent>

        <Divider />

        <Box className="font-siemreap" sx={{ height: 600, width: "100%" }}>
          <DataGrid
            rows={rows}
            columns={columns}
            loading={isLoading}
            initialState={{
              pagination: { paginationModel: { pageSize: 15 } },
            }}
            pageSizeOptions={[15, 25, 50]}
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
                  exportTitle: t("Common.subject"),
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
        onClose={() => {
          setDeleteDialogOpen(false);
          setPendingDeleteId(null);
        }}
        onConfirm={pendingDeleteId ? handleDelete : handleBulkDelete}
        itemName="subjects"
        itemCount={
          pendingDeleteId ? 1 : rowSelectionModel.ids.size
        }
        title={t("Common.titleDeleteConfirm")}
        message={t("Common.deleteConfirmation", {
          subject: t("Common.subject"),
        })}
        confirmText={t("Common.delete")}
        cancelText={t("Common.cancel")}
      />
    </Box>
  );
}
