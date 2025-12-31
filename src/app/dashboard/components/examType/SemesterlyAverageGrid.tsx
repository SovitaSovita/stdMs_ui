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
import { classroomAtom, mekunAtom, mekunSemesterAtom } from "@/app/libs/jotai/classroomAtom";
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

type SemesterlyAverageGridProps = {
  examType: string;
  examDate: string;
};

export const SemesterlyAverageGrid = (props: SemesterlyAverageGridProps) => {
  const { examDate, examType } = props;
  const [settings, setSettings] = useState<Settings>(getInitialSettings());
  const t = useTranslations();

  useEffect(() => {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  const [meKunValue, setMekunValue] = useAtom(mekunSemesterAtom);
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
        headerName: t("CommonField.id"),
        headerClassName: "font-siemreap",
        width: 90,
        renderCell: (params) =>
          params.api.getRowIndexRelativeToVisibleRows(params.id) + 1,
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

    //average score of each monthly exam
    const dynamicScoreColumns: GridColDef[] = [];

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
    setMekunValue(Number(event.target.value));
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
