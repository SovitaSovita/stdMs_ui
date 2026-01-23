"use client";

import React from "react";
import {
  ClassAvgExamFilterResponseType,
  ClassExamDataResponseType,
  ClassReqFilterDetailType,
  ScoreUpsertRequest,
  Settings,
  StudentInfoScore,
  StudentMonthlyExamsAvgResponse,
} from "@/app/constants/type";
import { CustomDataGridToolbar } from "@/app/dashboard/components/Common/CustomDataGridToolbar";
import { showAlertAtom } from "@/app/libs/jotai/alertAtom";
import {
  classroomAtom,
  mekunSemesterAtom,
} from "@/app/libs/jotai/classroomAtom";
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
import {
  DataGrid,
  GridColDef,
  GridColumnGroupingModel,
  GridDensity,
  GridRowId,
} from "@mui/x-data-grid";
import dayjs from "dayjs";
import { useAtom, useAtomValue } from "jotai";
import { useTranslations } from "next-intl";
import { notFound } from "next/navigation";
import { ChangeEvent, useCallback, useEffect, useMemo, useState } from "react";
import useNotifications from "@/app/libs/hooks/useNotifications/useNotifications";

type SemesterlyAverageGridProps = {
  examType: string;
  examDate: string;
  meKun: number;
};

export const SemesterlyAverageGrid = (props: SemesterlyAverageGridProps) => {
  const { examDate, examType, meKun } = props;
  const [settings, setSettings] = useState<Settings>(getInitialSettings());
  const t = useTranslations();

  useEffect(() => {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  const [mekunSemester, setMekunSemester] = useAtom(mekunSemesterAtom);
  const [examData, setExamData] = useState<ClassAvgExamFilterResponseType>();
  const [rows, setRows] = useState<StudentMonthlyExamsAvgResponse[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const [loading, setLoading] = useState(true);
  const classroom = useAtomValue(classroomAtom);
  const notification = useNotifications();

  const validTypes = ["monthly", "semester"] as const;
  const isValidType = validTypes.includes(examType as any);
  const parsedDate = dayjs(examDate, "MMYYYY", true); // strict
  const isValidDate = parsedDate.isValid();

  useEffect(() => {
    if (!isValidType || !isValidDate) {
      notFound(); // redirects to closest `not-found.tsx` or 404 page
    }
  }, [isValidType, isValidDate]);

  const fetchExam = useCallback(async () => {
    try {
      if (!classroom?.id) return;

      setLoading(true);
      const dateFormatted = `${examDate.slice(2)}-${examDate.slice(0, 2)}-01`;
      const result = await ClassroomService.getSemesterAvgs(
        classroom?.id,
        dateFormatted
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
  }, [classroom?.id, examDate]);

  useEffect(() => {
    if (isValidType && isValidDate && classroom) {
      fetchExam();
    }
  }, [fetchExam, isValidType, isValidDate, classroom?.id]);

  // handle input Mekun
  const handleInputMekun = (event: ChangeEvent<HTMLInputElement>) => {
    const val = Number(event.target.value);
    setMekunSemester(val);
  };

  // Compute scores, average, ranking, and grade
  const processedRows = useMemo(() => {
    if (!rows.length) return [];

    // Step 1: Calculate average & Total average
    const withTotals = rows.map((row) => {
      const totalAverages = row.monthlyAverage || {};
      const values = Object.values(totalAverages).map(Number);
      const divisorOfSemester = Number(mekunSemester) || 1;

      //average
      // const divisorOfMonthly = Number(meKunValue) || 1;
      // const average = Object.fromEntries(
      //   Object.entries(totalScores).map(([date, score]) => [
      //     date,
      //     !isFinite(Number(score) / divisorOfMonthly)
      //       ? 0
      //       : (Number(score) / divisorOfMonthly)?.toFixed(2),
      //   ])
      // );

      //Total average
      const totalAverage =
        values.length > 0
          ? values.reduce((sum, v) => sum + (v || 0), 0) / divisorOfSemester
          : 0.0;

      return {
        ...row,
        totalAverage: !isFinite(Number(totalAverage))
          ? 0
          : Number(totalAverage?.toFixed(2)),
      };
    });
    // Step 3: Total score ranking (overall)
    const sortedByTotal = [...withTotals].sort(
      (a, b) => b.totalAverage - a.totalAverage
    );

    let prevTotal: number | null = null;
    let rank = 0;

    const withRank = sortedByTotal.map((row, index) => {
      if (row.totalAverage === 0) return { ...row, mRanking: 0 };

      if (row.totalAverage !== prevTotal) {
        rank = index + 1;
        prevTotal = row.totalAverage;
      }

      const average = row.totalAverage;
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
    ) as StudentMonthlyExamsAvgResponse[];
  }, [rows, mekunSemester, examDate]);

  // Extract exam month keys for column grouping
  const ExamMonthKeys = useMemo(() => {
    return processedRows.length > 0 && processedRows[0]?.monthlyAverage
      ? Object.keys(processedRows[0].monthlyAverage)
      : [];
  }, [processedRows]);

  // Define columns for DataGrid
  const columns = useMemo(() => {
    const staticColumns: GridColDef<StudentMonthlyExamsAvgResponse>[] = [
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
        width: 170,
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
    const staticColumns2: GridColDef<StudentMonthlyExamsAvgResponse>[] = [
      {
        field: "totalAverage",
        headerName: t("Common.total"),
        headerClassName: "font-siemreap",
        cellClassName: "font-semibold",
        type: "string",
        width: 90,
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
        width: 90,
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
        width: 90,
        align: "center",
        headerAlign: "center",
        sortable: true,
        disableColumnMenu: true,
      },
    ];

    const dynamicAvgColumns: GridColDef[] = ExamMonthKeys.flatMap((key) => {
      const baseCol: GridColDef = {
        field: key,
        headerName: t("Common.months." + dayjs(key).format("MMM")),
        type: "string",
        width: 120,
        align: "center",
        headerAlign: "center",
        editable: true,
        sortable: false,
        disableColumnMenu: true,
        valueGetter: (value, row, column) => {
          const field = column?.field;
          const scoreArr = row?.monthlyAverage;
          if (!scoreArr) return "";
          return scoreArr[field]?.toFixed(2) || 0;
        },
      };
      return [baseCol];
    });

    return [...staticColumns, ...dynamicAvgColumns, ...staticColumns2];
  }, [rows]);

  const columnGroupingModel: GridColumnGroupingModel = useMemo(
    () => [
      {
        groupId: "monthlyAvg",
        headerName: "មធ្យមភាគប្រចាំឆមាស",
        align: "center",
        headerAlign: "center",
        headerClassName: "font-siemreap",
        children: [
          ...ExamMonthKeys.map((key) => ({ field: key })),
          { field: "totalAverage" },
          { field: "mRanking" },
        ],
      },
    ],
    [ExamMonthKeys, t]
  );

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
        columnGroupingModel={columnGroupingModel}
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
                    name="mekunSemester"
                    type="number"
                    value={mekunSemester}
                    slotProps={{
                      htmlInput: {
                        min: 1,
                        step: 1, // or 0.1 if you allow decimals
                      },
                    }}
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
