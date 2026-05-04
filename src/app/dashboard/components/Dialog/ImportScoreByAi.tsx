import React, { useEffect, useRef, useState } from "react";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import {
  Avatar,
  Box,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  IconButton,
  LinearProgress,
  Stack,
  Tooltip,
  Typography,
  alpha,
  useTheme,
} from "@mui/material";
import { ScoreUpsertRequest, StudentsInfo } from "@/app/constants/type";
import { classroomAtom } from "@/app/libs/jotai/classroomAtom";
import { useAtomValue } from "jotai";
import { useTranslations } from "next-intl";
import SmartToyIcon from "@mui/icons-material/SmartToy";
import CloseIcon from "@mui/icons-material/Close";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import DeleteSweepIcon from "@mui/icons-material/DeleteSweep";
import LoopIcon from "@mui/icons-material/Loop";
import SaveIcon from "@mui/icons-material/Save";
import AutoFixHighIcon from "@mui/icons-material/AutoFixHigh";
import {
  DataGrid,
  GridColDef,
  GridRowId,
  GridRowSelectionModel,
} from "@mui/x-data-grid";
import useNotifications from "@/app/libs/hooks/useNotifications/useNotifications";
import { GoogleGenAI, ThinkingLevel } from "@google/genai";
import ClassroomService from "@/app/service/ClassroomService";
import { AskForConfirmationDialog } from "./AskForConfirmationDialog";
import useClassroomData from "@/app/libs/hooks/useClassroomData";

const GEMINI_API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY as string;
const ai = new GoogleGenAI({
  apiKey: GEMINI_API_KEY,
});

type ImportScoreByAiProps = {
  examId?: string;
  callback?: () => Promise<void> | void;
};

function formatBytes(bytes?: number) {
  if (!bytes) return "0 KB";
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(2)} KB`;
  return `${(kb / 1024).toFixed(2)} MB`;
}

export const ImportScoreByAi = (props: ImportScoreByAiProps) => {
  const { examId, callback } = props;
  const theme = useTheme();

  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState("Initializing...");
  const [open, setOpen] = useState(false);
  const [saveConfirmDialogOpen, setSaveConfirmDeleteDialogOpen] =
    useState(false);
  const [
    beforeUploadConfirmDialogOpen,
    setBeforeUploadConfirmDeleteDialogOpen,
  ] = useState(false);
  const classroom = useAtomValue(classroomAtom);
  const t = useTranslations();
  const [file, setFile] = useState<File | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const fileReaderRef = useRef<FileReader | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");

  const { students, subjects } = useClassroomData(classroom, {
    autoFetch: true,
  });

  useEffect(() => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const handleClickOpen = () => setOpen(true);

  const handleClose = () => {
    if (isLoading) {
      handleCancel();
    }
    handleClear();
    setOpen(false);
  };

  const [rows, setRows] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [preview, setPreview] = useState<any>(null);
  const [rowSelectionModel, setRowSelectionModel] =
    useState<GridRowSelectionModel>({
      type: "include",
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
      return [...baseColumns, ...dynamicScoreColumns] as GridColDef[];
    }
    return [...baseColumns, ...baseSubjectColumns] as GridColDef[];
  }, [preview, subjects, t]);

  useEffect(() => {
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
        setFile(file);
        setIsLoading(true);
        setProgress(0);
        setStatusText("Reading file...");

        const controller = new AbortController();
        abortControllerRef.current = controller;

        const reader = new FileReader();
        fileReaderRef.current = reader;

        reader.onprogress = (event) => {
          if (event.lengthComputable) {
            const readPercent = (event.loaded / event.total) * 20;
            setProgress(Math.min(readPercent, 20));
          }
        };

        reader.onload = async (e) => {
          try {
            if (controller.signal.aborted) return;

            setStatusText("Digitizing & Extracting Data...");

            const progressInterval = setInterval(() => {
              setProgress((prev) => {
                if (prev >= 90) return 90;
                const increment = Math.random() * 5 + 1;
                return prev + increment;
              });
            }, 500);

            const buffer = e.target?.result as ArrayBuffer;
            const base64ImageData = Buffer.from(buffer).toString("base64");

            const result = await ai.models.generateContent({
              model: "gemini-3-flash-preview",
              config: {
                temperature: 1,
                abortSignal: controller.signal,
                thinkingConfig: {
                  thinkingLevel: ThinkingLevel.HIGH,
                },
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

            clearInterval(progressInterval);
            setProgress(100);
            setStatusText("Complete!");

            if (controller.signal.aborted) return;

            console.log("result.text >", result.text);
            const cleanJson = (result.text || "")
              .replace(/```json|```/g, "")
              .trim();
            const previewData = JSON.parse(cleanJson);
            setPreview(previewData);

            if (Array.isArray(previewData)) {
              const aiDataMap = new Map(
                previewData.map((item: any) => [item.id, item])
              );

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
                      {} as Record<string, number>
                    ) || {},
                })
              );
              setRows(mergedRows);
            }
          } catch (err: any) {
            if (err.name === "AbortError") {
              console.log("AI request aborted");
            } else {
              console.error("AI error:", err);
            }
          } finally {
            setTimeout(() => {
              setIsLoading(false);
              setProgress(0);
            }, 800);

            abortControllerRef.current = null;
            fileReaderRef.current = null;
          }
        };

        reader.readAsArrayBuffer(file);
      };
    } catch (err) {
      setIsLoading(false);
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
    setPreviewUrl("");
    setRows([]);
    setPreview(null);
    setRowSelectionModel({ type: "include", ids: new Set<GridRowId>([]) });
  };

  const handleDelete = () => {
    const selectedIds = getSelectedIds(rowSelectionModel, rows);
    if (selectedIds.length === 0) {
      notification.show(
        t("Student.ImportDialog.noRowsSelected") ||
          "Please select rows to delete",
        { severity: "warning", autoHideDuration: 3000 }
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
      t("Student.ImportDialog.rowsDeleted", { count: selectedIds.length }),
      { severity: "success", autoHideDuration: 3000 }
    );
  };

  const getSelectedIds = (
    rowSelectionModel: GridRowSelectionModel,
    rows: { id: GridRowId }[]
  ): GridRowId[] => {
    if (rowSelectionModel.type === "include") {
      return Array.from(rowSelectionModel.ids);
    }
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
          { severity: "warning", autoHideDuration: 3000 }
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
          sendData
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

  const processRowUpdate = async (newRow: any, oldRow: any): Promise<any> => {
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

      if (!changedField) return oldRow;

      const updatedScores = {
        ...oldRow.scores,
        [changedField]: Number(newRow[changedField]),
      };

      const updatedRow = { ...oldRow, scores: updatedScores };
      setRows((prev) =>
        prev.map((r) => (r.id === updatedRow.id ? updatedRow : r))
      );
      return updatedRow;
    } catch (error) {
      console.error("processRowUpdate error:", error);
      return oldRow;
    } finally {
      setIsLoading(false);
    }
  };

  const selectedCount = rowSelectionModel.ids.size;
  const hasFile = !!file;
  const hasPreview = !!preview;

  /* ================= Upload Zone States ================= */

  const renderEmptyUpload = () => (
    <Box
      sx={{
        borderRadius: 3,
        border: "2px dashed",
        borderColor: alpha(theme.palette.primary.main, 0.4),
        bgcolor: alpha(theme.palette.primary.main, 0.02),
        py: 5,
        px: 3,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 2,
        transition: "all .2s ease",
        "&:hover": {
          borderColor: "primary.main",
          bgcolor: alpha(theme.palette.primary.main, 0.04),
        },
      }}
    >
      <Avatar
        sx={{
          width: 64,
          height: 64,
          bgcolor: alpha(theme.palette.primary.main, 0.12),
          color: "primary.main",
        }}
      >
        <AutoFixHighIcon sx={{ fontSize: 32 }} />
      </Avatar>
      <Stack spacing={0.5} alignItems="center" sx={{ textAlign: "center" }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
          {t("Common.aiHelp")}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          .xlsx, .xls
        </Typography>
      </Stack>
      <Button
        variant="contained"
        size="medium"
        startIcon={<CloudUploadIcon />}
        onClick={() => setBeforeUploadConfirmDeleteDialogOpen(true)}
      >
        {t("Common.uploadPhoto")}
      </Button>
    </Box>
  );

  const renderLoadingUpload = () => (
    <Card variant="outlined">
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={2}
        sx={{ p: 2 }}
        alignItems="center"
      >
        {previewUrl ? (
          <Box
            sx={{
              width: { xs: "100%", sm: 140 },
              height: 100,
              borderRadius: 2,
              overflow: "hidden",
              flexShrink: 0,
              backgroundImage: `url(${previewUrl})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              filter: "grayscale(40%)",
              border: 1,
              borderColor: "divider",
            }}
          />
        ) : (
          <Avatar
            variant="rounded"
            sx={{
              width: 100,
              height: 100,
              bgcolor: alpha(theme.palette.primary.main, 0.12),
              color: "primary.main",
            }}
          >
            <InsertDriveFileIcon sx={{ fontSize: 40 }} />
          </Avatar>
        )}

        <Box sx={{ flex: 1, width: "100%", minWidth: 0 }}>
          <Stack
            direction="row"
            alignItems="center"
            spacing={1}
            sx={{ mb: 0.5 }}
          >
            <LoopIcon
              fontSize="small"
              sx={{
                color: "primary.main",
                animation: "spin 1s linear infinite",
                "@keyframes spin": {
                  "0%": { transform: "rotate(0deg)" },
                  "100%": { transform: "rotate(360deg)" },
                },
              }}
            />
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }} noWrap>
              {statusText}
            </Typography>
            <Box sx={{ flex: 1 }} />
            <Typography variant="caption" color="text.secondary">
              {Math.round(progress)}%
            </Typography>
          </Stack>
          <LinearProgress
            variant="determinate"
            value={progress}
            sx={{
              height: 8,
              borderRadius: 999,
              "& .MuiLinearProgress-bar": {
                transition: "transform 0.2s linear",
              },
            }}
          />
          {file ? (
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ mt: 1, display: "block" }}
              noWrap
            >
              {file.name} • {formatBytes(file.size)}
            </Typography>
          ) : null}
        </Box>

        <Button
          variant="outlined"
          color="inherit"
          size="small"
          onClick={handleCancel}
          startIcon={<CircularProgress size={14} />}
        >
          {t("Common.cancel")}
        </Button>
      </Stack>
    </Card>
  );

  const renderLoadedUpload = () => (
    <Card variant="outlined">
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={2}
        alignItems={{ xs: "stretch", sm: "center" }}
        sx={{ p: 2 }}
      >
        <Avatar
          variant="rounded"
          sx={{
            width: 56,
            height: 56,
            bgcolor: alpha(theme.palette.success.main, 0.12),
            color: "success.main",
            flexShrink: 0,
          }}
        >
          <InsertDriveFileIcon />
        </Avatar>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700 }} noWrap>
            {file?.name}
          </Typography>
          <Stack direction="row" spacing={1} sx={{ mt: 0.5 }} flexWrap="wrap">
            <Chip size="small" label={formatBytes(file?.size)} />
            <Chip
              size="small"
              color="success"
              variant="outlined"
              label={`${t("Common.success")}`}
            />
            {Array.isArray(preview) && (
              <Chip
                size="small"
                variant="outlined"
                label={`${preview.length} ${t("Common.student")}`}
              />
            )}
          </Stack>
        </Box>
        <Stack direction="row" spacing={1}>
          <Button
            variant="outlined"
            size="small"
            startIcon={<RestartAltIcon />}
            onClick={handleClear}
          >
            {t("Common.clear")}
          </Button>
          <Button
            variant="contained"
            size="small"
            startIcon={<CloudUploadIcon />}
            onClick={() => setBeforeUploadConfirmDeleteDialogOpen(true)}
          >
            {t("Student.ImportDialog.replaceFile")}
          </Button>
        </Stack>
      </Stack>
    </Card>
  );

  const renderUploadZone = () => {
    if (isLoading) return renderLoadingUpload();
    if (hasFile && hasPreview) return renderLoadedUpload();
    return renderEmptyUpload();
  };

  return (
    <>
      <Button
        onClick={handleClickOpen}
        variant="contained"
        size="small"
        startIcon={<SmartToyIcon />}
      >
        AI Import
      </Button>
      <Dialog
        open={open}
        onClose={(_event, reason) => {
          if (reason === "backdropClick") return;
          handleClose();
        }}
        fullWidth
        maxWidth="lg"
      >
        <DialogTitle sx={{ pb: 1.5 }}>
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            spacing={1.5}
          >
            <Stack direction="row" alignItems="center" spacing={1.5}>
              <Avatar
                sx={{
                  bgcolor: alpha(theme.palette.primary.main, 0.12),
                  color: "primary.main",
                  width: 40,
                  height: 40,
                }}
              >
                <SmartToyIcon />
              </Avatar>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
                  {t("Student.ImportDialog.title")}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {t("Student.ImportDialog.proTipText")}
                </Typography>
              </Box>
            </Stack>
            <IconButton onClick={handleClose} size="small" aria-label="close">
              <CloseIcon />
            </IconButton>
          </Stack>
        </DialogTitle>
        <Divider />

        <DialogContent sx={{ pt: 2 }}>
          {/* Upload zone */}
          {renderUploadZone()}

          {/* Review section */}
          {(hasPreview || rows.length > 0) && (
            <Card variant="outlined" sx={{ mt: 2.5 }}>
              <CardContent
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 1.5,
                  pb: 1.5,
                  flexWrap: "wrap",
                  rowGap: 1,
                }}
              >
                {selectedCount > 0 ? (
                  <Stack direction="row" alignItems="center" spacing={1.5}>
                    <Chip
                      color="primary"
                      label={`${selectedCount} ${t("Common.student")}`}
                      sx={{ fontWeight: 600 }}
                    />
                    <Button
                      onClick={handleDelete}
                      variant="outlined"
                      color="error"
                      size="small"
                      startIcon={<DeleteSweepIcon />}
                    >
                      {t("Common.delete")}
                    </Button>
                  </Stack>
                ) : (
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                      {t("Student.ImportDialog.plsReview")}
                    </Typography>
                    <Chip
                      size="small"
                      variant="outlined"
                      label={`${rows.length} ${t("Common.student")}`}
                    />
                  </Stack>
                )}
              </CardContent>
              <Divider />
              <Box
                className="font-siemreap"
                sx={{ height: 480, width: "100%" }}
              >
                <DataGrid
                  rows={rows}
                  columns={columns}
                  loading={isLoading}
                  hideFooterSelectedRowCount
                  disableRowSelectionOnClick
                  checkboxSelection
                  onRowSelectionModelChange={(newRowSelectionModel) => {
                    setRowSelectionModel(newRowSelectionModel);
                  }}
                  rowSelectionModel={rowSelectionModel}
                  processRowUpdate={processRowUpdate}
                  pageSizeOptions={[40]}
                  initialState={{
                    pagination: { paginationModel: { pageSize: 40 } },
                  }}
                  sx={{
                    border: 0,
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
          )}
        </DialogContent>

        <Divider />
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={handleClose} color="inherit">
            {t("Common.cancel")}
          </Button>
          <Tooltip
            title={!hasPreview ? t("Student.ImportDialog.noPreviewData") : ""}
            placement="top"
          >
            <span>
              <Button
                disabled={!hasPreview}
                variant="contained"
                startIcon={<SaveIcon />}
                onClick={() => setSaveConfirmDeleteDialogOpen(true)}
              >
                {selectedCount > 0
                  ? `${t("Common.save")} · ${selectedCount}`
                  : t("Common.save")}
              </Button>
            </span>
          </Tooltip>
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

      <AskForConfirmationDialog
        open={beforeUploadConfirmDialogOpen}
        onClose={() => setBeforeUploadConfirmDeleteDialogOpen(false)}
        onConfirm={uploadImageToAiRead}
        itemName="scores2"
        title={t("Common.titleBeforeUploadPhotoConfirm")}
        message={t("Common.beforeUploadPhotoConfirm", {
          count:
            rowSelectionModel.ids.size > 0
              ? rowSelectionModel.ids.size
              : rows.length,
        })}
        confirmText={t("Common.confirm")}
        cancelText={t("Common.cancel")}
      />
    </>
  );
};
