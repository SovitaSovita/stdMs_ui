import { Autocomplete, AutocompleteProps, TextField } from "@mui/material";
import { GridRenderEditCellParams, useGridApiContext } from "@mui/x-data-grid";
import { useCallback } from "react";

const countries = [
  'Male',
  'Female',
];

export default function AutocompleteSelectGender(props: GridRenderEditCellParams) {
  const { id, field, value, error } = props;
  const apiRef = useGridApiContext();

  const handleChange: NonNullable<
    AutocompleteProps<any, any, any, any>['onChange']
  > = useCallback(
    async (_: React.SyntheticEvent, newValue, reason) => {
      await apiRef.current.setEditCellValue({
        id,
        field,
        value: newValue,
      });

      if (reason !== 'clear') {
        // stop editing mode for actions other than clearing the value
        apiRef.current.stopCellEditMode({ id, field });
      }
    },
    [id, field, apiRef],
  );

  return (
    <Autocomplete
      value={value}
      onChange={handleChange}
      options={countries}
      openOnFocus
      fullWidth
      onKeyDown={(event) => {
        if (event.key === 'Enter') {
          // Prevent closing edit mode prematurely
          event.stopPropagation();
        }
        if (event.key === 'Escape') {
          apiRef.current.stopCellEditMode({ id, field, ignoreModifications: true });
        }
      }}
      renderInput={(params) => (
        <TextField
          {...params}
          error={error}
          slotProps={{
            input: {
              ...params.InputProps,
              autoFocus: true,
            },
          }}
        />
      )}
      sx={{
        fontSize: 'inherit',
        '& .MuiFormControl-root': {
          height: '100%',
        },
        '& .MuiOutlinedInput-root': {
          fontSize: 'inherit',
          paddingLeft: '9px',
          paddingTop: 0,
          paddingBottom: '1px', // to account for the editing cell 1px
        },
        '& .MuiOutlinedInput-root .MuiAutocomplete-input': {
          paddingLeft: 0,
        },
        '& .MuiOutlinedInput-notchedOutline': {
          display: 'none',
        },
      }}
      slotProps={{
        listbox: {
          sx: {
            fontSize: '0.875rem',
          },
        },
      }}
    />
  );
}