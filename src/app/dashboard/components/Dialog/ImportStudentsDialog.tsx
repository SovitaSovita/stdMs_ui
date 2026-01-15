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
import dayjs from "dayjs";

const IGNORED_HEADERS = ["no", "no.", "ល.រ", "លរ"];

type ImportStudentsDialogProps = {};

export const ImportStudentsDialog = (props: ImportStudentsDialogProps) => {
  const {} = props;
  const [open, setOpen] = React.useState(false);
  const classroom = useAtomValue(classroomAtom);
  const t = useTranslations();

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
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
          const previewRows = response?.payload?.rows || [];

          if (previewRows.length > 0) {
            setColumns(buildColumnsFromPreview(previewRows));
            setRows(normalizeRows(previewRows));
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

  // const processRowUpdate = async (
  //   newRow: StudentsInfo,
  //   oldRow: StudentsInfo,
  //   params: { rowId: GridRowId }
  // ): Promise<StudentsInfo> => {
  //   setIsLoading(true);

  //   try {
  //     // ✅ Detect new rows using a special tempId prefix
  //   } catch (error) {
  //     console.error("processRowUpdate error:", error);
  //     return oldRow; // rollback
  //   } finally {
  //     setIsLoading(false);
  //   }
  // };

  const buildColumnsFromPreview = (
    rows: Array<Record<string, string>>
  ): GridColDef[] => {
    if (!rows.length) return [];

    return Object.keys(rows[0])
      .filter(
        (key) => (key && key.trim() !== "") || key === "ID" || key === "Name"
      )
      .map((key) => ({
        field: key,
        headerName: key,
        width: 150,
        sortable: false,
        editable: false,
        disableColumnMenu: true,
        headerClassName: "font-siemreap",
        cellClassName: "font-siemreap",
      }));
  };

  const normalizeRows = (rows: Array<Record<string, string>>) => {
    return rows.map((row, index) => ({
      id: index + 1,
      ...row,
    }));
  };

  const handleSave = async () => {
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
          const response = await StudentService.excelImport(
            file,
            classroom?.id || ""
          );
          notification.show(response?.message || t("Common.success"), {
            severity: "success",
            autoHideDuration: 3000,
          });
          handleClose();
        }
      };
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
      <Dialog open={open} onClose={handleClose} fullWidth maxWidth="lg">
        <DialogTitle>{t("Student.DialogInsert.title")}</DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 2 }} display="flex" justifyContent="flex-end">
            <Button
              onClick={uploadFileExcel}
              variant="contained"
              size="small"
              startIcon={<DriveFolderUploadIcon />}
            >
              {t("Common.import")}
            </Button>
          </Box>
          {/* Form fields would go here */}
          <Box className="font-siemreap" sx={{ height: 600, width: "100%" }}>
            <DataGrid
              rows={rows}
              columns={columns}
              loading={isLoading}
              hideFooterSelectedRowCount
              disableRowSelectionOnClick
              checkboxSelection={false}
              pageSizeOptions={[40]}
              initialState={{
                pagination: { paginationModel: { pageSize: 15 } },
              }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>{t("Common.cancel")}</Button>
          <Button onClick={handleSave}>{t("Common.save")}</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};
