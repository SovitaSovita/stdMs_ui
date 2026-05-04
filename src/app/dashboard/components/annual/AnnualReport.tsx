"use client";

import React from "react";
import {
  ClassAnnualAvgResponse,
  ClassAvgExamFilterResponseType,
  ClassExamDataResponseType,
  ClassReqFilterDetailType,
  ScoreUpsertRequest,
  Settings,
  StudentAnnualAvgResponse,
  StudentInfoScore,
  StudentMonthlyExamsAvgResponse,
} from "@/app/constants/type";
import { CustomDataGridToolbar } from "@/app/dashboard/components/Common/CustomDataGridToolbar";
import { showAlertAtom } from "@/app/libs/jotai/alertAtom";
import { classroomAtom, examAtom } from "@/app/libs/jotai/classroomAtom";
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

type AnnualReportProps = {
  isShow: boolean;
  rows: StudentAnnualAvgResponse[];
};

export default function AnnualReport({ isShow, rows }: AnnualReportProps) {
  const [settings, setSettings] = useState<Settings>(getInitialSettings());
  const t = useTranslations();

  useEffect(() => {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  // Define columns for DataGrid
  const columns = useMemo(() => {
    const staticColumns: GridColDef<StudentAnnualAvgResponse>[] = [
      {
        field: "orderNo",
        headerName: t("CommonField.id"),
        headerClassName: "font-siemreap",
        width: 50,
      },
      {
        field: "fullName",
        headerName: t("CommonField.fullName"),
        headerClassName: "font-siemreap",
        width: 190,
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

    //មធ្យមភាគប្រចាំឆមាស ១និង ២...
    const stacticColumns2: GridColDef<StudentAnnualAvgResponse>[] = [
      {
        field: "semester_1Average",
        headerName: t("Annual.semesterAverage", { num: 1 }),
        headerClassName: "font-siemreap",
        cellClassName: "font-semibold",
        type: "string",
        width: 90,
        align: "center",
        headerAlign: "center",
        sortable: true,
        disableColumnMenu: true,
        valueGetter: (_, row) => {
          return truncateDecimal(row?.semester_1Average || 0, 2);
        },
      },
      {
        field: "semester_2Average",
        headerName: t("Annual.semesterAverage", { num: 2 }),
        headerClassName: "font-siemreap",
        cellClassName: "font-semibold",
        type: "string",
        width: 90,
        align: "center",
        headerAlign: "center",
        sortable: true,
        disableColumnMenu: true,
        valueGetter: (_, row) => {
          return truncateDecimal(row?.semester_2Average || 0, 2);
        },
      },
    ];
    //មធ្យមភាគប្រចាំឆ្នាំ...
    const staticColumns3: GridColDef<StudentAnnualAvgResponse>[] = [
      {
        field: "annualAverage",
        headerName: t("Annual.average"),
        headerClassName: "font-siemreap",
        cellClassName: "text-red-500 font-semibold",
        type: "string",
        width: 90,
        align: "center",
        headerAlign: "center",
        sortable: true,
        disableColumnMenu: true,
        valueGetter: (_, row) => {
          return truncateDecimal(row?.annualAverage || 0, 2);
        },
      },
      {
        field: "annualRanking",
        headerName: t("Annual.ranking"),
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
        field: "annualGrade",
        headerName: t("Annual.grade"),
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

    //when Tab = view only Average
    if (isShow) {
      return [...staticColumns, ...stacticColumns2, ...staticColumns3];
    }

    return [...staticColumns, ...staticColumns3];
  }, [rows]);

  // Grouping header
  const columnGroupingModel: GridColumnGroupingModel = useMemo(() => {
    if (!isShow) {
      // No group headers,
      return [];
    }
    // Monthly group as before
    const groups: GridColumnGroupingModel = [
      {
        groupId: "annual",
        headerName: `${t("Annual.title")}`,
        headerAlign: "center",
        headerClassName: "font-siemreap",
        children: [
          { field: "annualAverage" },
          { field: "annualRanking" },
          { field: "annualGrade" },
        ],
      },
    ];
    return groups;
  }, [isShow, t]);


  return (
    <>
      <DataGrid
        rows={rows}
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
              exportTitle: isShow
                ? t("Annual.annualAverage")
                : t("Annual.annualAverageRanking"),
            },
          },
        }}
        showToolbar
      />
    </>
  );
}
