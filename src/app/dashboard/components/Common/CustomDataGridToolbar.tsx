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
import dayjs from "dayjs";
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
      /** Title row written to the Excel export (e.g. "Monthly Scores · Jan 2024") */
      exportTitle?: string;
      /** Optional file name (without extension). Defaults to "<classroom>_<date>". */
      exportFileName?: string;
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
    const worksheet = workbook.addWorksheet("Export");

    // --- 1. DEFINE COLUMNS (dynamic from the grid's visible columns) ---
    const visibleColumns = apiRef.current
      .getAllColumns()
      .filter(
        (col) =>
          col.field !== "__check__" &&
          col.field !== "actions" &&
          col.type !== "actions",
      );

    const columns: Partial<Column>[] = visibleColumns.map((col) => {
      let customWidth = 10; // default
      if (col.field === "fullName") {
        customWidth = 30;
      } else if (col.field === "orderNo" || col.field === "gender") {
        customWidth = 5;
      } else if (col.width) {
        customWidth = Math.max(8, col.width / 10 - 1);
      }
      return {
        header: col.headerName || col.field,
        key: col.field,
        width: customWidth,
        style: {
          alignment: { horizontal: col.align || "left" },
        },
      };
    });

    worksheet.columns = columns;

    // --- 2. INSERT TITLE ROWS ---
    // Layout:
    //   Row 1: Kingdom of Cambodia (Khmer formal header)
    //   Row 2: National motto
    //   Row 3: Decorative symbol
    //   Row 4: Custom export title (e.g. "Monthly Scores · Jan 2024") — only when provided
    //   Row N: Classroom context line ("Classroom 12B • Grade 12 • Year 2024")
    //   Row N+1: column headers
    const classroomLine = classroom
      ? [
          classroom.name && `${t("Common.classroom")} ${classroom.name}`,
          classroom.grade && `${t("Common.grade")} ${classroom.grade}`,
          classroom.year && `${t("Common.studyYear")} ${classroom.year}`,
        ]
          .filter(Boolean)
          .join(" • ")
      : "";

    const customTitle = toolbarButtons?.exportTitle?.trim();

    worksheet.insertRow(1, ["ព្រះរាជាណាចក្រកម្ពុជា"]);
    worksheet.insertRow(2, ["ជាតិ សាសនា ព្រះមហាក្សត្រ"]);
    worksheet.insertRow(3, ["☘ ☘ ☘"]);

    let titleRowIdx: number | null = null;
    let classroomRowIdx = 4;
    if (customTitle) {
      titleRowIdx = 4;
      classroomRowIdx = 5;
      worksheet.insertRow(titleRowIdx, [customTitle]);
    }
    worksheet.insertRow(classroomRowIdx, [classroomLine]);

    // Header row is the row right after classroom info
    const headerRowIdx = classroomRowIdx + 1;

    worksheet.mergeCells(1, 1, 1, columns.length);
    worksheet.mergeCells(2, 1, 2, columns.length);
    worksheet.mergeCells(3, 1, 3, columns.length);
    if (titleRowIdx !== null) {
      worksheet.mergeCells(titleRowIdx, 1, titleRowIdx, columns.length);
    }
    worksheet.mergeCells(
      classroomRowIdx,
      1,
      classroomRowIdx,
      columns.length,
    );

    // --- 3. ADD DATA (extract every column, not a hardcoded list) ---
    const rowIds = apiRef.current.getSortedRowIds();
    rowIds.forEach((id, index) => {
      const row = apiRef.current.getRow(id);
      const rowData: Record<string, unknown> = {};

      visibleColumns.forEach((col) => {
        const field = col.field;

        // orderNo is typically rendered via index, not stored on the row
        if (field === "orderNo") {
          const stored = row?.[field];
          rowData[field] =
            stored !== undefined && stored !== null && stored !== ""
              ? stored
              : index + 1;
          return;
        }

        // Use cell params to respect both valueGetter and valueFormatter.
        // formattedValue is what the cell visually displays — perfect for export.
        let value: unknown;
        try {
          const params = apiRef.current.getCellParams(id, field);
          value =
            params?.formattedValue !== undefined
              ? params.formattedValue
              : params?.value;
        } catch {
          value = row?.[field];
        }

        // Convert remaining Date objects to a readable string
        if (value instanceof Date) {
          value = dayjs(value).format("DD-MM-YYYY");
        }

        rowData[field] = value ?? "";
      });

      // Exam grids hold per-subject scores under `row.scores` and
      // monthly averages under `row.monthlyAverage`. Only fill these
      // when the corresponding column actually exists on the grid.
      if (row?.scores) {
        Object.keys(row.scores).forEach((subject) => {
          if (rowData[subject] === undefined || rowData[subject] === "") {
            rowData[subject] = row.scores[subject];
          }
          const rankField = `${subject}_Rank`;
          if (
            (rowData[rankField] === undefined || rowData[rankField] === "") &&
            row[`${subject}_rank`] !== undefined
          ) {
            rowData[rankField] = row[`${subject}_rank`];
          }
        });
      }
      if (row?.monthlyAverage) {
        Object.keys(row.monthlyAverage).forEach((key) => {
          if (rowData[key] === undefined || rowData[key] === "") {
            rowData[key] = Number(row.monthlyAverage[key] || 0).toFixed(2);
          }
        });
      }

      worksheet.addRow(rowData);
    });

    // --- 6. STYLING ---

    // Kingdom + Nation rows (formal header)
    [1, 2].forEach((rowNum) => {
      const row = worksheet.getRow(rowNum);
      row.font = {
        name: "Khmer OS Muol Light",
        bold: true,
        size: 14,
      };
      row.alignment = { vertical: "middle", horizontal: "center" };
      row.height = 25;
    });

    // Decorative symbol row
    worksheet.getRow(3).alignment = {
      horizontal: "center",
      vertical: "middle",
    };

    // Custom export title (bigger, bolder than the classroom subtitle)
    if (titleRowIdx !== null) {
      const titleRow = worksheet.getRow(titleRowIdx);
      titleRow.font = {
        name: "Khmer OS Muol Light",
        bold: true,
        size: 14,
        color: { argb: "FF1976D2" },
      };
      titleRow.alignment = { vertical: "middle", horizontal: "center" };
      titleRow.height = 32;
    }

    // Classroom subtitle row
    const classroomRow = worksheet.getRow(classroomRowIdx);
    classroomRow.font = {
      name: "Khmer OS Muol Light",
      bold: true,
      size: 12,
    };
    classroomRow.alignment = { vertical: "middle", horizontal: "center" };
    classroomRow.height = 28;

    // Style Table Header
    const headerRow = worksheet.getRow(headerRowIdx);
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

    // Style Data Rows (rows after the header)
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber <= headerRowIdx) return;

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
          color: [
            "average",
            "mRanking",
            "mGrade",
            "tRanking",
            "tGrade",
          ].includes(columnKey)
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
    const today = new Date().toISOString().split("T")[0];
    const fileBase =
      toolbarButtons?.exportFileName?.trim() ||
      (classroom?.name ? `${classroom.name}_${today}` : `Export_${today}`);
    saveAs(blob, `${fileBase}.xlsx`);
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
