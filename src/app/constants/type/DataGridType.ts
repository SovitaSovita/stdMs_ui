import { GridDensity } from "@mui/x-data-grid";

export interface Settings {
  density?: GridDensity;
  showCellBorders?: boolean;
  showColumnBorders?: boolean;
}

export type ToolbarProps = {
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
};
