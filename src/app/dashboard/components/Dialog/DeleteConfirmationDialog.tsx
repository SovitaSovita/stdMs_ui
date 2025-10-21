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

interface DeleteConfirmationDialogProps {
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

export const DeleteConfirmationDialog = ({
  open,
  onClose,
  onConfirm,
  title = "Confirm Delete",
  message,
  confirmText = "Delete",
  cancelText = "Cancel",
  itemName,
  itemCount,
}: DeleteConfirmationDialogProps) => {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleConfirm = async () => {
    setIsDeleting(true);
    try {
      await onConfirm();
      onClose();
    } catch (error) {
      console.error("Delete failed:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const getDefaultMessage = () => {
    if (message) return message;

    if (itemCount && itemCount > 1) {
      return `Are you sure you want to delete ${itemCount} ${
        itemName || "items"
      }? This action cannot be undone.`;
    }

    if (itemName) {
      return `Are you sure you want to delete "${itemName}"? This action cannot be undone.`;
    }

    return "Are you sure you want to delete this item? This action cannot be undone.";
  };

  return (
    <Dialog
      open={open}
      onClose={isDeleting ? undefined : onClose}
      aria-labelledby="delete-dialog-title"
      aria-describedby="delete-dialog-description"
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle id="delete-dialog-title">{title}</DialogTitle>
      <DialogContent>
        <DialogContentText id="delete-dialog-description">
          {getDefaultMessage()}
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button
          onClick={handleConfirm}
          color="error"
          variant="contained"
          disabled={isDeleting}
          startIcon={isDeleting ? <CircularProgress size={16} /> : null}
        >
          {isDeleting ? "Deleting..." : confirmText}
        </Button>

        <Button onClick={onClose} disabled={isDeleting}>
          {cancelText}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
