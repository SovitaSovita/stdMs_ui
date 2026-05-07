"use client";

import React, { useCallback, useRef } from "react";
import {
  ClassExamDataResponseType,
  ClassReqFilterDetailType,
  ScoreUpsertRequest,
  Settings,
  StudentInfoScore,
} from "@/app/constants/type";
import { CustomDataGridToolbar } from "@/app/dashboard/components/Common/CustomDataGridToolbar";
import { showAlertAtom } from "@/app/libs/jotai/alertAtom";
import { classroomAtom, subjectsAtom } from "@/app/libs/jotai/classroomAtom";
import ClassroomService from "@/app/service/ClassroomService";
import useNotifications from "@/app/libs/hooks/useNotifications/useNotifications";
import useClassroomData from "@/app/libs/hooks/useClassroomData";
import {
  getInitialSettings,
  SETTINGS_STORAGE_KEY,
} from "@/app/utils/axios/Common";
import {
  AppBar,
  Box,
  Button,
  Paper,
  Slide,
  Tab,
  Tabs,
  TextField,
  Tooltip,
  Typography,
  alpha,
  useTheme,
} from "@mui/material";
import SaveIcon from "@mui/icons-material/Save";
import RestoreIcon from "@mui/icons-material/Restore";
import EditNoteIcon from "@mui/icons-material/EditNote";
import {
  DataGrid,
  GridColDef,
  GridDensity,
  GridRowId,
  useGridApiRef,
} from "@mui/x-data-grid";
import dayjs from "dayjs";
import { useAtom, useAtomValue } from "jotai";
import { useTranslations } from "next-intl";
import { notFound } from "next/navigation";
import { ChangeEvent, use, useEffect, useMemo, useState } from "react";
import { ImportScoreByAi } from "../Dialog/ImportScoreByAi";

type MonthlyNsemesterGridProps = {
  examType: string;
  examDate: string;
  showSubjects: boolean;
  meKun: number;
  onProcessedRowsChange?: (rows: StudentInfoScore[]) => void;
};

export const MonthlyNsemesterGrid = (props: MonthlyNsemesterGridProps) => {
  const { examDate, examType, meKun, showSubjects, onProcessedRowsChange } =
    props;
  const [settings, setSettings] = useState<Settings>(getInitialSettings());
  const t = useTranslations();

  useEffect(() => {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  // Format the URL's MMYYYY param into a localized "Month YYYY" label
  const monthYearLabel = useMemo(() => {
    if (!/^\d{6}$/.test(examDate)) return "";
    const monthIdx = parseInt(examDate.slice(0, 2), 10) - 1;
    const year = examDate.slice(2);
    const monthAbbrs = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
    ];
    if (monthIdx < 0 || monthIdx > 11) return "";
    return `${t(`Common.months.${monthAbbrs[monthIdx]}`)} ${year}`;
  }, [examDate, t]);

  const [examData, setExamData] = useState<ClassExamDataResponseType>();
  const [rows, setRows] = useState<StudentInfoScore[]>([]);
  const [originalRows, setOriginalRows] = useState<StudentInfoScore[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [modifiedRows, setModifiedRows] = useState<
    Map<GridRowId, StudentInfoScore>
  >(new Map());
  const [focusedCell, setFocusedCell] = useState<{
    rowId: GridRowId;
    field: string;
  } | null>(null);
  const subjects = useAtomValue(subjectsAtom);
  const notifications = useNotifications();
  const gridWrapperRef = useRef<HTMLDivElement | null>(null);
  const isEditingRef = useRef(false);
  const apiRef = useGridApiRef();

  const classroom = useAtomValue(classroomAtom);
  // Ensure subjects are loaded so we can validate against maxScore.
  // (Atom may be empty if the user landed on this URL via refresh.)
  useClassroomData(classroom, { autoFetch: subjects.length === 0 });

  // Lookup of subject.name -> maxScore for per-cell validation
  const maxScoreByField = useMemo(() => {
    const map: Record<string, number> = {};
    subjects.forEach((s) => {
      if (s?.name && Number.isFinite(Number(s.maxScore))) {
        map[s.name] = Number(s.maxScore);
      }
    });
    return map;
  }, [subjects]);

  const originalRowMap = useMemo(() => {
    const m = new Map<GridRowId, StudentInfoScore>();
    originalRows.forEach((r) => m.set(r.id, r));
    return m;
  }, [originalRows]);

  const isCellModified = useCallback(
    (rowId: GridRowId, field: string): boolean => {
      const orig = originalRowMap.get(rowId);
      const current = rows.find((r) => r.id === rowId);
      if (!orig || !current) return false;
      const a = Number(orig.scores?.[field] ?? 0);
      const b = Number(current.scores?.[field] ?? 0);
      return a !== b;
    },
    [originalRowMap, rows]
  );

  const getOriginalScore = useCallback(
    (rowId: GridRowId, field: string): number => {
      return Number(originalRowMap.get(rowId)?.scores?.[field] ?? 0);
    },
    [originalRowMap]
  );

  const clampScore = useCallback(
    (
      raw: any,
      field: string
    ): { value: number; clamped: boolean; max?: number } => {
      const max = maxScoreByField[field];
      let n = Number(raw);
      if (!Number.isFinite(n)) n = 0;
      if (n < 0) return { value: 0, clamped: true, max };
      if (typeof max === "number" && max > 0 && n > max) {
        return { value: max, clamped: true, max };
      }
      return { value: n, clamped: false, max };
    },
    [maxScoreByField]
  );

  const columns = useMemo(() => {
    const staticColumns: GridColDef<StudentInfoScore>[] = [
      {
        field: "orderNo",
        headerName: t("CommonField.id"),
        headerClassName: "font-siemreap",
        width: 90,
        // renderCell: (params) =>
        //   params.api.getRowIndexRelativeToVisibleRows(params.id) + 1,
      },
      {
        field: "fullName",
        headerName: t("CommonField.fullName"),
        headerClassName: "font-siemreap",
        width: showSubjects ? 150 : 170,
        // valueGetter: (value, row) =>
        //   `${row.firstName || ""} ${row.lastName || ""}`,
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
        disableColumnMenu: true,
        valueOptions: ["M", "F"],
      },
    ];
    const staticColumns2: GridColDef<StudentInfoScore>[] = [
      {
        field: "totalScore",
        headerName: t("Common.total"),
        headerClassName: "font-siemreap",
        align: "center",
        disableReorder: true,
        headerAlign: "center",
        width: showSubjects ? 70 : 90,
        sortable: false,
        disableColumnMenu: true,
      },
      {
        field: "average",
        headerName: t("CommonField.average"),
        headerClassName: "font-siemreap",
        cellClassName: "font-semibold",
        type: "string",
        width: showSubjects ? 70 : 90,
        align: "center",
        headerAlign: "center",
        sortable: true,
        disableColumnMenu: true,
      },
      {
        field: "mRanking",
        headerName: t("CommonField.ranking"),
        headerClassName: "font-siemreap",
        cellClassName: "text-red-500 font-semibold",
        type: "string",
        width: showSubjects ? 70 : 90,
        align: "center",
        headerAlign: "center",
        sortable: true,
        disableColumnMenu: true,
      },
      {
        field: "mGrade",
        headerName: t("CommonField.grade"),
        headerClassName: "font-siemreap",
        cellClassName: "text-red-500 font-semibold",
        type: "string",
        width: showSubjects ? 70 : 90,
        align: "center",
        headerAlign: "center",
        sortable: true,
        disableColumnMenu: true,
      },
    ];

    // Safely extract score keys with null checks
    const scoreKeys =
      rows.length > 0 && rows[0].scores ? Object.keys(rows[0].scores) : [];

    const dynamicScoreColumns: GridColDef[] = scoreKeys.flatMap((key) => {
      const max = maxScoreByField[key];
      const baseCol: GridColDef = {
        field: key,
        headerName: key.toUpperCase().slice(0, 2),
        description: max ? `${key} · max ${max}` : key,
        type: "string",
        width: showSubjects ? 70 : 90,
        align: "center",
        headerAlign: "center",
        editable: true,
        sortable: false,
        disableColumnMenu: true,
        valueGetter: (value, row, column) => {
          const field = column?.field;
          const scoreArr = row?.scores;
          if (!scoreArr) return "";
          return scoreArr[field] || 0;
        },
        cellClassName: (params) =>
          isCellModified(params.id, params.field) ? "score-cell-modified" : "",
        renderCell: (params) => {
          const modified = isCellModified(params.id, params.field);
          const value = params.value;
          if (!modified) return <span>{value as any}</span>;
          const original = getOriginalScore(params.id, params.field);
          return (
            <Tooltip
              title={`${t("MonthlyExam.previousScore")}: ${original}`}
              placement="top"
              arrow
            >
              <span style={{ fontWeight: 700 }}>{value as any}</span>
            </Tooltip>
          );
        },
      };

      //If examType = "semester", also create ranking column for this subject
      if (examType === "semester") {
        const rankCol: GridColDef = {
          field: `${key}_Rank`,
          headerName: `Rank`,
          width: 80,
          align: "center",
          headerAlign: "center",
          valueGetter: (value, row) => (row as any)[`${key}_rank`] || 0,
          cellClassName: "text-red-500 font-semibold",
        };
        return [baseCol, rankCol];
      }
      return [baseCol];
    });

    return showSubjects
      ? [...staticColumns, ...dynamicScoreColumns, ...staticColumns2]
      : [...staticColumns, ...staticColumns2];
  }, [
    rows,
    showSubjects,
    maxScoreByField,
    isCellModified,
    getOriginalScore,
    t,
  ]);

  const [loading, setLoading] = useState(true);
  const [, showAlert] = useAtom(showAlertAtom);

  const validTypes = ["monthly", "semester"] as const;
  const isValidType = validTypes.includes(examType as any);
  const parsedDate = dayjs(examDate, "MMYYYY", true); // strict
  const isValidDate = parsedDate.isValid();

  useEffect(() => {
    if (!isValidType || !isValidDate) {
      notFound();
    }
  }, [isValidType, isValidDate]);

  const fetchExam = useCallback(async () => {
    try {
      if (!classroom?.id) return;

      const formatted = `${examDate.slice(2)}-${examDate.slice(0, 2)}-01`;
      const sendData: ClassReqFilterDetailType = {
        examType: examType.toUpperCase(),
        examDate: formatted,
      };
      const result = await ClassroomService.getDetail(classroom?.id, sendData);
      if (result) {
        setExamData(result);
        setRows(result?.students);
        setOriginalRows(JSON.parse(JSON.stringify(result?.students))); // Deep copy
      }
    } catch {
      // swallow – we just show “no data”
    } finally {
      setLoading(false);
    }
  }, [classroom, examType, examDate]);

  useEffect(() => {
    if (isValidType && isValidDate && classroom) {
      fetchExam();
    }
  }, [isValidType, isValidDate, classroom]);

  const processRowUpdate = async (
    newRow: StudentInfoScore,
    oldRow: StudentInfoScore,
    params: { rowId: GridRowId },
  ): Promise<StudentInfoScore> => {
    try {
      // Find which top-level field was edited
      const changedField = Object.keys(newRow).find((key) => {
        if (key === "scores") return false;
        const newVal = newRow[key];
        const oldVal = oldRow[key];
        return newVal !== oldVal;
      });

      if (!changedField) {
        return oldRow;
      }

      // Validate against subject's max score (if known)
      const { value: clamped, clamped: wasClamped, max } = clampScore(
        newRow[changedField],
        changedField
      );
      if (wasClamped) {
        notifications.show(
          t("MonthlyExam.scoreClamped", {
            subject: changedField,
            max: max ?? 0,
          }),
          { severity: "warning", autoHideDuration: 4000 }
        );
      }

      // Merge this field into scores
      const updatedScores = {
        ...oldRow.scores,
        [changedField]: clamped,
      };

      // Build the updated row
      const updatedRow = {
        ...newRow,
        [changedField]: clamped,
        scores: updatedScores,
      };

      // Detect "no real change" against the original snapshot, so that
      // editing a cell back to its pre-save value clears the modified flag.
      const originalScore = Number(
        originalRowMap.get(params.rowId)?.scores?.[changedField] ?? 0
      );
      const sameAsOriginal = clamped === originalScore;

      setRows((prev) =>
        prev.map((r) => (r.id === updatedRow.id ? updatedRow : r)),
      );

      setModifiedRows((prev) => {
        const next = new Map(prev);
        if (sameAsOriginal) {
          // If no other field in this row differs from original, drop it.
          const orig = originalRowMap.get(params.rowId);
          const stillDirty =
            orig &&
            Object.keys(updatedScores).some((k) => {
              const a = Number(updatedScores[k] ?? 0);
              const b = Number(orig.scores?.[k] ?? 0);
              return a !== b;
            });
          if (stillDirty) {
            next.set(params.rowId, updatedRow);
          } else {
            next.delete(params.rowId);
          }
        } else {
          next.set(params.rowId, updatedRow);
        }
        return next;
      });

      return updatedRow;
    } catch (error) {
      console.error("processRowUpdate error:", error);
      return oldRow;
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Clipboard paste — fill score cells starting at the focused cell.
  // Excel copies use TAB-separated columns and newline-separated rows.
  // ─────────────────────────────────────────────────────────────────────────
  const handlePasteScores = useCallback(
    (event: ClipboardEvent) => {
      if (!focusedCell) return;
      // Only handle the paste when the focus is inside our grid wrapper.
      const wrapper = gridWrapperRef.current;
      if (
        wrapper &&
        document.activeElement &&
        !wrapper.contains(document.activeElement as Node)
      ) {
        return;
      }
      const startField = focusedCell.field;
      const scoreFieldSet = new Set(Object.keys(rows[0]?.scores ?? {}));
      // Only paste into score columns (exclude static columns).
      if (!scoreFieldSet.has(startField)) return;

      const text = event.clipboardData?.getData("text");
      if (!text) return;

      const matrix = text
        .replace(/\r/g, "")
        .split("\n")
        .filter((line, idx, arr) => idx < arr.length - 1 || line.length > 0)
        .map((line) => line.split("\t"));

      if (matrix.length === 0) return;

      // Always take over for score-column pastes — including when the cell is
      // already in edit mode (otherwise the editor swallows the whole pasted
      // text into a single cell). Cancel the browser default first.
      event.preventDefault();
      event.stopPropagation();

      // If the cell is currently being edited, bail out of edit mode without
      // committing the (now stale) editor value.
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

      const scoreFields = Object.keys(rows[0]?.scores ?? {});
      const startColIdx = scoreFields.indexOf(startField);
      if (startColIdx < 0) return;
      const startRowIdx = rows.findIndex((r) => r.id === focusedCell.rowId);
      if (startRowIdx < 0) return;

      let clampedCount = 0;
      const next = [...rows];
      const nextModified = new Map(modifiedRows);

      for (let r = 0; r < matrix.length; r++) {
        const targetRowIdx = startRowIdx + r;
        if (targetRowIdx >= next.length) break;
        const cells = matrix[r];
        const updatedScores = { ...(next[targetRowIdx].scores ?? {}) };
        for (let c = 0; c < cells.length; c++) {
          const targetColIdx = startColIdx + c;
          if (targetColIdx >= scoreFields.length) break;
          const field = scoreFields[targetColIdx];
          const raw = cells[c]?.trim();
          if (raw === "" || raw === undefined) continue;
          const { value, clamped: wasClamped } = clampScore(raw, field);
          if (wasClamped) clampedCount++;
          updatedScores[field] = value;
        }
        const updatedRow = { ...next[targetRowIdx], scores: updatedScores };
        next[targetRowIdx] = updatedRow;

        // Mark row as modified iff anything actually differs from the original
        const orig = originalRowMap.get(updatedRow.id);
        const stillDirty =
          orig &&
          Object.keys(updatedScores).some((k) => {
            const a = Number(updatedScores[k] ?? 0);
            const b = Number(orig.scores?.[k] ?? 0);
            return a !== b;
          });
        if (stillDirty) nextModified.set(updatedRow.id, updatedRow);
        else nextModified.delete(updatedRow.id);
      }

      setRows(next);
      setModifiedRows(nextModified);

      const filled =
        matrix.length *
        Math.min(
          matrix[0]?.length ?? 0,
          scoreFields.length - startColIdx
        );
      notifications.show(
        clampedCount > 0
          ? t("MonthlyExam.pastedWithClamp", {
              filled,
              clamped: clampedCount,
            })
          : t("MonthlyExam.pasted", { filled }),
        {
          severity: clampedCount > 0 ? "warning" : "success",
          autoHideDuration: 4000,
        }
      );
    },
    [
      focusedCell,
      rows,
      modifiedRows,
      originalRowMap,
      clampScore,
      maxScoreByField,
      notifications,
      t,
      apiRef,
    ]
  );

  useEffect(() => {
    const listener = (e: ClipboardEvent) => handlePasteScores(e);
    // Capture phase so we run before the cell editor's input grabs the paste.
    document.addEventListener("paste", listener, true);
    return () => document.removeEventListener("paste", listener, true);
  }, [handlePasteScores]);

  const handleSaveChanges = async () => {
    if (modifiedRows.size === 0) {
      showAlert({
        message: t("MonthlyExam.noChanges"),
        severity: "info",
      });
      return;
    }

    setIsLoading(true);

    try {
      if (!classroom || !examData?.exams) {
        showAlert({
          message: t("MonthlyExam.missingData"),
          severity: "error",
        });
        return;
      }

      // Build request payload from all modified rows
      const sendData: ScoreUpsertRequest[] = [];
      modifiedRows.forEach((modifiedRow) => {
        Object.keys(modifiedRow.scores || {}).forEach((subjectName) => {
          const score = modifiedRow.scores?.[subjectName];
          // Check if this subject score was actually modified by comparing with originalRows
          const originalRow = originalRows.find((r) => r.id === modifiedRow.id);
          const originalScore = originalRow?.scores?.[subjectName];

          if (score !== originalScore) {
            sendData.push({
              studentId: modifiedRow.id,
              subjectName: subjectName,
              score: Number(score),
            });
          }
        });
      });

      if (sendData.length === 0) {
        showAlert({
          message: t("MonthlyExam.noChanges"),
          severity: "info",
        });
        return;
      }

      const result = await ClassroomService.upsertStuScores(
        classroom.id,
        examData.exams.id,
        sendData,
      );

      if (result) {
        const updatedRows = JSON.parse(JSON.stringify(rows)); // Deep copy current state
        setModifiedRows(new Map()); // Clear modified rows
        setRows(updatedRows); // Force recompute with current data
        setOriginalRows(updatedRows); // Update original rows with current state
        showAlert({
          message: t("MonthlyExam.scoresUpdated", { count: sendData.length }),
          severity: "success",
        });
      }
    } catch (error) {
      console.error("handleSaveChanges error:", error);
      showAlert({
        message: t("MonthlyExam.saveFailed"),
        severity: "error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Compute scores, average, ranking, and grade - updates in real-time as scores change
  const processedRows = useMemo(() => {
    if (!rows.length) return [];
    const subjectNames = Object.keys(rows[0].scores || {});

    // Step 1: Calculate totalScore & average
    const withTotals = rows.map((row) => {
      const scores = row.scores || {};
      const values = Object.values(scores).map(Number);
      const totalScore = values.reduce((sum, v) => sum + (v || 0), 0);
      const average =
        values.length > 0 ? (totalScore / Number(meKun)).toFixed(2) : "0.00";

      return {
        ...row,
        totalScore,
        average: !isFinite(Number(average)) ? 0 : Number(average),
      };
    });

    // Step 2: Per-subject ranking (only for semester)
    if (examType === "semester") {
      subjectNames.forEach((subject) => {
        const sorted = [...withTotals].sort(
          (a, b) => (b.scores?.[subject] || 0) - (a.scores?.[subject] || 0),
        );

        let prevScore: number | null = null;
        let rank = 0;
        let countAtRank = 0;

        sorted.forEach((student, index) => {
          const score = student.scores?.[subject] || 0;
          if (score === 0) {
            (withTotals.find((r) => r.id === student.id) as any)[
              `${subject}_rank`
            ] = 0;
            return;
          }

          if (score !== prevScore) {
            // Move rank by number of students already ranked
            rank = index + 1;
            prevScore = score;
            countAtRank = 1;
          } else {
            // Same score = same rank
            countAtRank++;
          }

          const target = withTotals.find((r) => r.id === student.id);
          if (target) (target as any)[`${subject}_rank`] = rank;
        });
      });
    }

    // Step 3: Total score ranking (overall)
    const sortedByTotal = [...withTotals].sort(
      (a, b) => b.totalScore - a.totalScore,
    );

    let prevTotal: number | null = null;
    let rank = 0;

    const withRank = sortedByTotal.map((row, index) => {
      if (row.totalScore === 0) return { ...row, mRanking: 0 };

      if (row.totalScore !== prevTotal) {
        rank = index + 1;
        prevTotal = row.totalScore;
      }

      const average = row.average;
      const mGrade =
        average >= 45
          ? "A"
          : average >= 40
            ? "B"
            : average >= 35
              ? "C"
              : average >= 30
                ? "D"
                : average >= 25
                  ? "E"
                  : "F";

      return { ...row, mRanking: rank, mGrade };
    });

    // Step 4: Reorder back to original
    const finalRows = withTotals.map(
      (r) => withRank.find((w) => w.id === r.id) ?? r,
    ) as StudentInfoScore[];
    return finalRows;
  }, [rows, meKun, examType]);

  // Notify parent of processedRows changes
  useEffect(() => {
    if (onProcessedRowsChange) {
      onProcessedRowsChange(processedRows);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [processedRows]);

  const handleDiscard = useCallback(() => {
    setRows(JSON.parse(JSON.stringify(originalRows)));
    setModifiedRows(new Map());
  }, [originalRows]);

  // Ctrl/Cmd+S to save when there are pending edits.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        if (modifiedRows.size === 0) return;
        e.preventDefault();
        handleSaveChanges();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modifiedRows.size]);

  return (
    <div style={{ display: "flex", flexDirection: "column", position: "relative" }}>
      <Box
        sx={{
          mb: 2,
          display: "flex",
          gap: 1,
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
        }}
      >
        {modifiedRows.size > 0 ? (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              px: 1.25,
              py: 0.5,
              borderRadius: 999,
              bgcolor: (t) => alpha(t.palette.warning.main, 0.12),
              border: (t) =>
                `1px solid ${alpha(t.palette.warning.main, 0.35)}`,
            }}
          >
            <EditNoteIcon
              fontSize="small"
              sx={{ color: "warning.main" }}
            />
            <Typography
              variant="caption"
              sx={{ color: "warning.dark", fontWeight: 700 }}
            >
              {t("MonthlyExam.unsavedRows", { count: modifiedRows.size })}
            </Typography>
          </Box>
        ) : (
          <Typography variant="caption" color="text.secondary">
            {t("MonthlyExam.editHint")}
          </Typography>
        )}
        {/* {Number(students?.total) > 0 ? <ImportScoreByAi /> : null} */}
        {showSubjects && (
          <ImportScoreByAi examId={examData?.exams?.id} callback={fetchExam} />
        )}
      </Box>
      <Box
        ref={gridWrapperRef}
        tabIndex={-1}
        sx={{
          outline: "none",
          "& .score-cell-modified": {
            backgroundColor: (t) => alpha(t.palette.warning.main, 0.18),
            position: "relative",
          },
          "& .score-cell-modified::after": {
            content: '""',
            position: "absolute",
            top: 4,
            right: 4,
            width: 6,
            height: 6,
            borderRadius: "50%",
            backgroundColor: (t) => t.palette.warning.main,
          },
        }}
      >
        <DataGrid
          apiRef={apiRef}
          rows={processedRows}
          columns={columns}
          initialState={{
            pagination: {
              paginationModel: {
                pageSize: 15,
              },
            },
          }}
          processRowUpdate={processRowUpdate}
          onCellClick={(params) => {
            setFocusedCell({ rowId: params.id, field: params.field });
          }}
          onCellEditStart={(params) => {
            isEditingRef.current = true;
            // Edit mode also implies that's the focused cell.
            setFocusedCell({ rowId: params.id, field: params.field });
          }}
          onCellEditStop={() => {
            isEditingRef.current = false;
          }}
          pageSizeOptions={[15, 25, 50]}
          checkboxSelection
          disableRowSelectionOnClick
          density={settings.density}
          showCellVerticalBorder={settings.showCellBorders}
          showColumnVerticalBorder={settings.showColumnBorders}
          slots={{ toolbar: CustomDataGridToolbar }}
          slotProps={{
            toolbar: {
              settings,
              onSettingsChange: setSettings,
              toolbarButtons: {
                search: true,
                export: true,
                settings: true,
                exportTitle: monthYearLabel
                  ? `${t("MonthlyExam.monthlyScores")} · ${monthYearLabel}`
                  : t("MonthlyExam.monthlyScores"),
                extraControls: (
                  <>
                    <TextField
                      label={t("MonthlyExam.enterAverage")}
                      variant="outlined"
                      size="small"
                      name="meKun"
                      disabled
                      type="number"
                      value={meKun}
                      sx={{ mt: 1 }}
                    />
                  </>
                ),
              },
            },
          }}
          showToolbar
        />
      </Box>

      {/* Sticky save/discard bar — only when there are pending edits */}
      <Slide in={modifiedRows.size > 0} direction="up" mountOnEnter unmountOnExit>
        <Paper
          elevation={6}
          sx={{
            position: "fixed",
            bottom: 16,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: (t) => t.zIndex.appBar + 1,
            px: 2,
            py: 1.25,
            borderRadius: 999,
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            border: (t) => `1px solid ${t.palette.divider}`,
          }}
        >
          <EditNoteIcon sx={{ color: "warning.main" }} />
          <Typography variant="body2" sx={{ fontWeight: 700 }}>
            {t("MonthlyExam.unsavedRows", { count: modifiedRows.size })}
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
    </div>
  );
};
