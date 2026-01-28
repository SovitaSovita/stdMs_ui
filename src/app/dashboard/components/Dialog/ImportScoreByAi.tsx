import React, { use, useRef, useState } from "react";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import {
  Box,
  CircularProgress,
  FormControl,
  FormHelperText,
  InputLabel,
  MenuItem,
  Select,
  Typography,
} from "@mui/material";
import { useFormik } from "formik";
import { useInsertOneStutSchema } from "@/app/libs/hooks/Validation";
import CustomDatePicker from "../CustomDatePicker";
import {
  ScoreUpsertRequest,
  StudentsInfo,
  StudentsRequestUpsertType,
} from "@/app/constants/type";
import StudentService from "@/app/service/StudentService";
import { classroomAtom, examAtom } from "@/app/libs/jotai/classroomAtom";
import { useAtomValue } from "jotai";
import { useTranslations } from "next-intl";
import DriveFolderUploadIcon from "@mui/icons-material/DriveFolderUpload";
import {
  DataGrid,
  GridColDef,
  GridRenderCellParams,
  GridRowId,
  GridRowSelectionModel,
} from "@mui/x-data-grid";
import useNotifications from "@/app/libs/hooks/useNotifications/useNotifications";
import CallSplitIcon from "@mui/icons-material/CallSplit";
import InfoOutlineIcon from "@mui/icons-material/InfoOutline";
import AutoFixHighIcon from "@mui/icons-material/AutoFixHigh";
import { validateHeaders, matchHeaderToField } from "./ExcelHeaderAliases";
import dayjs from "dayjs";
import useClassroomData from "@/app/libs/hooks/useClassroomData";
import { DATA } from "./Data";
import {
  GoogleGenAI,
  createUserContent,
  createPartFromUri,
} from "@google/genai";
import ClassroomService from "@/app/service/ClassroomService";
import { DeleteConfirmationDialog } from "./DeleteConfirmationDialog";
import { AskForConfirmationDialog } from "./AskForConfirmationDialog";
const GEMINI_API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY as string;
const ai = new GoogleGenAI({
  apiKey: GEMINI_API_KEY,
});

type ImportScoreByAiProps = {
  examId?: string;
  callback?: () => Promise<void> | void;
};

export const ImportScoreByAi = (props: ImportScoreByAiProps) => {
  const { examId, callback } = props;
  const [open, setOpen] = React.useState(false);
  const [saveConfirmDialogOpen, setSaveConfirmDeleteDialogOpen] =
    React.useState(false);
  const classroom = useAtomValue(classroomAtom);
  const t = useTranslations();
  const [file, setFile] = useState<File | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const fileReaderRef = useRef<FileReader | null>(null);

  const { students, subjects, refetch } = useClassroomData(classroom);

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    if (isLoading) {
      handleCancel();
    }
    handleClear();
    setOpen(false);
  };
  const [rows, setRows] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [abortController, setAbortController] =
    useState<AbortController | null>(null);
  const [preview, setPreview] = useState<any>(null);
  const [rowSelectionModel, setRowSelectionModel] =
    useState<GridRowSelectionModel>({
      type: "include", // or 'exclude'
      ids: new Set<GridRowId>([]),
    });
  const notification = useNotifications();

  const columns = React.useMemo(() => {
    const baseColumns: GridColDef[] = [
      {
        field: "orderNo",
        headerName: t("CommonField.id"),
        headerClassName: "font-siemreap",
        width: 60,
        editable: false,
      },
      {
        field: "fullName",
        headerName: t("CommonField.fullName"),
        headerClassName: "font-siemreap",
        width: 150,
        editable: false,
        sortable: true,
        disableColumnMenu: true,
      },
      {
        field: "gender",
        headerName: t("CommonField.sex"),
        headerClassName: "font-siemreap",
        type: "singleSelect",
        width: 80,
        align: "center",
        headerAlign: "center",
        editable: false,
        sortable: false,
        disableColumnMenu: true,
        valueOptions: [
          { value: "M", label: t("Common.male") || "Male" },
          { value: "F", label: t("Common.female") || "Female" },
        ],
      },
    ];
    const baseSubjectColumns: GridColDef[] = subjects.map((subject) => ({
      field: subject.name,
      headerName: subject.name,
      headerClassName: "font-siemreap",
      width: 70,
      align: "center",
      headerAlign: "center",
      editable: false,
      sortable: false,
      disableColumnMenu: true,
    }));
    // Safely extract score keys with null checks
    const scoreKeys =
      rows.length > 0 && rows[0].scores ? Object.keys(rows[0].scores) : [];

    const dynamicScoreColumns: GridColDef[] = subjects.flatMap((subject) => {
      if (!subject) return [];
      const baseCol: GridColDef = {
        field: subject.name,
        headerName: subject.name,
        type: "number",
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
          return scoreArr[field] || 0;
        },
      };
      return [baseCol];
    });

    if (preview) {
      return [...baseColumns, ...dynamicScoreColumns] as GridColDef[]; // Use dynamicScoreColumns when preview AI exists
    }
    return [...baseColumns, ...baseSubjectColumns] as GridColDef[]; // Fallback to baseSubjectColumns if no preview
  }, [preview]);

  // Initialize rows
  React.useEffect(() => {
    if (students?.student) {
      setRows(students.student);
    }
  }, [students, open]);

  const uploadImageToAiRead = async () => {
    try {
      const input = document.createElement("input");
      input.type = "file";
      input.accept =
        ".xls,.xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel";
      input.click();

      input.onchange = async () => {
        if (!input.files?.[0]) return;

        const file = input.files[0];
        setIsLoading(true);

        const controller = new AbortController();
        abortControllerRef.current = controller;

        const reader = new FileReader();
        fileReaderRef.current = reader;

        reader.onload = async (e) => {
          try {
            if (controller.signal.aborted) return;

            const buffer = e.target?.result as ArrayBuffer;
            const base64ImageData = Buffer.from(buffer).toString("base64");

            const result = await ai.models.generateContent({
              model: "gemini-3-flash-preview",
              config: {
                temperature: 0.2,
                abortSignal: controller.signal,
              },
              contents: [
                {
                  inlineData: {
                    mimeType: file.type,
                    data: base64ImageData,
                  },
                },
                {
                  text:
                    "Extract the data from this grade sheet.\n" +
                    "Return a JSON array of objects with keys: 'id', 'name', 'gender', 'scores: {header: value}'.\n" +
                    "If file is wrong return null or If unreadable cell, use null.",
                },
              ],
            });

            if (controller.signal.aborted) return;

            const cleanJson = (result.text || "")
              .replace(/```json|```/g, "")
              .trim();

            const previewData = JSON.parse(cleanJson);
            // const previewData = DATA;
            setPreview(previewData);

            if (Array.isArray(previewData)) {
              const aiDataMap = new Map(
                previewData.map((item: any) => [item.id, item]),
              );

              //get only subjects that existing in classroom subjects
              const filterSubjects = subjects.map((sub) => sub.name);
              const mergedRows = (students?.student || []).map(
                (student: StudentsInfo) => ({
                  ...student,
                  scores:
                    filterSubjects.reduce(
                      (acc, subject) => {
                        acc[subject] =
                          aiDataMap.get(student.orderNo)?.scores?.[subject] ||
                          0;
                        return acc;
                      },
                      {} as Record<string, number>,
                    ) || {},
                }),
              );

              setRows(mergedRows);
            }
          } catch (err: any) {
            if (err.name === "AbortError") {
              console.log("AI request aborted");
            } else {
              console.error("AI error:", err);
              notification.show(t("Common.errorOccurred"), {
                severity: "error",
              });
            }
          } finally {
            setIsLoading(false);
            abortControllerRef.current = null;
            fileReaderRef.current = null;
          }
        };

        reader.onerror = () => {
          setIsLoading(false);
          notification.show(t("Common.errorOccurred"), { severity: "error" });
        };

        reader.readAsArrayBuffer(file);
      };
    } catch (err) {
      setIsLoading(false);
      notification.show(t("Common.errorOccurred"), { severity: "error" });
    }
  };

  const handleCancel = () => {
    abortControllerRef.current?.abort();
    fileReaderRef.current?.abort();
    abortControllerRef.current = null;
    fileReaderRef.current = null;
    setIsLoading(false);

    notification.show(t("Common.cancel"), {
      severity: "info",
      autoHideDuration: 3000,
    });
  };

  const handleClear = () => {
    setFile(null);
    setRows([]);
    setPreview(null);
  };

  const handleDelete = () => {
    const selectedIds = getSelectedIds(rowSelectionModel, rows);
    if (selectedIds.length === 0) {
      notification.show(
        t("Student.ImportDialog.noRowsSelected") ||
          "Please select rows to delete",
        {
          severity: "warning",
          autoHideDuration: 3000,
        },
      );
      return;
    }

    const updatedRows = rows.filter((row) => !selectedIds.includes(row.id));
    setRows(updatedRows);
    setRowSelectionModel({
      type: "include",
      ids: new Set<GridRowId>([]),
    });

    notification.show(
      t("Student.ImportDialog.rowsDeleted") ||
        `${selectedIds.length} row(s) deleted`,
      {
        severity: "success",
        autoHideDuration: 3000,
      },
    );
  };

  const getSelectedIds = (
    rowSelectionModel: GridRowSelectionModel,
    rows: { id: GridRowId }[],
  ): GridRowId[] => {
    if (rowSelectionModel.type === "include") {
      return Array.from(rowSelectionModel.ids);
    }

    // type === "exclude" → all rows selected except excluded ones
    return rows
      .map((row) => row.id)
      .filter((id) => !rowSelectionModel.ids.has(id));
  };

  const handleSave = async () => {
    try {
      const selectedIds = getSelectedIds(rowSelectionModel, rows);
      if (selectedIds.length === 0) {
        notification.show(
          t("Student.ImportDialog.noRowsSelected") ||
            "Please select rows to save",
          {
            severity: "warning",
            autoHideDuration: 3000,
          },
        );
        return;
      }
      if (preview === null) {
        notification.show(t("Student.ImportDialog.noPreviewData"), {
          severity: "warning",
          autoHideDuration: 3000,
        });
        return;
      }
      setIsLoading(true);

      const updatedRows = rows.filter((row) => selectedIds.includes(row.id));
      const sendData: ScoreUpsertRequest[] = [];
      updatedRows.forEach((modifiedRow) => {
        Object.keys(modifiedRow.scores || {}).forEach((subjectName) => {
          const score = modifiedRow.scores?.[subjectName];
          if (score !== undefined && score !== null && score !== "") {
            sendData.push({
              studentId: modifiedRow.id,
              subjectName: subjectName,
              score: Number(score),
            });
          }
        });
      });

      if (examId && classroom?.id) {
        const response = await ClassroomService.upsertStuScores(
          classroom?.id,
          examId,
          sendData,
        );

        if (response) {
          notification.show(response?.message || t("Common.success"), {
            severity: "success",
            autoHideDuration: 3000,
          });
        }
        callback?.();
        handleClose();
      }
    } catch (error) {
      console.error("handleSave error:", error);
      notification.show(t("Common.errorOccurred"), {
        severity: "error",
        autoHideDuration: 3000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const processRowUpdate = async (
    newRow: any,
    oldRow: any,
    params: { rowId: GridRowId },
  ): Promise<any> => {
    setIsLoading(true);

    try {
      if (!oldRow?.scores) {
        notification.show(t("Student.ImportDialog.noScoresData"), {
          severity: "warning",
          autoHideDuration: 3000,
        });
        return oldRow;
      }
      const changedField = Object.keys(newRow).find((key) => {
        if (key === "scores") return false;
        const newVal = newRow[key];
        const oldVal = oldRow[key];
        return newVal !== oldVal;
      });

      if (!changedField) {
        return oldRow;
      }

      // Merge this field into scores
      const updatedScores = {
        ...oldRow.scores,
        [changedField]: Number(newRow[changedField]),
      };

      // Build the updated row
      const updatedRow = {
        ...oldRow,
        scores: updatedScores,
      };

      // Update the row locally
      setRows((prev) =>
        prev.map((r) => (r.id === updatedRow.id ? updatedRow : r)),
      );
      return updatedRow;
    } catch (error) {
      console.error("processRowUpdate error:", error);
      return oldRow; // rollback
    } finally {
      setIsLoading(false);
    }
  };

  // console.log("rows", rows);
  // console.log("columns", columns);

  return (
    <>
      <Button
        onClick={handleClickOpen}
        variant="contained"
        size="small"
        startIcon={<DriveFolderUploadIcon />}
      >
        AI Import
      </Button>
      <Dialog
        open={open}
        onClose={(event, reason) => {
          if (reason === "backdropClick") return;
          handleClose();
        }}
        fullWidth
        maxWidth="lg"
      >
        <DialogTitle>
          <Box
            sx={{ mb: 2 }}
            display="flex"
            justifyContent="space-between"
            alignItems="center"
          >
            <Typography variant="h6" component="div">
              {t("Student.ImportDialog.title")}
            </Typography>
            <Button onClick={handleClose}>{t("Common.cancel")}</Button>
          </Box>
        </DialogTitle>
        <DialogContent>
          {/* Main Workspace Grid */}
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", lg: "2fr 1fr" },
              gap: "24px",
              alignItems: "start",
            }}
          >
            {/* Left Side: File & Preview Data Grid */}
            <Box sx={{ display: "flex", flexDirection: "column", gap: "24px" }}>
              {/* Upload Zone (Hidden once file uploaded, but shown here for UI flow) */}
              <Box
                sx={{
                  borderRadius: "12px",
                  border: "2px dashed",
                  borderColor: "action.disabled",
                  padding: "32px",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "16px",
                  "&:hover": {
                    borderColor: "primary.main",
                    transition: "border-color 0.3s ease-in-out",
                  },
                }}
              >
                <Box
                  sx={{
                    width: "64px",
                    height: "64px",
                    borderRadius: "50%",
                    backgroundColor: "rgba(33, 150, 243, 0.1)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <DriveFolderUploadIcon
                    sx={{
                      color: "primary.main",
                      fontSize: "32px",
                    }}
                  />
                </Box>
                <Box sx={{ textAlign: "center" }}>
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: "bold",
                      marginBottom: "8px",
                    }}
                  >
                    {file && file.name}
                  </Typography>
                  <Typography variant="caption">
                    {t("Student.ImportDialog.fileSize", {
                      size: file?.size
                        ? (file.size / 1024).toFixed(2) + " KB"
                        : "0 KB",
                      rows: preview?.length,
                    })}
                  </Typography>
                </Box>
                <Box sx={{ display: "flex", gap: "8px" }}>
                  {isLoading ? (
                    <Button
                      variant="contained"
                      color="inherit"
                      onClick={handleCancel}
                      startIcon={<CircularProgress size={16} />}
                    >
                      {t("Common.cancel")}
                    </Button>
                  ) : (
                    <Button
                      loading={isLoading}
                      variant="contained"
                      color="primary"
                      onClick={uploadImageToAiRead}
                    >
                      {t("Student.ImportDialog.replaceFile")}
                    </Button>
                  )}
                </Box>
              </Box>
            </Box>
            {/* Right Side: Mapping Sidebar (Col 4) */}
            <Box
              sx={{
                display: { xs: "none", lg: "flex" },
                flexDirection: "column",
                gap: "24px",
                width: "100%",
              }}
            >
              <Box
                sx={{
                  borderRadius: "12px",
                  border: "1px solid",
                  borderColor: "divider",
                  overflow: "hidden",
                }}
              >
                <Box
                  sx={{
                    padding: "14px",
                    borderBottom: "1px solid",
                    borderBottomColor: "divider",
                    backgroundColor: "action.hover",
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      marginBottom: "8px",
                    }}
                  >
                    <CallSplitIcon
                      sx={{ color: "primary.main" }}
                      fontSize="large"
                    />
                    <Typography variant="subtitle1" sx={{ fontWeight: "bold" }}>
                      {t("Student.ImportDialog.columnMapping")}
                    </Typography>
                  </Box>
                  <Typography variant="caption" sx={{ color: "#9dabb9" }}>
                    {t("Student.ImportDialog.connectHeaders")}
                  </Typography>
                </Box>
                {/* Helper Tip Card */}
                <Box
                  sx={{
                    padding: "16px",
                    border: "1px solid rgba(33, 150, 243, 0.2)",
                    display: "flex",
                    gap: "12px",
                  }}
                >
                  <InfoOutlineIcon
                    sx={{ color: "primary.main", flexShrink: 0 }}
                  />
                  <Box>
                    <Typography
                      variant="caption"
                      sx={{
                        fontWeight: "bold",
                        display: "block",
                      }}
                    >
                      {t("Student.ImportDialog.proTip")}
                    </Typography>
                    <Typography
                      variant="caption"
                      color="textSecondary"
                      sx={{
                        marginTop: "8px",
                        display: "block",
                        lineHeight: 1.6,
                      }}
                    >
                      {t("Student.ImportDialog.aiProTipText")}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </Box>
          </Box>

          <Box mt={2}>
            <Typography variant="subtitle2" sx={{ fontWeight: "bold" }}>
              {t("Student.ImportDialog.plsReview")}
            </Typography>
          </Box>

          {/* <!-- Preview Table Card --> */}
          {/* Form fields would go here */}
          <Box
            className="font-siemreap"
            sx={{ height: 500, width: "100%", mt: 2 }}
          >
            <DataGrid
              rows={rows}
              columns={columns}
              loading={isLoading}
              hideFooterSelectedRowCount
              disableRowSelectionOnClick
              checkboxSelection={true}
              onRowSelectionModelChange={(newRowSelectionModel) => {
                setRowSelectionModel(newRowSelectionModel);
              }}
              rowSelectionModel={rowSelectionModel}
              processRowUpdate={processRowUpdate}
              pageSizeOptions={[40]}
              initialState={{
                pagination: { paginationModel: { pageSize: 40 } },
              }}
            />
          </Box>

          {/* Display AI Response as JSON */}
          {preview && (
            <Box
              sx={{
                mt: 2,
                p: 2,
                borderRadius: "8px",
                border: "1px solid",
                borderColor: "action.disabled",
                maxHeight: "300px",
                overflow: "auto",
              }}
            >
              {/* <Typography
                variant="subtitle2"
                sx={{ fontWeight: "bold", mb: 1 }}
              >
                AI Response Data:
              </Typography>
              <Box
                component="pre"
                sx={{
                  p: 1.5,
                  borderRadius: "4px",
                  fontSize: "12px",
                  fontFamily: "monospace",
                  border: "1px solid",
                  borderColor: "action.disabled",
                  overflow: "auto",
                }}
              >
                {JSON.stringify(preview, null, 2)}
              </Box> */}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>{t("Common.cancel")}</Button>
          <Button
            disabled={!preview}
            variant="contained"
            onClick={() => setSaveConfirmDeleteDialogOpen(true)}
          >
            {t("Common.save")}
          </Button>
        </DialogActions>
      </Dialog>

      <AskForConfirmationDialog
        open={saveConfirmDialogOpen}
        onClose={() => setSaveConfirmDeleteDialogOpen(false)}
        onConfirm={handleSave}
        itemName="scores"
        title={t("Student.ImportDialog.titleConfirm")}
        message={t("Student.ImportDialog.messageConfirm", {
          count:
            rowSelectionModel.ids.size > 0
              ? rowSelectionModel.ids.size
              : rows.length,
        })}
        confirmText={t("Common.save")}
        cancelText={t("Common.cancel")}
      />
    </>
  );
};
