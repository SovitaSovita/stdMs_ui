import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  CircularProgress,
} from "@mui/material";
import { useState } from "react";

interface AskForConfirmationDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
  title?: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  itemName?: string;
  itemCount?: number;
}

export const AskForConfirmationDialog = ({
  open,
  onClose,
  onConfirm,
  title = "Confirm save",
  message,
  confirmText = "save",
  cancelText = "Cancel",
  itemName,
  itemCount,
}: AskForConfirmationDialogProps) => {
  const [isSaving, setIsSaving] = useState(false);

  const handleConfirm = async () => {
    setIsSaving(true);
    try {
      await onConfirm();
      onClose();
    } catch (error) {
      console.error("Save failed:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const getDefaultMessage = () => {
    if (message) return message;

    if (itemCount && itemCount > 1) {
      return `Are you sure you want to save ${itemCount} ${
        itemName || "items"
      }? This action cannot be undone.`;
    }

    if (itemName) {
      return `Are you sure you want to save "${itemName}"? This action cannot be undone.`;
    }

    return "Are you sure you want to save this item? This action cannot be undone.";
  };

  return (
    <Dialog
      open={open}
      onClose={isSaving ? undefined : onClose}
      aria-labelledby="save-dialog-title"
      aria-describedby="save-dialog-description"
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle id="save-dialog-title">{title}</DialogTitle>
      <DialogContent>
        <DialogContentText id="save-dialog-description">
          {getDefaultMessage()}
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button
          onClick={handleConfirm}
          color="primary"
          variant="contained"
          disabled={isSaving}
          startIcon={isSaving ? <CircularProgress size={16} /> : null}
        >
          {isSaving ? "Saving..." : confirmText}
        </Button>

        <Button onClick={onClose} disabled={isSaving}>
          {cancelText}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
