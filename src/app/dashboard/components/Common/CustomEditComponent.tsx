import { DataGrid, GridRenderEditCellParams } from '@mui/x-data-grid';
import { useGridApiContext } from '@mui/x-data-grid';
import { TextField } from '@mui/material';
import { useTranslations } from 'next-intl';

// Custom edit component to handle the error state
export const CustomEditComponent = (props: GridRenderEditCellParams) => {
  const { id, value, field, error } = props;
  const t = useTranslations("CommonValidate")
  const apiRef = useGridApiContext();

  const handleValueChange = (event: any) => {
    apiRef.current.setEditCellValue({ id, field, value: event.target.value });
  };

  return (
    <TextField
      value={value}
      onChange={handleValueChange}
      error={!!error}
      hiddenLabel
    //   helperText={!!error && t("require")}
      variant="standard"
      fullWidth
    />
  );
};