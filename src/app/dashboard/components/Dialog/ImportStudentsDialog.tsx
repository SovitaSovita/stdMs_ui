import React, { useState } from "react";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import {
  Box,
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
import { StudentsInfo, StudentsRequestUpsertType } from "@/app/constants/type";
import StudentService from "@/app/service/StudentService";
import { classroomAtom } from "@/app/libs/jotai/classroomAtom";
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

type ImportStudentsDialogProps = {};

export const ImportStudentsDialog = (props: ImportStudentsDialogProps) => {
  const {} = props;
  const [open, setOpen] = React.useState(false);
  const classroom = useAtomValue(classroomAtom);
  const t = useTranslations();
  const [file, setFile] = useState<File | null>(null);
  const { refetch } = useClassroomData(classroom);

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    handleClear();
    setOpen(false);
  };

  const [columns, setColumns] = useState<GridColDef[]>([]);
  const [rows, setRows] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [rowSelectionModel, setRowSelectionModel] =
    useState<GridRowSelectionModel>({
      type: "include", // or 'exclude'
      ids: new Set<GridRowId>([]),
    });
  const notification = useNotifications();

  const uploadFileExcel = async () => {
    try {
      setIsLoading(true);
      const input = document.createElement("input");
      input.type = "file";
      input.accept =
        ".xls,.xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel";
      input.click();

      input.onchange = async () => {
        if (input.files && input.files[0]) {
          const file = input.files[0];
          const response = await StudentService.excelPreview(file);
          if (response?.status !== 200) {
            notification.show(response?.message || t("Common.errorOccurred"), {
              severity: "error",
              autoHideDuration: 5000,
            });
            setIsLoading(false);
            return;
          }
          const previewRows = response?.payload?.rows || [];

          if (previewRows.length > 0) {
            // Get Excel headers
            const excelHeaders = Object.keys(previewRows[0]).filter(
              (key) => key && key.trim() !== ""
            );

            // Validate headers against accepted aliases
            const headerValidation = validateHeaders(excelHeaders, [
              "fullName",
              "gender",
              // "dateOfBirth",
              // "idCard",
              // "address",
              // "fatherName",
              // "fatherOccupation",
              // "montherName",
              // "montherOccupation",
              // "placeOfBirth",
            ]);

            if (!headerValidation.isValid) {
              notification.show(
                `Invalid headers: ${headerValidation.errors.join(", ")}`,
                {
                  severity: "error",
                  autoHideDuration: 5000,
                }
              );
              setIsLoading(false);
              return;
            }

            // Filter headers - only include those that match accepted aliases
            const acceptedHeaders = excelHeaders.filter((header) => {
              const mappedField = matchHeaderToField(header);
              return mappedField !== null;
            });

            // Create columns with mapped field names - only for accepted headers
            const newColObjectKeys = [
              {
                field: "no",
                headerName: t("CommonField.id"),
                headerClassName: "font-siemreap",
                width: 60,
                editable: false,
                sortable: false,
                disableColumnMenu: true,
                renderCell: (params: any) =>
                  params.api.getRowIndexRelativeToVisibleRows(params.id) + 1,
              },
              ...acceptedHeaders.map((header) => {
                return {
                  field: header as string,
                  headerName: header,
                  width: 150,
                  sortable: false,
                  editable: false,
                  disableColumnMenu: true,
                  headerClassName: "font-siemreap",
                  cellClassName: "font-siemreap",
                };
              }),
            ];

            setFile(file);
            setColumns(newColObjectKeys);
            setRows(normalizeRows(previewRows));

            // Show success message with detected headers
            const rejectedCount = excelHeaders.length - acceptedHeaders.length;
            let message = `Successfully loaded ${acceptedHeaders.length} columns and ${previewRows.length} rows`;
            if (rejectedCount > 0) {
              message += ` (${rejectedCount} unknown columns ignored)`;
            }
            notification.show(message, {
              severity: "success",
              autoHideDuration: 3000,
            });
          }
        }
      };
    } catch (error) {
      console.error("uploadFileExcel error:", error);
      notification.show(t("Common.errorOccurred"), {
        severity: "error",
        autoHideDuration: 3000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    setFile(null);
    setRows([]);
    setColumns([]);
  };

  const normalizeRows = (rows: Array<Record<string, string>>) => {
    return rows.map((row, index) => ({
      id: index + 1,
      ...row,
    }));
  };

  const handleSave = async () => {
    try {
      if (!file) {
        notification.show(t("Student.ImportDialog.noFileSelected"), {
          severity: "warning",
          autoHideDuration: 3000,
        });
        return;
      }
      setIsLoading(true);
      if (file && classroom?.id) {
        const response = await StudentService.excelImport(file, classroom?.id);

        if (!response?.status) {
          notification.show(response?.message || t("Common.errorOccurred"), {
            severity: "error",
            autoHideDuration: 5000,
          });
          return;
        }

        notification.show(response?.message || t("Common.success"), {
          severity: "success",
          autoHideDuration: 3000,
        });
        refetch.fetchStudents();
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

  return (
    <>
      <Button
        onClick={handleClickOpen}
        variant="contained"
        size="small"
        startIcon={<DriveFolderUploadIcon />}
      >
        {t("Student.btn.ExcelImport")}
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
                      rows: rows.length,
                    })}
                  </Typography>
                </Box>
                <Box sx={{ display: "flex", gap: "8px" }}>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={uploadFileExcel}
                  >
                    {t("Student.ImportDialog.replaceFile")}
                  </Button>
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
                      {t("Student.ImportDialog.proTipText")}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </Box>
          </Box>

          <Box mt={2} display="flex" justifyContent="space-between" gap={2}>
            <Typography variant="caption" component="div" fontWeight={600} color="info">
              {t("Student.ImportDialog.noteInfoBeforeImport")}
            </Typography>
            <Button variant="contained" color="error" onClick={handleClear}>{t("Common.clear")}</Button>
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
              checkboxSelection={false}
              pageSizeOptions={[40]}
              initialState={{
                pagination: { paginationModel: { pageSize: 40 } },
              }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>{t("Common.cancel")}</Button>
          <Button variant="contained" onClick={handleSave}>{t("Common.save")}</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};
