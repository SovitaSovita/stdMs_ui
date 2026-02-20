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
  isShow?: boolean;
};

export const SemesterlyAverageGrid = (props: SemesterlyAverageGridProps) => {
  const { examDate, examType, isShow = true } = props;
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
        dateFormatted,
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
    const withTotals: any = rows.map((row) => {
      const totalAverages = row.monthlyAverage || {};
      const values = Object.values(totalAverages).map(Number);
      const divisorOfSemester = Number(mekunSemester) || 1;

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

    // Step 2: Compute per-semester totalAvgSemester, tRanking, tGrade
    // Get all semester keys from the first row (if any)
    const semesterKeys =
      withTotals.length > 0 && withTotals[0]?.monthlyAverage
        ? Object.keys(withTotals[0].monthlyAverage).filter((key) =>
            dayjs(key).format("MMYYYY").includes(examDate)
          )
        : [];

    // For each semester key, compute totalAvgSemester, tRanking, tGrade for all rows
    let rowsWithSemesterFields = withTotals.map((row: any) => ({ ...row }));
    semesterKeys.forEach((key) => {
      // Compute combined average for each row for this semester
      const combinedAverages = rowsWithSemesterFields.map((row: any) => {
        const monthlyVal = row?.monthlyAverage?.[key] ?? 0;
        const totalAvg = row?.totalAverage ?? 0;
        return (Number(totalAvg) + Number(monthlyVal)) / 2;
      });
      // Compute ranking for this semester
      const sorted = [...combinedAverages].sort((a, b) => b - a);
      rowsWithSemesterFields = rowsWithSemesterFields.map((row: any) => {
        const monthlyVal = row?.monthlyAverage?.[key] ?? 0;
        const totalAvg = row?.totalAverage ?? 0;
        const combined = (Number(totalAvg) + Number(monthlyVal)) / 2;
        // tRanking
        const tRanking = combined === 0 ? 0 : sorted.findIndex((v) => v === combined) + 1;
        // tGrade
        let tGrade = "F";
        if (isFinite(combined)) {
          if (combined >= 45) tGrade = "A";
          else if (combined >= 40) tGrade = "B";
          else if (combined >= 35) tGrade = "C";
          else if (combined >= 30) tGrade = "D";
          else if (combined >= 25) tGrade = "E";
        }
        // totalAvgSemester
        return {
          ...row,
          [`totalAvgSemester`]: isFinite(combined) ? combined.toFixed(2) : "0.00",
          [`tRanking`]: tRanking,
          [`tGrade`]: tGrade,
        };
      });
    });

    // Step 3: Total score ranking (overall)
    const sortedByTotal = [...rowsWithSemesterFields].sort(
      (a, b) => b.totalAverage - a.totalAverage,
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
    return rowsWithSemesterFields.map(
      (r: any) => withRank.find((w) => w.id === r.id) ?? r,
    ) as StudentMonthlyExamsAvgResponse[];
  }, [rows, mekunSemester, examDate]);

  // Extract exam month keys for column grouping
  const ExamMonthKeys = useMemo(() => {
    return processedRows.length > 0 && processedRows[0]?.monthlyAverage
      ? Object.keys(processedRows[0].monthlyAverage).filter((key) => {
          return !dayjs(key).format("MMYYYY").includes(examDate); // exclude keys that match the current examDate
        })
      : [];
  }, [processedRows]);

  // Extract current semester keys
  const ExamSemesterKeys = useMemo(() => {
    return processedRows.length > 0 && processedRows[0]?.monthlyAverage
      ? Object.keys(processedRows[0].monthlyAverage).filter((key) => {
          return dayjs(key).format("MMYYYY").includes(examDate); // exclude keys that not match the current examDate
        })
      : [];
  }, [processedRows]);

  // Define columns for DataGrid
  const columns = useMemo(() => {
    const staticColumns: GridColDef<StudentMonthlyExamsAvgResponse>[] = [
      {
        field: "orderNo",
        headerName: t("CommonField.id"),
        headerClassName: "font-siemreap",
        width: 50,
        // renderCell: (params) =>
        //   params.api.getRowIndexRelativeToVisibleRows(params.id) + 1,
      },
      {
        field: "fullName",
        headerName: t("CommonField.fullName"),
        headerClassName: "font-siemreap",
        width: 190,
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
        width: 60,
        align: "center",
        headerAlign: "center",
        disableColumnMenu: true,
        valueOptions: ["M", "F"],
      },
    ];

    //មធ្យមភាគប្រចាំឆមាសលើកទី...
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
        width: 90,
        align: "center",
        headerAlign: "center",
        editable: false,
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

    //ប្រចាំឆមាសលើកទី...
    const dynamicSemesterAvgColumns: GridColDef[] = ExamSemesterKeys.flatMap(
      (key) => {
        const baseCol: GridColDef = {
          field: key,
          headerName: t("CommonField.avgSemester"),
          type: "string",
          width: 120,
          align: "center",
          headerAlign: "center",
          editable: false,
          sortable: false,
          disableColumnMenu: true,
          valueGetter: (value, row, column) => {
            const field = column?.field as string;
            const scoreArr = row?.monthlyAverage;
            if (!scoreArr) return "";
            const v = scoreArr[field];
            return typeof v === "number"
              ? v.toFixed(2)
              : Number(v)
                ? Number(v).toFixed(2)
                : "0.00";
          },
        };

        const totalAvgSemester: GridColDef = {
          field: `totalAvgSemester`,
          headerName: t("CommonField.average"),
          type: "string",
          width: 120,
          align: "center",
          headerAlign: "center",
          editable: false,
          sortable: false,
          disableColumnMenu: true,
          valueGetter: (value, row) => {
            const monthlyVal = row?.monthlyAverage?.[key] ?? 0;
            const totalAvg = row?.totalAverage ?? 0;
            const combined = (Number(totalAvg) + Number(monthlyVal)) / 2;
            return isFinite(combined) ? combined.toFixed(2) : "0.00";
          },
        };

        const trankingCol: GridColDef = {
          field: `tRanking`,
          headerName: t("CommonField.ranking"),
          type: "string",
          cellClassName: "text-red-500 font-semibold",
          width: 100,
          align: "center",
          headerAlign: "center",
          editable: false,
          sortable: false,
          disableColumnMenu: true,
          valueGetter: (value, row) => {
            if (!row || !row.id) return "";
            if (!Array.isArray(processedRows)) return "";
            const combined =
              (Number(row.totalAverage ?? 0) +
                Number(row.monthlyAverage?.[key] ?? 0)) /
              2;
            // Gather all combined values for this semester
            const allCombined = processedRows.map(
              (r: any) =>
                (Number(r.totalAverage ?? 0) +
                  Number(r.monthlyAverage?.[key] ?? 0)) /
                2,
            );
            // Sort descending
            const sorted = [...allCombined].sort((a, b) => b - a);
            // Find rank (1-based)
            const rank = sorted.findIndex((v) => v === combined) + 1;
            return combined === 0 ? 0 : rank;
          },
        };

        const tgradeCol: GridColDef = {
          field: `tGrade`,
          headerName: t("CommonField.grade"),
          type: "string",
          cellClassName: "text-red-500 font-semibold",
          width: 100,
          align: "center",
          headerAlign: "center",
          editable: false,
          sortable: false,
          disableColumnMenu: true,
          valueGetter: (value, row) => {
            // Use the same grading logic as mGrade, but for this semester's average
            const monthlyVal = row?.monthlyAverage?.[key] ?? 0;
            const totalAvg = row?.totalAverage ?? 0;
            const combined = (Number(totalAvg) + Number(monthlyVal)) / 2;
            if (!isFinite(combined)) return "F";
            if (combined >= 45) return "A";
            if (combined >= 40) return "B";
            if (combined >= 35) return "C";
            if (combined >= 30) return "D";
            if (combined >= 25) return "E";
            return "F";
          },
        };

        //when Tab = view only Semesterly Average
        if (isShow) {
          return [totalAvgSemester, trankingCol, tgradeCol];
        }

        return [baseCol, totalAvgSemester, trankingCol, tgradeCol];
      },
    );

    //when Tab = view only Semesterly Average
    if (isShow) {
      return [...staticColumns, ...dynamicSemesterAvgColumns];
    }

    return [
      ...staticColumns,
      ...dynamicAvgColumns,
      ...staticColumns2,
      ...dynamicSemesterAvgColumns,
    ];
  }, [rows]);

  // Grouping header
  const columnGroupingModel: GridColumnGroupingModel = useMemo(() => {
    
    if (isShow) {
      // No group headers,
      return [];
    }
    // Monthly group as before
    const groups: GridColumnGroupingModel = [
      {
        groupId: "monthlyAvg",
        headerName: `${t("CommonField.averageSemester")}`,
        headerAlign: "center",
        headerClassName: "font-siemreap",
        children: [
          ...ExamMonthKeys.map((key) => ({ field: key })),
          { field: "totalAverage" },
          { field: "mRanking" },
        ],
      },
    ];

    // Add a group for each semester key
    ExamSemesterKeys.forEach((key, idx) => {
      groups.push({
        groupId: `semester_${key}`,
        headerName: `${t("CommonField.semester")}`,
        headerAlign: "center",
        headerClassName: "font-siemreap",
        children: [
          { field: `totalAvgSemester` },
          { field: `tRanking` },
          { field: `tGrade` },
        ],
      });
    });
    return groups;
  }, [isShow, ExamMonthKeys, ExamSemesterKeys, t]);

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
          columns: {
            columnVisibilityModel: {
              mGrade: false,
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
