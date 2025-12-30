import React, { Dispatch, SetStateAction, useState } from "react";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import {
  Box,
  FormControl,
  FormHelperText,
  InputLabel,
  MenuItem,
  Select,
} from "@mui/material";
import { useFormik } from "formik";
import { useInsertOneStutSchema } from "@/app/libs/hooks/Validation";
import CustomDatePicker from "../CustomDatePicker";
import { DialogModeType, StudentsRequestUpsertType } from "@/app/constants/type";
import StudentService from "@/app/service/StudentService";
import { classroomAtom } from "@/app/libs/jotai/classroomAtom";
import { useAtomValue } from "jotai";
import { useTranslations } from "next-intl";
import PersonAddAlt1Icon from "@mui/icons-material/PersonAddAlt1";
import CreateClassForm from "../Common/Classroom/CreateClassForm";

type UpsertClassDialogProps = {
  mode: DialogModeType;
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
};

export const UpsertClassDialog = (props: UpsertClassDialogProps) => {
  const { open, setOpen, mode } = props;
  // const classroom = useAtomValue(classroomAtom);
  const t = useTranslations("Classroom");

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  return (
    <>
      <Dialog
        open={open}
        onClose={(event, reason) => {
          if (reason === "backdropClick") return;
          handleClose();
        }}
      >
        <DialogTitle>{t("DialogInsert.title")}</DialogTitle>
        <CreateClassForm mode={mode} handleClose={handleClose}/>
      </Dialog>
    </>
  );
};
