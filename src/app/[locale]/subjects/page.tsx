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
import useClassroomData from "@/app/libs/hooks/useClassroomData";
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
  Paper,
  Slide,
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
  useGridApiRef,
} from "@mui/x-data-grid";
import { useAtom, useAtomValue } from "jotai";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import DeleteIcon from "@mui/icons-material/Delete";
import DeleteSweepIcon from "@mui/icons-material/DeleteSweep";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import StarsIcon from "@mui/icons-material/Stars";
import PersonIcon from "@mui/icons-material/Person";
import SchoolIcon from "@mui/icons-material/School";
import LibraryBooksIcon from "@mui/icons-material/LibraryBooks";
import LibraryAddIcon from "@mui/icons-material/LibraryAdd";
import SaveIcon from "@mui/icons-material/Save";
import RestoreIcon from "@mui/icons-material/Restore";
import EditNoteIcon from "@mui/icons-material/EditNote";

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

  // Re-fetch on direct page load (atom is in-memory only).
  useClassroomData(classroom);

  const [rows, setRows] = useState<SubjectResponse[]>([]);
  const [originalRows, setOriginalRows] = useState<SubjectResponse[]>([]);
  const [modifiedIds, setModifiedIds] = useState<Set<GridRowId>>(new Set());
  const [focusedCell, setFocusedCell] = useState<{
    rowId: GridRowId;
    field: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<GridRowId | null>(null);
  const [rowSelectionModel, setRowSelectionModel] =
    useState<GridRowSelectionModel>({
      type: "include",
      ids: new Set<GridRowId>([]),
    });
  const gridWrapperRef = useRef<HTMLDivElement | null>(null);
  const isEditingRef = useRef(false);
  const apiRef = useGridApiRef();

  const [settings, setSettings] = useState<Settings>(getInitialSettings());

  useEffect(() => {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    if (subjects) {
      setRows(subjects);
      setOriginalRows(JSON.parse(JSON.stringify(subjects)));
      setModifiedIds(new Set());
    }
  }, [subjects]);

  const originalRowMap = useMemo(() => {
    const m = new Map<GridRowId, SubjectResponse>();
    originalRows.forEach((r) => m.set(r.id, r));
    return m;
  }, [originalRows]);

  // Order of fields when pasting a multi-column block from Excel.
  const PASTEABLE_FIELDS: (keyof SubjectResponse)[] = useMemo(
    () => ["name", "nameKh", "teacherName", "credit", "maxScore", "description"],
    []
  );

  const isNewRow = useCallback(
    (id: GridRowId) => String(id).startsWith("temp-"),
    []
  );

  const isCellModified = useCallback(
    (rowId: GridRowId, field: keyof SubjectResponse): boolean => {
      if (isNewRow(rowId)) return false;
      const orig = originalRowMap.get(rowId);
      const current = rows.find((r) => r.id === rowId);
      if (!orig || !current) return false;
      return (orig as any)[field] !== (current as any)[field];
    },
    [originalRowMap, rows, isNewRow]
  );

  const getOriginalValue = useCallback(
    (rowId: GridRowId, field: keyof SubjectResponse): any => {
      return (originalRowMap.get(rowId) as any)?.[field];
    },
    [originalRowMap]
  );

  const isRowDirty = useCallback(
    (r: SubjectResponse): boolean => {
      if (isNewRow(r.id)) return true;
      const orig = originalRowMap.get(r.id);
      if (!orig) return true;
      return PASTEABLE_FIELDS.some((f) => (orig as any)[f] !== (r as any)[f]);
    },
    [originalRowMap, isNewRow, PASTEABLE_FIELDS]
  );

  const normalizeValue = useCallback(
    (field: keyof SubjectResponse, raw: string): any => {
      if (field === "credit" || field === "maxScore") {
        const n = Number(raw.replace(/,/g, ""));
        return Number.isFinite(n) ? n : raw;
      }
      return raw;
    },
    []
  );

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

  // Edits stage in `modifiedIds`; the API call happens on Save Changes.
  const processRowUpdate = async (
    newRow: SubjectResponse,
    oldRow: SubjectResponse
  ): Promise<SubjectResponse> => {
    try {
      const changedField = Object.keys(newRow).find(
        (key) => (newRow as any)[key] !== (oldRow as any)[key]
      );
      if (!changedField) return oldRow;

      setRows((prev) => prev.map((r) => (r.id === newRow.id ? newRow : r)));

      setModifiedIds((prev) => {
        const next = new Set(prev);
        if (isNewRow(newRow.id) || isRowDirty(newRow)) {
          next.add(newRow.id);
        } else {
          next.delete(newRow.id);
        }
        return next;
      });

      return newRow;
    } catch (error) {
      console.error("processRowUpdate error:", error);
      return oldRow;
    }
  };

  const handleAddMulti = useCallback(() => {
    const tempId = `temp-${Date.now()}`;
    setRows((prev) => [
      ...prev,
      {
        id: tempId,
        name: "",
        nameEn: "",
        nameKh: "",
        teacherName: "",
        maxScore: 0,
        credit: "",
        description: "",
      } as SubjectResponse,
    ]);
    setModifiedIds((prev) => new Set(prev).add(tempId));
  }, []);

  const handleSaveChanges = async () => {
    const pending = rows.filter((r) => modifiedIds.has(r.id));
    if (pending.length === 0) {
      notifications.show(t("Subject.noChanges"), { severity: "info" });
      return;
    }

    const invalid = pending.filter((r) => !r.name?.trim());
    if (invalid.length > 0) {
      notifications.show(
        t("Subject.nameRequired", { count: invalid.length }),
        { severity: "error", autoHideDuration: 4000 }
      );
      return;
    }
    if (!classroom?.id) {
      notifications.show(t("Subject.missingClassroom"), { severity: "error" });
      return;
    }

    setIsLoading(true);
    try {
      const responses = await Promise.all(
        pending.map(async (r) => {
          const isNew = isNewRow(r.id);
          const sendData: SubjectUpsertRequest = {
            ...r,
            classId: classroom.id,
          };
          if (isNew) delete (sendData as any).id;
          try {
            const result = await SubjectService.upsert(sendData);
            return { id: r.id, isNew, result, ok: result?.status === 200 };
          } catch (err) {
            return { id: r.id, isNew, result: null, ok: false };
          }
        })
      );

      const succeeded = responses.filter((x) => x.ok);
      const failed = responses.filter((x) => !x.ok);

      let updatedRows = rows.slice();
      const stillModified = new Set(modifiedIds);
      succeeded.forEach((s) => {
        const realId = s.result?.payload?.id;
        if (s.isNew && realId) {
          updatedRows = updatedRows.map((r) =>
            r.id === s.id ? { ...r, id: realId } : r
          );
        }
        stillModified.delete(s.id);
        if (s.isNew && realId) stillModified.delete(realId);
      });

      setRows(updatedRows);
      setOriginalRows(JSON.parse(JSON.stringify(updatedRows)));
      setModifiedIds(stillModified);
      // refresh atom so other pages see the new data
      refetchSubjects();

      if (failed.length === 0) {
        notifications.show(
          t("Subject.savedCount", { count: succeeded.length }),
          { severity: "success", autoHideDuration: 3000 }
        );
      } else {
        notifications.show(
          t("Subject.savedPartial", {
            saved: succeeded.length,
            failed: failed.length,
          }),
          { severity: "warning", autoHideDuration: 5000 }
        );
      }
    } catch (error) {
      console.error("handleSaveChanges error:", error);
      notifications.show(t("Subject.saveFailed"), { severity: "error" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDiscard = useCallback(() => {
    setRows(JSON.parse(JSON.stringify(originalRows)));
    setModifiedIds(new Set());
  }, [originalRows]);

  // ─────────────────────────────────────────────────────────────────────────
  // Clipboard paste — fill multi-column block from Excel into editable cells.
  // ─────────────────────────────────────────────────────────────────────────
  const handlePasteSubjects = useCallback(
    (event: ClipboardEvent) => {
      if (!focusedCell) return;
      const wrapper = gridWrapperRef.current;
      if (
        wrapper &&
        document.activeElement &&
        !wrapper.contains(document.activeElement as Node)
      ) {
        return;
      }
      const startField = focusedCell.field as keyof SubjectResponse;
      const startCol = PASTEABLE_FIELDS.indexOf(startField);
      if (startCol < 0) return;

      const text = event.clipboardData?.getData("text");
      if (!text) return;

      const matrix = text
        .replace(/\r/g, "")
        .split("\n")
        .filter((line, idx, arr) => idx < arr.length - 1 || line.length > 0)
        .map((line) => line.split("\t"));
      if (matrix.length === 0) return;

      event.preventDefault();
      event.stopPropagation();

      if (isEditingRef.current && apiRef.current) {
        try {
          apiRef.current.stopCellEditMode({
            id: focusedCell.rowId,
            field: focusedCell.field,
            ignoreModifications: true,
          });
        } catch {
          /* ignore */
        }
        isEditingRef.current = false;
      }

      const startRowIdx = rows.findIndex((r) => r.id === focusedCell.rowId);
      if (startRowIdx < 0) return;

      let next = [...rows];
      const stillModified = new Set(modifiedIds);
      let appended = 0;

      for (let r = 0; r < matrix.length; r++) {
        let targetIdx = startRowIdx + r;
        // Auto-create new (temp) rows so a long paste can populate fresh subjects.
        if (targetIdx >= next.length) {
          const tempId = `temp-${Date.now()}-${appended++}`;
          next = [
            ...next,
            {
              id: tempId,
              name: "",
              nameEn: "",
              nameKh: "",
              teacherName: "",
              maxScore: 0,
              credit: "",
              description: "",
            } as SubjectResponse,
          ];
          targetIdx = next.length - 1;
        }

        const cells = matrix[r];
        const row: any = { ...next[targetIdx] };
        for (let c = 0; c < cells.length; c++) {
          const colIdx = startCol + c;
          if (colIdx >= PASTEABLE_FIELDS.length) break;
          const field = PASTEABLE_FIELDS[colIdx];
          const raw = cells[c];
          if (raw === undefined) continue;
          const trimmed = raw.trim();
          if (trimmed === "") continue;
          row[field] = normalizeValue(field, trimmed);
        }
        next[targetIdx] = row as SubjectResponse;
        if (isNewRow(row.id) || isRowDirty(row)) stillModified.add(row.id);
        else stillModified.delete(row.id);
      }

      setRows(next);
      setModifiedIds(stillModified);
      const filledCells = matrix.length * (matrix[0]?.length ?? 0);
      notifications.show(t("Subject.pasted", { filled: filledCells }), {
        severity: "success",
        autoHideDuration: 3000,
      });
    },
    [
      focusedCell,
      rows,
      modifiedIds,
      apiRef,
      PASTEABLE_FIELDS,
      isNewRow,
      isRowDirty,
      normalizeValue,
      notifications,
      t,
    ]
  );

  useEffect(() => {
    const listener = (e: ClipboardEvent) => handlePasteSubjects(e);
    document.addEventListener("paste", listener, true);
    return () => document.removeEventListener("paste", listener, true);
  }, [handlePasteSubjects]);

  // Ctrl/Cmd+S to save when there are pending edits.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        if (modifiedIds.size === 0) return;
        e.preventDefault();
        handleSaveChanges();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modifiedIds.size]);

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

  const cellModifiedClass = useCallback(
    (params: { id: GridRowId; field: string }) =>
      isCellModified(params.id, params.field as keyof SubjectResponse)
        ? "cell-modified"
        : "",
    [isCellModified]
  );

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
        editable: true,
        sortable: true,
        filterable: true,
        disableColumnMenu: true,
        cellClassName: cellModifiedClass,
        renderCell: (params: GridRenderCellParams<SubjectResponse>) => {
          const color = colorForSubject(params.row.name);
          const inner = (
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
          if (!isCellModified(params.id, "name")) return inner;
          const original = getOriginalValue(params.id, "name");
          return (
            <Tooltip
              title={`${t("MonthlyExam.previousScore")}: ${original ?? "—"}`}
              placement="top"
              arrow
            >
              <Box sx={{ width: "100%", height: "100%" }}>{inner}</Box>
            </Tooltip>
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
        editable: true,
        sortable: true,
        filterable: false,
        disableColumnMenu: true,
        cellClassName: cellModifiedClass,
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
        cellClassName: cellModifiedClass,
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
        cellClassName: cellModifiedClass,
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
        cellClassName: cellModifiedClass,
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
        cellClassName: cellModifiedClass,
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
    [
      t,
      theme.palette.primary.main,
      theme.palette.success,
      theme.palette.warning,
      cellModifiedClass,
      isCellModified,
      getOriginalValue,
    ]
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
            <Button
              onClick={handleAddMulti}
              variant="outlined"
              size="small"
              startIcon={<LibraryAddIcon />}
            >
              {t("Subject.addMulti")}
            </Button>
          </Stack>
        </CardContent>

        <Divider />

        <Box
          ref={gridWrapperRef}
          tabIndex={-1}
          className="font-siemreap"
          sx={{
            height: 600,
            width: "100%",
            outline: "none",
            "& .cell-modified": {
              backgroundColor: alpha(theme.palette.warning.main, 0.18),
              position: "relative",
            },
            "& .cell-modified::after": {
              content: '""',
              position: "absolute",
              top: 4,
              right: 4,
              width: 6,
              height: 6,
              borderRadius: "50%",
              backgroundColor: theme.palette.warning.main,
            },
            "& .row-new": {
              backgroundColor: alpha(theme.palette.success.main, 0.08),
            },
            "& .row-new:hover": {
              backgroundColor: `${alpha(theme.palette.success.main, 0.12)} !important`,
            },
          }}
        >
          <DataGrid
            apiRef={apiRef}
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
            getRowClassName={(params) =>
              isNewRow(params.id) ? "row-new" : ""
            }
            onCellClick={(params) => {
              setFocusedCell({ rowId: params.id, field: params.field });
            }}
            onCellEditStart={(params) => {
              isEditingRef.current = true;
              setFocusedCell({ rowId: params.id, field: params.field });
            }}
            onCellEditStop={() => {
              isEditingRef.current = false;
            }}
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

      {/* Sticky save/discard bar — only when there are pending edits */}
      <Slide
        in={modifiedIds.size > 0}
        direction="up"
        mountOnEnter
        unmountOnExit
      >
        <Paper
          elevation={6}
          sx={{
            position: "fixed",
            bottom: 16,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: theme.zIndex.appBar + 1,
            px: 2,
            py: 1.25,
            borderRadius: 999,
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            border: `1px solid ${theme.palette.divider}`,
          }}
        >
          <EditNoteIcon sx={{ color: "warning.main" }} />
          <Typography variant="body2" sx={{ fontWeight: 700 }}>
            {t("Subject.unsavedRows", { count: modifiedIds.size })}
          </Typography>
          <Button
            variant="outlined"
            size="small"
            color="inherit"
            startIcon={<RestoreIcon />}
            onClick={handleDiscard}
            disabled={isLoading}
          >
            {t("MonthlyExam.discard")}
          </Button>
          <Tooltip title="Ctrl/Cmd + S" placement="top">
            <span>
              <Button
                variant="contained"
                color="primary"
                size="small"
                startIcon={<SaveIcon />}
                onClick={handleSaveChanges}
                disabled={isLoading}
              >
                {isLoading
                  ? t("MonthlyExam.saving")
                  : t("MonthlyExam.saveChanges")}
              </Button>
            </span>
          </Tooltip>
        </Paper>
      </Slide>
    </Box>
  );
}
