import React from "react";
import { Box, Button, Typography } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";

type EmptyStateCardProps = {
  title: string;
  description?: string;
  buttonLabel: string;
  buttonIcon?: React.ReactNode;
  onButtonClick: () => void;
  minHeight?: number | string;
};

export default function EmptyStateCard({
  title,
  description,
  buttonLabel,
  buttonIcon = <AddIcon />,
  onButtonClick,
  minHeight = "200px",
}: EmptyStateCardProps) {
  return (
    <Box
      width="100%"
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      minHeight={minHeight}
      textAlign="center"
      color="text.secondary"
    >
      <Typography variant="h6" gutterBottom>
        {title}
      </Typography>
      {description && (
        <Typography variant="body2" sx={{ mb: 2 }}>
          {description}
        </Typography>
      )}
      <Button
        variant="contained"
        startIcon={buttonIcon}
        sx={{ mt: 2 }}
        onClick={onButtonClick}
      >
        {buttonLabel}
      </Button>
    </Box>
  );
}