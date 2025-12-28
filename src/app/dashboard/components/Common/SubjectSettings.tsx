"use client";

import * as React from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Tooltip from "@mui/material/Tooltip";
import {
  DataGrid,
  GridActionsCellItem,
  GridColDef,
  GridFilterModel,
  GridPaginationModel,
  GridSortModel,
  GridEventListener,
  gridClasses,
  GridRowId,
  GridRowModesModel,
  GridRowModes,
  useGridApiRef,
} from "@mui/x-data-grid";
import AddIcon from "@mui/icons-material/Add";
import RefreshIcon from "@mui/icons-material/Refresh";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import { useDialogs } from "@/app/libs/hooks/useDialogs/useDialogs";
import useNotifications from "@/app/libs/hooks/useNotifications/useNotifications";
import {
  SubjectResponse,
  SubjectUpsertRequest,
} from "@/app/constants/type/SubjectType";
import SubjectService from "@/app/service/SubjectService";
import { classroomAtom } from "@/app/libs/jotai/classroomAtom";
import { useAtomValue } from "jotai";
import { useTranslations } from "next-intl";
import SaveIcon from "@mui/icons-material/Save";
import CancelIcon from "@mui/icons-material/Cancel";

const INITIAL_PAGE_SIZE = 10;

export default function SubjectSettings() {
  const dialogs = useDialogs();
  const notifications = useNotifications();
  const classroom = useAtomValue(classroomAtom);
  const t = useTranslations();
  const apiRef = useGridApiRef<any>();
  const [rows, setRows] = React.useState<SubjectResponse[]>([]);

  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);

  const loadData = React.useCallback(async () => {
    setError(null);
    setIsLoading(true);

    try {
      if (!classroom?.id) return;
      const result = await SubjectService.getByClassId(classroom.id);
      if (result) {
        setRows(result);
      }
    } catch (listDataError) {
      setError(listDataError as Error);
    } finally {
      setIsLoading(false);
    }
  }, [classroom]);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRowClick = React.useCallback<GridEventListener<"rowClick">>(
    ({ row }) => {
      //   navigate(`/subjects/${row.id}`);
    },
    []
  );

  const handleRowDelete = React.useCallback(
    (subject: SubjectResponse) => async () => {
      const confirmed = await dialogs.confirm(
        `Do you wish to delete ${subject.name}?`,
        {
          title: `Delete subject?`,
          severity: "error",
          okText: "Delete",
          cancelText: "Cancel",
        }
      );

      if (confirmed) {
        setIsLoading(true);
        try {
          await SubjectService.delete(subject?.id);

          notifications.show("subject deleted successfully.", {
            severity: "success",
            autoHideDuration: 3000,
          });
          loadData();
        } catch (deleteError) {
          notifications.show(
            `Failed to delete subject. Reason:' ${
              (deleteError as Error).message
            }`,
            {
              severity: "error",
              autoHideDuration: 3000,
            }
          );
        }
        setIsLoading(false);
      }
    },
    [dialogs, notifications, loadData]
  );

  const initialState = React.useMemo(
    () => ({
      pagination: { paginationModel: { pageSize: INITIAL_PAGE_SIZE } },
    }),
    []
  );

  //click to focus row -> name
  const handleRowEdit = (row: SubjectResponse) => () => {
    apiRef.current.startRowEditMode({ id: row.id });
    apiRef.current.setCellFocus(row.id, "name");
  };

  const columns = React.useMemo<GridColDef[]>(
    () => [
      { field: "id", headerName: t("CommonField.code") },
      {
        field: "name",
        headerName: t("CommonField.subject"),
        width: 140,
        editable: true,
      },
      {
        field: "actions",
        type: "actions",
        flex: 1,
        align: "right",
        getActions: ({ id, row }) => [
          <GridActionsCellItem
            key="edit-item"
            icon={<EditIcon color="info"/>}
            label="Edit"
            onClick={handleRowEdit(row)}
          />,
          <GridActionsCellItem
            key="delete-item"
            icon={<DeleteIcon color="error"/>}
            label="Delete"
            onClick={handleRowDelete(row)}
          />,
        ],
      },
    ],
    [handleRowEdit, handleRowDelete]
  );

  const processRowUpdate = async (
    newRow: SubjectResponse,
    oldRow: SubjectResponse,
    params: { rowId: GridRowId }
  ): Promise<SubjectResponse> => {
    setIsLoading(true);

    try {
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

      if (!sendData.classId) {
        setIsLoading(false);
        return oldRow;
      }

      const result = await SubjectService.upsert(sendData);

      if (result?.status === 200) {
        const updated = result?.payload;

        //Insern new
        if (updated?.id) {
          // Replace temp ID with real DB ID
          loadData();
          notifications.show("New subject insert successfully.", {
            severity: "success",
            autoHideDuration: 3000,
          });
          return newRow;
        } else {
          //Update old
          loadData();
          notifications.show("Subject Updated successfully.", {
            severity: "success",
            autoHideDuration: 3000,
          });
          return newRow;
        }
      } else {
        notifications.show("Failed to save student.", {
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
    <Box sx={{ flex: 1, width: "100%" }}>
      {error ? (
        <Box sx={{ flexGrow: 1 }}>
          <Alert severity="error">{error.message}</Alert>
        </Box>
      ) : (
        <DataGrid
          apiRef={apiRef}
          rows={rows}
          columns={columns}
          disableRowSelectionOnClick
          onRowClick={handleRowClick}
          loading={isLoading}
          initialState={initialState}
          processRowUpdate={processRowUpdate}
          editMode="row"
          sx={{
            [`& .${gridClasses.columnHeader}, & .${gridClasses.cell}`]: {
              outline: "transparent",
            },
            [`& .${gridClasses.columnHeader}:focus-within, & .${gridClasses.cell}:focus-within`]:
              {
                outline: "none",
              },
            [`& .${gridClasses.row}:hover`]: {
              cursor: "pointer",
            },
            "& .MuiDataGrid-footerContainer": {
              display: "none",
            },
          }}
          slotProps={{
            loadingOverlay: {
              variant: "circular-progress",
              noRowsVariant: "circular-progress",
            },
            baseIconButton: {
              size: "small",
            },
          }}
        />
      )}
    </Box>
  );
}
