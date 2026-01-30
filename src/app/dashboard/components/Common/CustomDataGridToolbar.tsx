import * as React from "react";
import {
  ColumnsPanelTrigger,
  DataGrid,
  ExportCsv,
  ExportPrint,
  GridDensity,
  GridSearchIcon,
  QuickFilter,
  QuickFilterClear,
  QuickFilterControl,
  QuickFilterTrigger,
  Toolbar,
  ToolbarButton,
  useGridApiContext,
} from "@mui/x-data-grid";
import SearchIcon from "@mui/icons-material/Search";
import CancelIcon from "@mui/icons-material/Cancel";
import clsx from "clsx";
import ViewColumnIcon from "@mui/icons-material/ViewColumn";
import SettingsIcon from "@mui/icons-material/Settings";
import CheckIcon from "@mui/icons-material/Check";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Divider from "@mui/material/Divider";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import { DENISTY_OPTIONS } from "@/app/utils/axios/Common";
import { Settings, ToolbarProps } from "@/app/constants/type";
import { Box, InputAdornment, styled, TextField, Tooltip } from "@mui/material";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import { useTranslations } from "next-intl";
import ExcelJS, { Column } from "exceljs";
import { saveAs } from "file-saver";
import { useAtomValue } from "jotai";
import { classroomAtom } from "@/app/libs/jotai/classroomAtom";

declare module "@mui/x-data-grid" {
  interface ToolbarPropsOverrides {
    settings: Settings;
    onSettingsChange: React.Dispatch<React.SetStateAction<Settings>>;
    toolbarButtons?: {
      toolbarClass?: string;
      settings?: boolean;
      export?: boolean;
      toggleColumn?: boolean;
      search?: boolean;
      extraControls?: React.ReactNode;
    };
  }
}

type OwnerState = {
  expanded: boolean;
};

const StyledQuickFilter = styled(QuickFilter)({
  display: "grid",
  alignItems: "center",
});

const StyledToolbarButton = styled(ToolbarButton)<{ ownerState: OwnerState }>(
  ({ theme, ownerState }) => ({
    gridArea: "1 / 1",
    width: "min-content",
    height: "min-content",
    zIndex: 1,
    opacity: ownerState.expanded ? 0 : 1,
    pointerEvents: ownerState.expanded ? "none" : "auto",
    transition: theme.transitions.create(["opacity"]),
  }),
);

const StyledTextField = styled(TextField)<{
  ownerState: OwnerState;
}>(({ theme, ownerState }) => ({
  gridArea: "1 / 1",
  overflowX: "clip",
  width: ownerState.expanded ? 260 : "var(--trigger-width)",
  opacity: ownerState.expanded ? 1 : 0,
  transition: theme.transitions.create(["width", "opacity"]),
}));

export function CustomDataGridToolbar(props: ToolbarProps) {
  const { settings, onSettingsChange, toolbarButtons = {} } = props;
  // console.log(toolbarButtons);

  // 1. Get the Grid API Context
  // This allows us to access the rows currently inside the DataGrid
  const apiRef = useGridApiContext();
  const classroom = useAtomValue(classroomAtom);

  const [settingsMenuOpen, setSettingsMenuOpen] = React.useState(false);
  const settingsMenuTriggerRef = React.useRef<HTMLButtonElement>(null);

  const [exportMenuOpen, setExportMenuOpen] = React.useState(false);
  const exportMenuTriggerRef = React.useRef<HTMLButtonElement>(null);

  const t = useTranslations();

  const handleExportExcel = async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Exam Scores");

    // --- 1. DEFINE COLUMNS ---
    const columns: Partial<Column>[] = apiRef.current
      .getAllColumns()
      .filter((col) => col.field !== "__check__" && col.field !== "actions") // Filter out checkboxes and action buttons
      .map((col) => {
        let customWidth = 10; // Default fallback

        if (col.field === "fullName") {
          customWidth = 30; // 'fullName'
        } else if (col.field === "orderNo" || col.field === "gender") {
          customWidth = 5; // 'orderNo', 'gender'
        } else if (
          col.field === "totalScore" ||
          col.field === "average" ||
          col.field === "mRanking" ||
          col.field === "mGrade"
        ) {
          customWidth = 10; // 'orderNo', 'gender'
        } else if (col.width) {
          customWidth = col.width / 10 - 1;
        }

        return {
          header: col.headerName || "",
          key: col.field,
          width: customWidth,
          style: {
            alignment: {
              horizontal: col.align || "left",
            },
          },
        };
      });

    // console.log(columns);
    worksheet.columns = columns;

    // --- 3. INSERT TITLE ROWS ---
    // We insert rows at the top (index 1). This pushes the existing Header Row down to Row 5.

    // Insert Row 1 (Kingdom) -> Header moves to Row 2
    worksheet.insertRow(1, ["ព្រះរាជាណាចក្រកម្ពុជា"]);
    // Insert Row 2 (Nation) -> Header moves to Row 3
    worksheet.insertRow(2, ["ជាតិ សាសនា ព្រះមហាក្សត្រ"]);
    // Insert Row 3 (Symbol) -> Header moves to Row 4
    worksheet.insertRow(3, ["ÓÓÓ"]);
    // Insert Row 4 (Title) -> Header moves to Row 5 (Correct Position!)
    worksheet.insertRow(4, [
      `បញ្ជីពិន្ទុ និងចំណាត់ថ្នាក់ សិស្សថ្នាក់ទី ${classroom?.name} ខែ ...`,
    ]);

    // --- 4. MERGE TITLE CELLS ---
    worksheet.mergeCells(1, 1, 1, columns.length);
    worksheet.mergeCells(2, 1, 2, columns.length);
    worksheet.mergeCells(3, 1, 3, columns.length);
    worksheet.mergeCells(4, 1, 4, columns.length);

    // --- 5. ADD DATA ---
    const rowIds = apiRef.current.getSortedRowIds();
    const rowsToExport = rowIds.map((id) => apiRef.current.getRow(id));

    rowsToExport.forEach((row, index) => {
      const rowData: any = {
        orderNo: index + 1,
        fullName: row.fullName,
        gender: row.gender,
        totalScore: row.totalScore,
        average: row.average,
        mRanking: row.mRanking,
        mGrade: row.mGrade,
      };

      //When TAB Averaga Of Semesterly
      if (row?.monthlyAverage) {
        Object.keys(row.monthlyAverage).forEach((monthlyAverage) => {
          rowData["totalAverage"] = row.totalAverage;
          rowData[monthlyAverage] = Number(
            row.monthlyAverage[monthlyAverage] || 0,
          ).toFixed(2);
        });
      }

      //When TAB Monthly and also បញ្ជីស្រង់ពិន្ទុឆមាស
      if (row?.scores) {
        Object.keys(row.scores).forEach((subject) => {
          rowData[subject] = row.scores[subject];
          rowData[subject + "_Rank"] = row[subject + "_rank"]; ////When TAB បញ្ជីស្រង់ពិន្ទុឆមាស
        });
      }
      // console.log("rowData", rowData);
      worksheet.addRow(rowData);
    });

    // --- 6. STYLING ---

    // Style Title Rows (1-4)
    [1, 2, 4].forEach((rowNum) => {
      const row = worksheet.getRow(rowNum);
      row.font = {
        name: "Khmer OS Muol Light",
        bold: true,
        size: rowNum === 4 ? 12 : 14,
      };
      row.alignment = { vertical: "middle", horizontal: "center" };
      row.height = rowNum === 4 ? 30 : 25;
    });
    worksheet.getRow(3).alignment = {
      horizontal: "center",
      vertical: "middle",
    };

    // Style Table Header (At Row 5)
    const headerRow = worksheet.getRow(5);
    headerRow.height = 30;
    headerRow.eachCell((cell) => {
      cell.font = {
        name: "Khmer OS Muol Light",
        bold: true,
        size: 10,
        color: { argb: "FF000000" },
      };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFD3D3D3" },
      };
      cell.alignment = {
        vertical: "middle",
        horizontal: "center",
        wrapText: true,
      };
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
    });

    // Style Data Rows (Row 6 onwards)
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber <= 5) return;

      //If Grade F
      // const gradeCellVal = row.getCell("mGrade").value?.toString();
      // const isFailing = !["A", "B", "C"].includes(gradeCellVal || "");

      row.eachCell((cell, colNumber) => {
        const column = worksheet.getColumn(colNumber);
        const columnKey = column.key as string;

        cell.font = {
          name: "Khmer OS Battambang",
          family: 4,
          size: 10,
          color: ["average", "mRanking", "mGrade"].includes(columnKey)
            ? { argb: "FFFF0000" }
            : { argb: "FF000000" },
        };

        cell.alignment = {
          vertical: "middle",
          horizontal: column.alignment?.horizontal || "left",
        };

        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };
      });
    });

    // Export
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    saveAs(
      blob,
      `${t("MonthlyExam.monthlyScores")}_${new Date().toISOString().split("T")[0]}.xlsx`,
    );
  };

  return (
    <Toolbar className={`${toolbarButtons?.toolbarClass || ""}`}>
      {toolbarButtons?.extraControls && (
        <Box
          sx={{
            ml: 1,
            my: 1,
            display: "flex",
            alignItems: "center",
            gap: 2,
            flex: 1,
          }}
        >
          {toolbarButtons.extraControls}
        </Box>
      )}

      {toolbarButtons?.search && (
        <StyledQuickFilter>
          <QuickFilterTrigger
            render={(triggerProps, state) => (
              <Tooltip title={t("Common.search")} enterDelay={0}>
                <StyledToolbarButton
                  {...triggerProps}
                  ownerState={{ expanded: state.expanded }}
                  color="default"
                  aria-disabled={state.expanded}
                >
                  <SearchIcon fontSize="small" />
                </StyledToolbarButton>
              </Tooltip>
            )}
          />
          <QuickFilterControl
            render={({ ref, ...controlProps }, state) => (
              <StyledTextField
                {...controlProps}
                ownerState={{ expanded: state.expanded }}
                inputRef={ref}
                aria-label="Search"
                placeholder="Search..."
                size="small"
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon fontSize="small" />
                      </InputAdornment>
                    ),
                    endAdornment: state.value ? (
                      <InputAdornment position="end">
                        <QuickFilterClear
                          edge="end"
                          size="small"
                          aria-label="Clear search"
                          material={{ sx: { marginRight: -0.75 } }}
                        >
                          <CancelIcon fontSize="small" />
                        </QuickFilterClear>
                      </InputAdornment>
                    ) : null,
                    ...controlProps.slotProps?.input,
                  },
                  ...controlProps.slotProps,
                }}
              />
            )}
          />
        </StyledQuickFilter>
      )}

      {toolbarButtons?.settings && (
        <>
          <ToolbarButton
            ref={settingsMenuTriggerRef}
            id="settings-menu-trigger"
            aria-controls="settings-menu"
            aria-haspopup="true"
            aria-expanded={settingsMenuOpen ? "true" : undefined}
            onClick={() => setSettingsMenuOpen(true)}
          >
            <SettingsIcon fontSize="small" sx={{ ml: "auto" }} />
          </ToolbarButton>
          <Menu
            id="settings-menu"
            anchorEl={settingsMenuTriggerRef.current}
            open={settingsMenuOpen}
            onClose={() => setSettingsMenuOpen(false)}
            anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
            transformOrigin={{ vertical: "top", horizontal: "right" }}
            slotProps={{
              list: {
                "aria-labelledby": "settings-menu-trigger",
              },
            }}
          >
            {DENISTY_OPTIONS.map((option) => (
              <MenuItem
                key={option.value}
                onClick={() =>
                  onSettingsChange((currentSettings) => ({
                    ...currentSettings,
                    density: option.value,
                  }))
                }
              >
                <ListItemIcon>
                  {settings.density === option.value && (
                    <CheckIcon fontSize="small" />
                  )}
                </ListItemIcon>
                <ListItemText>{option.label}</ListItemText>
              </MenuItem>
            ))}
            <Divider />
            <MenuItem
              onClick={() =>
                onSettingsChange((currentSettings) => ({
                  ...currentSettings,
                  showColumnBorders: !currentSettings.showColumnBorders,
                }))
              }
            >
              <ListItemIcon>
                {settings.showColumnBorders && <CheckIcon fontSize="small" />}
              </ListItemIcon>
              <ListItemText>Show column borders</ListItemText>
            </MenuItem>
            <MenuItem
              onClick={() =>
                onSettingsChange((currentSettings) => ({
                  ...currentSettings,
                  showCellBorders: !currentSettings.showCellBorders,
                }))
              }
            >
              <ListItemIcon>
                {settings.showCellBorders && <CheckIcon fontSize="small" />}
              </ListItemIcon>
              <ListItemText>Show cell borders</ListItemText>
            </MenuItem>
          </Menu>
        </>
      )}

      {toolbarButtons?.export && (
        <>
          <Tooltip title={t("Common.download")}>
            <ToolbarButton
              ref={exportMenuTriggerRef}
              id="export-menu-trigger"
              aria-controls="export-menu"
              aria-haspopup="true"
              aria-expanded={exportMenuOpen ? "true" : undefined}
              onClick={() => setExportMenuOpen(true)}
            >
              <FileDownloadIcon fontSize="small" />
            </ToolbarButton>
          </Tooltip>
          <Menu
            id="export-menu"
            anchorEl={exportMenuTriggerRef.current}
            open={exportMenuOpen}
            onClose={() => setExportMenuOpen(false)}
            anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
            transformOrigin={{ vertical: "top", horizontal: "right" }}
            slotProps={{
              list: {
                "aria-labelledby": "export-menu-trigger",
              },
            }}
          >
            <ExportPrint
              render={<MenuItem />}
              onClick={() => setExportMenuOpen(false)}
            >
              {t("Common.print")}
            </ExportPrint>
            {/* CUSTOM EXCEL OPTION (Replaces ExportCsv) */}
            <MenuItem onClick={handleExportExcel}>
              {t("Common.downloadExcel")}
            </MenuItem>
            {/* Available to MUI X Premium users */}
            {/* <ExportExcel render={<MenuItem />}>
          Download as Excel
        </ExportExcel> */}
          </Menu>
        </>
      )}

      {toolbarButtons?.toggleColumn && (
        <Tooltip title="Columns">
          <ColumnsPanelTrigger render={<ToolbarButton />}>
            <ViewColumnIcon fontSize="small" />
          </ColumnsPanelTrigger>
        </Tooltip>
      )}
    </Toolbar>
  );
}
