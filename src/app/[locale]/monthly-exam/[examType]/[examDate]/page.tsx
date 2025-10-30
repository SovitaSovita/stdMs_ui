"use client";

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
import { Box, Button, TextField, Typography } from "@mui/material";
import { DataGrid, GridColDef, GridDensity, GridRowId } from "@mui/x-data-grid";
import dayjs from "dayjs";
import { useAtom, useAtomValue } from "jotai";
import { useTranslations } from "next-intl";
import { notFound } from "next/navigation";
import { ChangeEvent, use, useEffect, useMemo, useState } from "react";

type Params = {
  examType: string;
  examDate: string;
};

export default function Page({ params }: { params: Promise<Params> }) {
  const { examType, examDate } = use(params);

  const [settings, setSettings] = useState<Settings>(getInitialSettings());

  useEffect(() => {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  const [meKunValue, setMekunValue] = useState<string>("16.5");
  const [examData, setExamData] = useState<ClassExamDataResponseType>();
  const [rows, setRows] = useState<StudentInfoScore[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

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
        width: 150,
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
        headerAlign: "center",
        width: 70,
        sortable: false,
        disableColumnMenu: true,
      },
      {
        field: "average",
        headerName: "ម.ភាគ",
        headerClassName: "font-siemreap",
        cellClassName: "font-semibold",
        type: "string",
        width: 70,
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
        width: 70,
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
        width: 70,
        align: "center",
        headerAlign: "center",
        sortable: true,
        disableColumnMenu: true,
      },
    ];

    // Safely extract score keys with null checks
    const scoreKeys =
      rows.length > 0 && rows[0].scores ? Object.keys(rows[0].scores) : [];

    const dynamicScoreColumns: GridColDef[] = scoreKeys.map((key) => ({
      field: key,
      headerName: key.toUpperCase().slice(0, 2),
      type: "string",
      width: 70,
      align: "center",
      headerAlign: "center",
      editable: true,
      sortable: false,
      disableColumnMenu: true,
      valueGetter: (value, row, column) => {
        const field = column?.field;
        const scoreArr = row?.scores;
        if (!scoreArr) return "";
        return scoreArr[field] || 0; // Return first score object's value
      },
    }));
    return [...staticColumns, ...dynamicScoreColumns, ...staticColumns2];
  }, [rows]);

  const [loading, setLoading] = useState(true);
  const classroom = useAtomValue(classroomAtom);
  const [, showAlert] = useAtom(showAlertAtom);

  const validTypes = ["monthly", "semester"] as const;
  const isValidType = validTypes.includes(examType as any);
  const parsedDate = dayjs(examDate, "MMYYYY", true); // strict
  const isValidDate = parsedDate.isValid();
  const t = useTranslations();

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

        console.log(updatedRow);

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

    // Calculate totalScore & average
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

    // Sort by totalScore descending for ranking
    const sorted = [...withTotals].sort((a, b) => b.totalScore - a.totalScore);

    // Assign ranking and grade
    const withRank = sorted.map((row, index) => ({
      ...row,
      mRanking: row?.totalScore != 0 ? index + 1 : 0,
      mGrade:
        row.average >= 45
          ? "A"
          : row.average >= 40
          ? "B"
          : row.average >= 35
          ? "C"
          : row.average >= 30
          ? "D"
          : row.average >= 25
          ? "E"
          : "F",
    }));

    // Reorder back to original order by ID
    return withTotals.map(
      (r) => withRank.find((w) => w.id === r.id) ?? r
    ) as StudentInfoScore[];
  }, [rows, meKunValue]);

  return (
    <>
      <Box sx={{ width: "100%", maxWidth: { sm: "100%", md: "1700px" } }}>
        <div className="flex justify-between">
          <Typography component="h2" variant="h6" sx={{ mb: 2 }}>
            Overview
          </Typography>
        </div>

        <Box className="font-siemreap" sx={{ height: 600, width: "100%" }}>
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
                      {/* <Button variant="contained" size="small">
                        Ranking
                      </Button> */}
                      <TextField
                        label="Enter Mekun"
                        variant="outlined"
                        size="small"
                        name="meKun"
                        type="number"
                        value={meKunValue}
                        // placeholder="Average"
                        onChange={handleInputMekun}
                        sx={{ mt: 1, }}
                      />
                    </>
                  ),
                },
              },
            }}
            showToolbar
          />
        </Box>
      </Box>
    </>
  );
}
