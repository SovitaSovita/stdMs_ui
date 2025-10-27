import { styled, Tooltip, tooltipClasses, TooltipProps } from '@mui/material';
import { GridEditInputCell, GridRenderEditCellParams } from '@mui/x-data-grid';
import React from 'react'

const StyledTooltip = styled(({ className, ...props }: TooltipProps) => (
  <Tooltip {...props} classes={{ popper: className }} />
))(({ theme }) => ({
  [`& .${tooltipClasses.tooltip}`]: {
    backgroundColor: theme.palette.error.main,
    color: theme.palette.error.contrastText,
  },
}));

function NameEditInputCell(props: GridRenderEditCellParams) {
  const { error, isValidating } = props;

  return (
    <StyledTooltip open={!!isValidating} title={error}>
      <GridEditInputCell {...props} />
    </StyledTooltip>
  );
}


export const ValidateServerFieldGrid = (params: GridRenderEditCellParams) => {
    return <NameEditInputCell {...params} />;
}
