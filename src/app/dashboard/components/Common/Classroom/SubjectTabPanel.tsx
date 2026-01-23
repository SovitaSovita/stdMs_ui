import React, { useMemo } from "react";
import { StudentsInfo, StuInfoDetailResponseType } from "@/app/constants/type";
import CustomizedTreeView from "@/app/dashboard/components/CustomizedTreeView";
import {
  classroomAtom,
  studentsAtom,
  subjectsAtom,
} from "@/app/libs/jotai/classroomAtom";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import CancelIcon from "@mui/icons-material/Cancel";
import DeleteIcon from "@mui/icons-material/Delete";
import {
  Box,
  Button,
  Stack,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import Grid from "@mui/material/Grid";
import {
  DataGrid,
  GridActionsCellItem,
  GridColDef,
  GridRowId,
  GridRowSelectionModel,
  useGridApiRef,
} from "@mui/x-data-grid";
import dayjs from "dayjs";
import { useAtom, useAtomValue } from "jotai";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";
import SubjectService from "@/app/service/SubjectService";
import {
  SubjectResponse,
  SubjectUpsertRequest,
} from "@/app/constants/type/SubjectType";
import { showAlertAtom } from "@/app/libs/jotai/alertAtom";
import { DeleteConfirmationDialog } from "../../Dialog/DeleteConfirmationDialog";
import useNotifications from "@/app/libs/hooks/useNotifications/useNotifications";

export const SubjectTabPanel = () => {
  const { data: session, status }: { data: any; status: any } = useSession();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const notifications = useNotifications();
  const apiRef = useGridApiRef<any>();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const classroom = useAtomValue(classroomAtom);
  const t = useTranslations();
  const [subjects, setSubjects] = useAtom(subjectsAtom);

  useEffect(() => {
    if (subjects) {
      setRows(subjects);
    }
  }, [subjects]);

  const getSubjects = useCallback(async () => {
    if (classroom) {
      const result = await SubjectService.getByClassId(classroom.id);
      if (result.length > 0) {
        setSubjects(result);
      } else setSubjects([]);
    }
  }, [classroom?.id]);

  const [rowIdSelectionModel, setRowIdSelectionModel] = useState<GridRowId>();
  const [rows, setRows] = useState<SubjectResponse[]>([]);

  const handleAdd = () => {
    const tempId = `temp-${Date.now()}`;
    setRows((prev) => [
      ...prev,
      {
        id: tempId,
        name: "",
        nameEn: "",
        nameKh: "",
        teacherName: "",
        maxScore: 0.0,
        credit: "",
        description: "",
      },
    ]);
  };

  const handleDelete = async () => {
    const ids = rowIdSelectionModel as string;
    if (ids.length === 0) return;

    const tempIds = String(ids).startsWith("temp-");
    const dbIds = !String(ids).startsWith("temp-");

    // Remove unsaved (temp) rows immediately
    if (tempIds) {
      setRows((prev) => prev.filter((r) => ids !== r.id));
    }

    // Delete saved rows via API
    if (dbIds) {
      const result = await SubjectService.delete(ids);
      if (result?.status === 200) {
        setRows((prev) => prev.filter((r) => ids !== r.id));
        getSubjects();
        notifications.show(result?.message || "Deleted successfully.", {
          severity: "success",
          autoHideDuration: 3000,
        });
      } else {
        notifications.show("Failed to delete records.", {
          severity: "success",
          autoHideDuration: 3000,
        });
      }
    }
  };

  const columns = useMemo<GridColDef[]>(
    () => [
      {
        field: "id",
        headerName: t("CommonField.id"),
        headerClassName: "font-siemreap",
        width: 70,
        align: "center",
        headerAlign: "center",
        editable: false,
        filterable: false,
        sortable: true,
        disableColumnMenu: true,
        renderCell: (params) =>
          params.api.getRowIndexRelativeToVisibleRows(params.id) + 1,
      },
      {
        field: "name",
        headerName: t("CommonField.subject") + " (EN)",
        headerClassName: "font-siemreap",
        headerAlign: "left",
        align: "left",
        width: 150,
        editable: true,
        sortable: true,
        filterable: false,
        disableColumnMenu: true,
      },
      {
        field: "nameKh",
        headerName: t("CommonField.subject") + " (KH)",
        headerClassName: "font-siemreap",
        headerAlign: "left",
        align: "left",
        width: 150,
        editable: true,
        sortable: true,
        filterable: false,
        disableColumnMenu: true,
      },
      {
        field: "teacherName",
        headerName: t("CommonField.teacherName"),
        headerClassName: "font-siemreap",
        headerAlign: "left",
        align: "left",
        width: 150,
        editable: true,
        sortable: false,
        filterable: false,
        disableColumnMenu: true,
      },
      {
        field: "credit",
        type: "number",
        headerAlign: "center",
        align: "center",
        headerName: t("CommonField.credit"),
        headerClassName: "font-siemreap",
        width: 100,
        editable: true,
        sortable: true,
        filterable: false,
        disableColumnMenu: true,
      },
      {
        field: "maxScore",
        type: "number",
        headerAlign: "center",
        align: "center",
        headerName: t("CommonField.maxScore"),
        headerClassName: "font-siemreap",
        width: 120,
        editable: true,
        sortable: true,
        filterable: false,
        disableColumnMenu: true,
      },
      {
        field: "description",
        headerName: t("CommonField.description"),
        headerClassName: "font-siemreap",
        headerAlign: "center",
        align: "left",
        width: 240,
        editable: true,
        sortable: false,
        filterable: false,
        disableColumnMenu: true,
      },
      {
        field: "actions",
        type: "actions",
        width: 100,
        headerAlign: "right",
        align: "right",
        getActions: ({ id, row }) => {
          return [
            <GridActionsCellItem
              icon={<DeleteIcon color="error" />}
              label="Delete"
              onClick={() => {
                setRowIdSelectionModel(id);
                setDeleteDialogOpen(true);
              }}
            />,
          ];
        },
      },
    ],
    [handleDelete]
  );

  const processRowUpdate = async (
    newRow: SubjectResponse,
    oldRow: SubjectResponse,
    params: { rowId: GridRowId }
  ): Promise<SubjectResponse> => {
    setIsLoading(true);

    try {
      console.log(newRow);
      console.log(oldRow);
      if (
        newRow.name === oldRow.name &&
        newRow.nameKh === oldRow.nameKh &&
        newRow.teacherName === oldRow.teacherName &&
        newRow.maxScore === oldRow.maxScore &&
        newRow.credit === oldRow.credit &&
        newRow.description === oldRow.description
      ) {
        notifications.show(t("CommonValidate.noChange"), {
          severity: "info",
          autoHideDuration: 3000,
        });

        return oldRow;
      }
      // ✅ Detect new rows using a special tempId prefix
      const isTempRow = String(newRow.id).startsWith("temp-");

      if (!newRow.name) {
        notifications.show(t("CommonValidate.cannotEmpty"), {
          severity: "error",
          autoHideDuration: 3000,
        });
        return oldRow;
      }

      const sendData: SubjectUpsertRequest = {
        ...newRow,
        classId: classroom?.id,
      };

      // Remove id if new (backend will auto-generate one)
      if (isTempRow) delete (sendData as any).id;

      if (!sendData.classId) {
        setIsLoading(false);
        return oldRow;
      }

      const result = await SubjectService.upsert(sendData);

      if (result?.status === 200) {
        const updated = result?.payload;

        //Insern new
        if (isTempRow && updated?.id) {
          // Replace temp ID with real DB ID
          const newSubject = { ...newRow, id: updated.id };
          setRows((prev) =>
            prev.map((r) =>
              r.id === newRow.id ? { ...newRow, id: newSubject.id } : r
            )
          );
          getSubjects();
          notifications.show(result?.message || "Subject added successfully.", {
            severity: "success",
            autoHideDuration: 3000,
          });
          return newSubject;
        } else {
          //Update old
          setRows((prev) => prev.map((r) => (r.id === newRow.id ? newRow : r)));
          getSubjects();
          notifications.show(
            result?.message || "Subject Updated successfully.",
            {
              severity: "success",
              autoHideDuration: 3000,
            }
          );
          return newRow;
        }
      } else {
        notifications.show("Failed to save Subject.", {
          severity: "error",
          autoHideDuration: 3000,
        });
        return oldRow;
      }
    } catch (error) {
      console.error("processRowUpdate error:", error);
      return oldRow; // rollback
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      {/* ------------- */}
      <Box display={"flex"} mb={2} gap={1} justifyContent={"space-between"}>
        <Typography
          component="h2"
          variant="h6"
          sx={{ display: { xs: "none", sm: "block" } }}
        >
          {t("Common.subject")}
        </Typography>
        <Button
          onClick={handleAdd}
          variant="contained"
          size="small"
          startIcon={<AddIcon />}
        >
          {t("Common.add")}
        </Button>
      </Box>
      <Grid container spacing={2} columns={12}>
        <DataGrid
          apiRef={apiRef}
          rows={rows}
          columns={columns}
          initialState={{
            pagination: {
              paginationModel: {
                pageSize: 10,
              },
            },
          }}
          pageSizeOptions={[10, 15, 20, 50]}
          disableRowSelectionOnClick
          processRowUpdate={processRowUpdate}
        />
      </Grid>

      <DeleteConfirmationDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDelete}
        itemName="subjects"
        title={t("Common.titleDeleteConfirm")}
        message={t("Common.deleteConfirmation", {
          subject: t("Common.subject"),
        })}
        confirmText={t("Common.delete")}
        cancelText={t("Common.cancel")}
      />
    </div>
  );
};
