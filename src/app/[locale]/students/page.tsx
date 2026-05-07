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
  useGridApiRef,
} from "@mui/x-data-grid";
import { useAtomValue } from "jotai";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Paper, Slide, Tooltip } from "@mui/material";
import SaveIcon from "@mui/icons-material/Save";
import RestoreIcon from "@mui/icons-material/Restore";
import EditNoteIcon from "@mui/icons-material/EditNote";
import useNotifications from "@/app/libs/hooks/useNotifications/useNotifications";
import useClassroomData from "@/app/libs/hooks/useClassroomData";
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
  const [originalRows, setOriginalRows] = useState<StudentsInfo[]>([]);
  const [modifiedIds, setModifiedIds] = useState<Set<GridRowId>>(new Set());
  const [focusedCell, setFocusedCell] = useState<{
    rowId: GridRowId;
    field: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const classroom = useAtomValue(classroomAtom);
  const students = useAtomValue(studentsAtom);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const notification = useNotifications();

  // Re-fetch students on direct page load (e.g. browser refresh) — the atom
  // is in-memory only and otherwise relies on the dashboard home to populate it.
  useClassroomData(classroom);
  const gridWrapperRef = useRef<HTMLDivElement | null>(null);
  const isEditingRef = useRef(false);
  const apiRef = useGridApiRef();

  const [rowSelectionModel, setRowSelectionModel] =
    useState<GridRowSelectionModel>({
      type: "include",
      ids: new Set<GridRowId>([]),
    });

  useEffect(() => {
    if (students?.student) {
      setRows(students.student);
      setOriginalRows(JSON.parse(JSON.stringify(students.student)));
      setModifiedIds(new Set());
    }
  }, [students?.student]);

  const originalRowMap = useMemo(() => {
    const m = new Map<GridRowId, StudentsInfo>();
    originalRows.forEach((r) => m.set(r.id, r));
    return m;
  }, [originalRows]);

  // Field order used when pasting a multi-column block from Excel.
  const PASTEABLE_FIELDS: (keyof StudentsInfo)[] = useMemo(
    () => [
      "idCard",
      "fullName",
      "gender",
      "dateOfBirth",
      "fatherName",
      "fatherOccupation",
      "montherName",
      "montherOccupation",
      "placeOfBirth",
      "address",
    ],
    []
  );

  const isNewRow = useCallback(
    (id: GridRowId) => String(id).startsWith("temp-"),
    []
  );

  const isCellModified = useCallback(
    (rowId: GridRowId, field: keyof StudentsInfo): boolean => {
      if (isNewRow(rowId)) return false; // entire row is "new", not "modified"
      const orig = originalRowMap.get(rowId);
      const current = rows.find((r) => r.id === rowId);
      if (!orig || !current) return false;
      return (orig as any)[field] !== (current as any)[field];
    },
    [originalRowMap, rows, isNewRow]
  );

  const getOriginalValue = useCallback(
    (rowId: GridRowId, field: keyof StudentsInfo): any => {
      return (originalRowMap.get(rowId) as any)?.[field];
    },
    [originalRowMap]
  );

  // Coerce common Excel values into the gender enum and a date string.
  const normalizeValue = useCallback(
    (field: keyof StudentsInfo, raw: string): any => {
      if (field === "gender") {
        const v = raw.trim().toLowerCase();
        if (["f", "female", "ស្រី"].includes(v)) return "F";
        if (["m", "male", "ប្រុស"].includes(v)) return "M";
        return raw;
      }
      if (field === "dateOfBirth") {
        const tryFormats = [
          "YYYY-MM-DD",
          "YYYY/MM/DD",
          "DD-MM-YYYY",
          "DD/MM/YYYY",
          "MM/DD/YYYY",
        ];
        for (const f of tryFormats) {
          const d = dayjs(raw, f, true);
          if (d.isValid()) return d.format("YYYY-MM-DD");
        }
        const d = dayjs(raw);
        return d.isValid() ? d.format("YYYY-MM-DD") : raw;
      }
      return raw;
    },
    []
  );

  // Whether `r` differs from its original snapshot in any pasteable field.
  const isRowDirty = useCallback(
    (r: StudentsInfo): boolean => {
      if (isNewRow(r.id)) return true;
      const orig = originalRowMap.get(r.id);
      if (!orig) return true;
      return PASTEABLE_FIELDS.some((f) => (orig as any)[f] !== (r as any)[f]);
    },
    [originalRowMap, isNewRow, PASTEABLE_FIELDS]
  );

  const [settings, setSettings] = useState<Settings>(getInitialSettings());

  useEffect(() => {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  const cellModifiedClass = useCallback(
    (params: { id: GridRowId; field: string }) =>
      isCellModified(params.id, params.field as keyof StudentsInfo)
        ? "cell-modified"
        : "",
    [isCellModified]
  );

  const renderModifiedTooltip = useCallback(
    (params: GridRenderCellParams<StudentsInfo>, fallback: React.ReactNode) => {
      const modified = isCellModified(
        params.id,
        params.field as keyof StudentsInfo
      );
      if (!modified) return <span>{fallback}</span>;
      const original = getOriginalValue(
        params.id,
        params.field as keyof StudentsInfo
      );
      return (
        <Tooltip
          title={`${t("MonthlyExam.previousScore")}: ${original ?? "—"}`}
          placement="top"
          arrow
        >
          <span style={{ fontWeight: 700 }}>{fallback}</span>
        </Tooltip>
      );
    },
    [isCellModified, getOriginalValue, t]
  );

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
        cellClassName: cellModifiedClass,
        renderCell: (params) =>
          renderModifiedTooltip(params, params.value ?? ""),
      },
      {
        field: "fullName",
        headerName: t("CommonField.fullName"),
        headerClassName: "font-siemreap",
        width: 220,
        editable: true,
        sortable: true,
        disableColumnMenu: true,
        cellClassName: cellModifiedClass,
        renderCell: (params: GridRenderCellParams<StudentsInfo>) => {
          const isFemale = params.row.gender === "F";
          const tone = isFemale
            ? theme.palette.secondary.main
            : theme.palette.info.main;
          const inner = (
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
          const modified = isCellModified(params.id, "fullName");
          if (!modified) return inner;
          const original = getOriginalValue(params.id, "fullName");
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
        cellClassName: cellModifiedClass,
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
        cellClassName: cellModifiedClass,
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
        cellClassName: cellModifiedClass,
        renderCell: (params) =>
          renderModifiedTooltip(params, params.value ?? ""),
      },
      {
        field: "fatherOccupation",
        headerName: t("CommonField.occupation"),
        headerClassName: "font-siemreap",
        width: 150,
        editable: true,
        sortable: false,
        disableColumnMenu: true,
        cellClassName: cellModifiedClass,
        renderCell: (params) =>
          renderModifiedTooltip(params, params.value ?? ""),
      },
      {
        field: "montherName",
        headerName: t("CommonField.montherName"),
        headerClassName: "font-siemreap",
        width: 150,
        editable: true,
        sortable: false,
        disableColumnMenu: true,
        cellClassName: cellModifiedClass,
        renderCell: (params) =>
          renderModifiedTooltip(params, params.value ?? ""),
      },
      {
        field: "montherOccupation",
        headerName: t("CommonField.occupation"),
        headerClassName: "font-siemreap",
        width: 150,
        editable: true,
        sortable: false,
        disableColumnMenu: true,
        cellClassName: cellModifiedClass,
        renderCell: (params) =>
          renderModifiedTooltip(params, params.value ?? ""),
      },
      {
        field: "placeOfBirth",
        headerName: t("CommonField.placeOfBirth"),
        headerClassName: "font-siemreap",
        width: 200,
        editable: true,
        sortable: false,
        disableColumnMenu: true,
        cellClassName: cellModifiedClass,
        renderCell: (params) =>
          renderModifiedTooltip(params, params.value ?? ""),
      },
      {
        field: "address",
        headerName: t("CommonField.address"),
        headerClassName: "font-siemreap",
        width: 200,
        editable: true,
        sortable: false,
        disableColumnMenu: true,
        cellClassName: cellModifiedClass,
        renderCell: (params) =>
          renderModifiedTooltip(params, params.value ?? ""),
      },
    ],
    [
      t,
      theme.palette.info.main,
      theme.palette.secondary.main,
      cellModifiedClass,
      renderModifiedTooltip,
      isCellModified,
      getOriginalValue,
    ]
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

  // Edits stage in `modifiedIds`; the actual API call happens in handleSave.
  const processRowUpdate = async (
    newRow: StudentsInfo,
    oldRow: StudentsInfo
  ): Promise<StudentsInfo> => {
    try {
      const changedField = Object.keys(newRow).find((key) => {
        const a = (newRow as any)[key];
        const b = (oldRow as any)[key];
        if (a instanceof Date || b instanceof Date) {
          return new Date(a as any).getTime() !== new Date(b as any).getTime();
        }
        return a !== b;
      });
      if (!changedField) return oldRow;

      setRows((prev) =>
        prev.map((r) => (r.id === newRow.id ? newRow : r))
      );

      setModifiedIds((prev) => {
        const next = new Set(prev);
        if (isNewRow(newRow.id)) {
          next.add(newRow.id);
        } else if (isRowDirty(newRow)) {
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

  const handleSaveChanges = async () => {
    const pending = rows.filter((r) => modifiedIds.has(r.id));
    if (pending.length === 0) {
      notification.show(t("Student.noChanges"), { severity: "info" });
      return;
    }

    // Validate: every pending row must have fullName.
    const invalid = pending.filter((r) => !r.fullName?.trim());
    if (invalid.length > 0) {
      notification.show(
        t("Student.fullNameRequired", { count: invalid.length }),
        { severity: "error", autoHideDuration: 4000 }
      );
      return;
    }

    if (!classroom?.id) {
      notification.show(t("Student.missingClassroom"), { severity: "error" });
      return;
    }

    setIsLoading(true);
    try {
      // Build the bulk payload — strip temp ids so the backend treats them as
      // inserts; existing rows keep their id and get updated.
      const payload: StudentsRequestUpsertType[] = pending.map((r) => {
        const isNew = isNewRow(r.id);
        const item: StudentsRequestUpsertType = {
          ...r,
          classId: classroom.id,
          dateOfBirth: r.dateOfBirth
            ? dayjs(r.dateOfBirth as any).format("YYYY-MM-DD")
            : "",
        };
        if (isNew) delete (item as any).id;
        return item;
      });

      const result = await StudentService.upsertMany(classroom.id, payload);
      const ok = result?.status === 200;

      if (!ok) {
        notification.show(
          result?.message || t("Student.saveFailed"),
          { severity: "error", autoHideDuration: 5000 }
        );
        return;
      }

      // Backend responses for bulk upsert vary — try common shapes:
      //   payload: StudentsInfo[]              (array of saved rows)
      //   payload: { items: StudentsInfo[] }   (wrapped)
      // Falls back to a re-fetch flag if shape is unknown.
      const saved: StudentsInfo[] = Array.isArray(result?.payload)
        ? result.payload
        : Array.isArray(result?.payload?.items)
          ? result.payload.items
          : [];

      let updatedRows = rows.slice();
      if (saved.length > 0) {
        // Match by idCard (or fullName fallback) for new rows; by id for existing.
        const byId = new Map(saved.filter((s) => s.id).map((s) => [s.id, s]));
        const byIdCard = new Map(
          saved
            .filter((s) => s.idCard)
            .map((s) => [String(s.idCard), s])
        );
        updatedRows = updatedRows.map((r) => {
          if (!modifiedIds.has(r.id)) return r;
          if (!isNewRow(r.id) && byId.has(r.id)) return byId.get(r.id)!;
          if (r.idCard && byIdCard.has(String(r.idCard))) {
            return { ...byIdCard.get(String(r.idCard))!, ...r, id: byIdCard.get(String(r.idCard))!.id };
          }
          return r; // best-effort: leave row in place
        });
      }

      setRows(updatedRows);
      setOriginalRows(JSON.parse(JSON.stringify(updatedRows)));
      setModifiedIds(new Set());

      notification.show(
        result?.message || t("Student.savedCount", { count: pending.length }),
        { severity: "success", autoHideDuration: 3000 }
      );
    } catch (error: any) {
      console.error("handleSaveChanges error:", error);
      const msg =
        error?.response?.data?.detail ||
        error?.response?.data?.message ||
        error?.message ||
        t("Student.saveFailed");
      notification.show(msg, { severity: "error", autoHideDuration: 5000 });
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
  const handlePasteStudents = useCallback(
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
      const startField = focusedCell.field as keyof StudentsInfo;
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

        // If we run off the bottom, auto-create new (temp) rows so a long
        // paste can populate fresh students in one go.
        if (targetIdx >= next.length) {
          if (next.length >= 60) break; // hard cap
          const tempId = `temp-${Date.now()}-${appended++}`;
          next = [
            ...next,
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
        next[targetIdx] = row as StudentsInfo;
        if (isNewRow(row.id) || isRowDirty(row)) {
          stillModified.add(row.id);
        } else {
          stillModified.delete(row.id);
        }
      }

      setRows(next);
      setModifiedIds(stillModified);
      const filledCells = matrix.length * (matrix[0]?.length ?? 0);
      notification.show(t("Student.pasted", { filled: filledCells }), {
        severity: "success",
        autoHideDuration: 3000,
      });
    },
    [
      focusedCell,
      rows,
      modifiedIds,
      classroom?.id,
      apiRef,
      PASTEABLE_FIELDS,
      isNewRow,
      isRowDirty,
      normalizeValue,
      notification,
      t,
    ]
  );

  useEffect(() => {
    const listener = (e: ClipboardEvent) => handlePasteStudents(e);
    document.addEventListener("paste", listener, true);
    return () => document.removeEventListener("paste", listener, true);
  }, [handlePasteStudents]);

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
    setModifiedIds((prev) => new Set(prev).add(tempId));
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
            {t("Student.unsavedRows", { count: modifiedIds.size })}
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
