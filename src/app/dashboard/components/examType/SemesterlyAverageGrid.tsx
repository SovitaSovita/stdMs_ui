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
  examAtom,
} from "@/app/libs/jotai/classroomAtom";
import ClassroomService from "@/app/service/ClassroomService";
import {
  getInitialSettings,
  SETTINGS_STORAGE_KEY,
  truncateDecimal,
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
import { useAtomValue } from "jotai";
import { useTranslations } from "next-intl";
import { notFound } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import useNotifications from "@/app/libs/hooks/useNotifications/useNotifications";

type SemesterlyAverageGridProps = {
  examType: string;
  examDate: string;
  isShow?: boolean;
  onProcessedRowsChange?: (rows: StudentMonthlyExamsAvgResponse[]) => void;
};

export const SemesterlyAverageGrid = (props: SemesterlyAverageGridProps) => {
  const { examDate, examType, isShow = true, onProcessedRowsChange } = props;
  const [settings, setSettings] = useState<Settings>(getInitialSettings());
  const t = useTranslations();
  const exam = useAtomValue(examAtom);

  useEffect(() => {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

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
      if (!exam?.semesterNumber) return;

      setLoading(true);
      const result = await ClassroomService.getSemesterAvgs(
        classroom?.id,
        exam?.semesterNumber,
      );
      if (result) {
        setRows(result?.students);
      }
    } catch {
      // swallow – we just show “no data”
    } finally {
      setLoading(false);
    }
  }, [classroom?.id, exam?.semesterNumber, exam?.meKunSemester]);

  useEffect(() => {
    if (isValidType && isValidDate && classroom) {
      fetchExam();
    }
  }, [fetchExam, isValidType, isValidDate, classroom?.id]);

  // Compute scores, average, ranking, and grade
  const processedRows = useMemo(() => {
    if (!rows.length) return [];

    // compute overall monthly ranking/grade using totalMonthlyAverage
    const monthlySorted = [...rows].sort(
      (a, b) => b.totalMonthlyAverage - a.totalMonthlyAverage,
    );
    let prev: number | null = null;
    let rank = 0;
    const monthlyRanked = monthlySorted.map((r, idx) => {
      if (r.totalMonthlyAverage === 0) return { ...r, mRanking: 0 };
      if (r.totalMonthlyAverage !== prev) {
        rank = idx + 1;
        prev = r.totalMonthlyAverage;
      }
      const average = r.totalMonthlyAverage;
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
      return { ...r, mRanking: rank, mGrade };
    });
    const monthlyMap = new Map<string, any>(
      monthlyRanked.map((r) => [
        r.id,
        { mRanking: (r as any).mRanking, mGrade: (r as any).mGrade },
      ]),
    );

    // compute semester ranking/grade using totalSemesterAverage
    const semesterSorted = [...rows].sort(
      (a, b) => b.totalSemesterAverage - a.totalSemesterAverage,
    );
    prev = null;
    rank = 0;
    const semesterMap = new Map<string, any>();
    semesterSorted.forEach((r, idx) => {
      if (r.totalSemesterAverage === 0) {
        semesterMap.set(r.id, { tRanking: 0 });
        return;
      }
      if (r.totalSemesterAverage !== prev) {
        rank = idx + 1;
        prev = r.totalSemesterAverage;
      }
      const average = r.totalSemesterAverage;
      const tGrade =
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
      semesterMap.set(r.id, { tRanking: rank, tGrade });
    });

    // merge back preserving original order
    return rows.map((r) => {
      const m = monthlyMap.get(r.id) || {};
      const s = semesterMap.get(r.id) || {};
      return {
        ...r,
        mRanking: m.mRanking,
        mGrade: m.mGrade,
        tRanking: s.tRanking,
        tGrade: s.tGrade,
      } as StudentMonthlyExamsAvgResponse & {
        mRanking?: number;
        mGrade?: string;
        tRanking?: number;
        tGrade?: string;
      };
    });
  }, [rows]);

  // Extract exam month keys for column grouping
  const ExamMonthKeys = useMemo(() => {
    return processedRows.length > 0 && processedRows[0]?.monthlyAverage
      ? Object.keys(processedRows[0].monthlyAverage).filter((key) => {
          return typeof key === "string" && !key.startsWith("SEMESTER_"); // exclude semester keys
        })
      : [];
  }, [processedRows]);

  // Extract current semester keys
  const ExamSemesterKeys = useMemo(() => {
    return processedRows.length > 0 && processedRows[0]?.monthlyAverage
      ? Object.keys(processedRows[0].monthlyAverage).filter((key) => {
          return typeof key === "string" && key.startsWith("SEMESTER_"); // only semester keys
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
        field: "totalMonthlyAverage",
        headerName: t("Common.total"),
        headerClassName: "font-siemreap",
        cellClassName: "font-semibold",
        type: "string",
        width: 90,
        align: "center",
        headerAlign: "center",
        sortable: true,
        disableColumnMenu: true,
        valueGetter: (value, row) => {
          return truncateDecimal(row?.totalMonthlyAverage || 0, 2);
        },
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
        sortable: true,
        disableColumnMenu: true,
        valueGetter: (value, row, column) => {
          const field = column?.field;
          const scoreArr = row?.monthlyAverage;
          if (!scoreArr) return "";
          return truncateDecimal(scoreArr[field] || 0, 2);
        },
      };
      return [baseCol];
    });

    //ប្រចាំឆមាសលើកទី...
    const dynamicSemesterAvgColumns: GridColDef[] = ExamSemesterKeys.flatMap(
      (key) => {
        const baseCol: GridColDef = {
          field: key,
          headerName: t("CommonField.avgSemester", {
            num: exam?.semesterNumber || "",
          }),
          type: "string",
          width: 120,
          align: "center",
          headerAlign: "center",
          editable: false,
          sortable: true,
          disableColumnMenu: true,
          valueGetter: (value, row, column) => {
            const field = column?.field as string;
            const scoreArr = row?.monthlyAverage;
            if (!scoreArr) return "";
            const v = scoreArr[field];
            return typeof v === "number"
              ? truncateDecimal(v, 2)
              : Number(v)
                ? truncateDecimal(Number(v), 2)
                : "0.00";
          },
        };

        const totalAvgSemester: GridColDef = {
          field: `totalSemesterAverage`,
          headerName: t("CommonField.average"),
          type: "string",
          width: 120,
          align: "center",
          headerAlign: "center",
          editable: false,
          sortable: true,
          disableColumnMenu: true,
          valueGetter: (_, row) => {
            return truncateDecimal(row?.totalSemesterAverage || 0, 2);
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
          sortable: true,
          disableColumnMenu: true,
          valueGetter: (value, row) => row?.tRanking ?? "",
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
          sortable: true,
          disableColumnMenu: true,
          valueGetter: (value, row) => row?.tGrade ?? "",
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
        headerName: `${t("CommonField.averageSemester", { num: exam?.semesterNumber || "" })}`,
        headerAlign: "center",
        headerClassName: "font-siemreap",
        children: [
          ...ExamMonthKeys.map((key) => ({ field: key })),
          { field: "totalMonthlyAverage" },
          { field: "mRanking" },
        ],
      },
    ];

    // Add a group for each semester key
    ExamSemesterKeys.forEach((key, idx) => {
      groups.push({
        groupId: `semester_${key}`,
        headerName: `${t("CommonField.semester", { num: exam?.semesterNumber || "" })}`,
        headerAlign: "center",
        headerClassName: "font-siemreap",
        children: [
          { field: `totalSemesterAverage` },
          { field: `tRanking` },
          { field: `tGrade` },
        ],
      });
    });
    return groups;
  }, [isShow, ExamMonthKeys, ExamSemesterKeys, t]);

  // Notify parent of processedRows changes
  useEffect(() => {
    if (onProcessedRowsChange) {
      onProcessedRowsChange(processedRows);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [processedRows]);

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
              settings: true,
              extraControls: (
                <TextField
                  label={t("Common.mekunSemesterAverage")}
                  variant="outlined"
                  disabled
                  size="small"
                  name="averageMekun"
                  type="number"
                  value={exam?.meKunSemester ?? 3}
                  inputProps={{ min: 1, step: 1 }}
                  sx={{ mt: 1 }}
                />
              ),
            },
          },
        }}
        showToolbar
      />
    </>
  );
};
