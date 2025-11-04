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
  })
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

  const [settingsMenuOpen, setSettingsMenuOpen] = React.useState(false);
  const settingsMenuTriggerRef = React.useRef<HTMLButtonElement>(null);

  const [exportMenuOpen, setExportMenuOpen] = React.useState(false);
  const exportMenuTriggerRef = React.useRef<HTMLButtonElement>(null);

  const t = useTranslations("Common");

  return (
    <Toolbar className={`${toolbarButtons?.toolbarClass || ''}`}>
      {toolbarButtons?.extraControls && (
        <Box sx={{ ml: 1, my: 1, display: "flex", alignItems: "center", gap: 2, flex: 1 }}>{toolbarButtons.extraControls}</Box>
      )}

      {toolbarButtons?.search && (
        <StyledQuickFilter>
          <QuickFilterTrigger
            render={(triggerProps, state) => (
              <Tooltip title={t("search")} enterDelay={0}>
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
          <Tooltip title={t("download")}>
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
              {t("print")}
            </ExportPrint>
            <ExportCsv
              render={<MenuItem />}
              onClick={() => setExportMenuOpen(false)}
            >
              {t("downloadExcel")}
            </ExportCsv>
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
