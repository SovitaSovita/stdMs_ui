"use client";

import React from "react";
import {
  ClassExamDataResponseType,
  ClassReqFilterDetailType,
  ScoreUpsertRequest,
  Settings,
  StudentInfoScore,
} from "@/app/constants/type";
import { CustomDataGridToolbar } from "@/app/dashboard/components/Common/CustomDataGridToolbar";
import { showAlertAtom } from "@/app/libs/jotai/alertAtom";
import { classroomAtom } from "@/app/libs/jotai/classroomAtom";
import ClassroomService from "@/app/service/ClassroomService";
import {
  getInitialSettings,
  SETTINGS_STORAGE_KEY,
} from "@/app/utils/axios/Common";
import {
  AppBar,
  Box,
  Button,
  Tab,
  Tabs,
  TextField,
  Typography,
  useTheme,
} from "@mui/material";
import { DataGrid, GridColDef, GridDensity, GridRowId } from "@mui/x-data-grid";
import dayjs from "dayjs";
import { useAtom, useAtomValue } from "jotai";
import { useTranslations } from "next-intl";
import { notFound } from "next/navigation";
import { ChangeEvent, use, useEffect, useMemo, useState } from "react";

type SemesterlyGridProps = {
  examType: string;
  examDate: string;
};

export const SemesterlyGrid = (props: SemesterlyGridProps) => {
  const { examDate, examType } = props;
  const [settings, setSettings] = useState<Settings>(getInitialSettings());
  const t = useTranslations();

  useEffect(() => {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  const [meKunValue, setMekunValue] = useState<string>("16.5");
  const [examData, setExamData] = useState<ClassExamDataResponseType>();
  const [rows, setRows] = useState<StudentInfoScore[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showSubjects, setShowSubjects] = useState<boolean>(true);
  const [semesterlyAverageShow, setSemesterlyAverageShow] =
    useState<boolean>(true);

  const columns = useMemo(() => {
    const staticColumns: GridColDef<StudentInfoScore>[] = [
      {
        field: "id",
        headerName: "ល​​រ",
        headerClassName: "font-siemreap",
        width: 90,
        renderCell: (params) =>
          params.api.getRowIndexRelativeToVisibleRows(params.id) + 1,
      },
      {
        field: "fullName",
        headerName: "គោត្តនាម និងនាម",
        headerClassName: "font-siemreap",
        width: showSubjects ? 150 : 170,
        // valueGetter: (value, row) =>
        //   `${row.firstName || ""} ${row.lastName || ""}`,
        sortable: true,
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
        disableColumnMenu: true,
        valueOptions: ["M", "F"],
      },
    ];
    const staticColumns2: GridColDef<StudentInfoScore>[] = [
      {
        field: "totalScore",
        headerName: "ពិ.សរុប",
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
        headerName: "ម.ភាគ",
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
        headerName: "ចំ.ថ្នាក់",
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
        headerName: "និទ្ទេស",
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
      const baseCol: GridColDef = {
        field: key,
        headerName: key.toUpperCase().slice(0, 2),
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
  }, [rows, showSubjects]);

  const [loading, setLoading] = useState(true);
  const classroom = useAtomValue(classroomAtom);
  const [, showAlert] = useAtom(showAlertAtom);

  const validTypes = ["monthly", "semester"] as const;
  const isValidType = validTypes.includes(examType as any);
  const parsedDate = dayjs(examDate, "MMYYYY", true); // strict
  const isValidDate = parsedDate.isValid();

  useEffect(() => {
    if (!isValidType || !isValidDate) {
      notFound(); // redirects to closest `not-found.tsx` or 404 page
    }
  }, [isValidType, isValidDate]);

  useEffect(() => {
    async function fetchExam() {
      try {
        if (!classroom?.id) return;

        const formatted = `${examDate.slice(2)}-${examDate.slice(0, 2)}-01`;
        const sendData: ClassReqFilterDetailType = {
          examType: examType.toUpperCase(),
          examDate: formatted,
        };
        const result = await ClassroomService.getDetail(
          classroom?.id,
          sendData
        );
        if (result) {
          setExamData(result);
          setRows(result?.students);
        }
      } catch {
        // swallow – we just show “no data”
      } finally {
        setLoading(false);
      }
    }

    if (isValidType && isValidDate && classroom) fetchExam();
  }, [classroom, isValidType, isValidDate]);

  // handle input Mekun
  const handleInputMekun = (event: ChangeEvent<HTMLInputElement>) => {
    setMekunValue(event.target.value);
  };

  const processRowUpdate = async (
    newRow: StudentInfoScore,
    oldRow: StudentInfoScore,
    params: { rowId: GridRowId }
  ): Promise<StudentInfoScore> => {
    setIsLoading(true);

    try {
      // Find which subject (field) changed
      // Find which top-level field was edited
      const changedField = Object.keys(newRow).find((key) => {
        if (key === "scores") return false; // skip nested if subject name = scores
        const newVal = newRow[key];
        const oldVal = oldRow[key];
        return newVal !== oldVal;
      });

      if (!changedField) {
        console.warn("No changed field detected");
        return oldRow;
      }

      // Merge this field into scores
      const updatedScores = {
        ...oldRow.scores,
        [changedField]: Number(newRow[changedField]),
      };

      // Build the newRow correctly
      const updatedRow = {
        ...newRow,
        scores: updatedScores,
      };

      // Prepare request payload
      const sendData: ScoreUpsertRequest[] = [
        {
          studentId: updatedRow.id,
          subjectName: changedField,
          score: Number(updatedScores[changedField]),
        },
      ];

      if (!classroom || !examData?.exams) return oldRow;

      const result = await ClassroomService.upsertStuScores(
        classroom.id,
        examData.exams.id,
        sendData
      );

      if (result) {
        setRows((prev) =>
          prev.map((r) => (r.id === updatedRow.id ? updatedRow : r))
        );

        showAlert({
          message: "Student score updated.",
          severity: "success",
        });
        return updatedRow;
      }

      return oldRow;
    } catch (error) {
      console.error("processRowUpdate error:", error);
      return oldRow; // rollback
    } finally {
      setIsLoading(false);
    }
  };

  // Compute scores, average, ranking, and grade
  const processedRows = useMemo(() => {
    if (!rows.length) return [];
    const subjectNames = Object.keys(rows[0].scores || {});

    // Step 1: Calculate totalScore & average
    const withTotals = rows.map((row) => {
      const scores = row.scores || {};
      const values = Object.values(scores).map(Number);
      const totalScore = values.reduce((sum, v) => sum + (v || 0), 0);
      const average =
        values.length > 0
          ? (totalScore / Number(meKunValue)).toFixed(2)
          : "0.00";

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
          (a, b) => (b.scores?.[subject] || 0) - (a.scores?.[subject] || 0)
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
      (a, b) => b.totalScore - a.totalScore
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
    return withTotals.map(
      (r) => withRank.find((w) => w.id === r.id) ?? r
    ) as StudentInfoScore[];
  }, [rows, meKunValue, examType]);

  return (
    <>
      <DataGrid
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
              extraControls: (
                <>
                  <Button
                    variant="outlined"
                    onClick={() => setShowSubjects((prev) => !prev)}
                    sx={{ mt: 1 }}
                  >
                    {showSubjects
                      ? examType === "monthly"
                        ? t("MonthlyExam.viewRanking")
                        : t("SemesterExam.viewRanking")
                      : examType === "monthly"
                      ? t("MonthlyExam.monthlyScores")
                      : t("SemesterExam.semesterScores")}
                  </Button>
                  <TextField
                    label={t("MonthlyExam.enterAverage")}
                    variant="outlined"
                    size="small"
                    name="meKun"
                    type="number"
                    value={meKunValue}
                    // placeholder="Average"
                    onChange={handleInputMekun}
                    sx={{ mt: 1 }}
                  />
                </>
              ),
            },
          },
        }}
        showToolbar
      />
    </>
  );
};
