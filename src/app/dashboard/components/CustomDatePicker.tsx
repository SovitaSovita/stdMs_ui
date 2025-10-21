"use client";

import * as React from "react";
import dayjs, { Dayjs } from "dayjs";
import { useForkRef } from "@mui/material/utils";
import Button from "@mui/material/Button";
import CalendarTodayRoundedIcon from "@mui/icons-material/CalendarTodayRounded";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import {
  DatePicker,
  DatePickerFieldProps,
} from "@mui/x-date-pickers/DatePicker";
import {
  useParsedFormat,
  usePickerContext,
  useSplitFieldProps,
} from "@mui/x-date-pickers";
import { Box, Typography } from "@mui/material";

interface ButtonFieldProps extends DatePickerFieldProps {}

function ButtonField(props: ButtonFieldProps) {
  const { forwardedProps } = useSplitFieldProps(props, "date");
  const pickerContext = usePickerContext();
  const handleRef = useForkRef(pickerContext.triggerRef, pickerContext.rootRef);
  const parsedFormat = useParsedFormat();
  const valueStr =
    pickerContext.value == null
      ? parsedFormat
      : pickerContext.value.format(pickerContext.fieldFormat);

  return (
    <Button
      {...forwardedProps}
      variant="outlined"
      ref={handleRef}
      size="medium"
      startIcon={<CalendarTodayRoundedIcon fontSize="medium" />}
      sx={{ minWidth: "fit-content" }}
      onClick={() => pickerContext.setOpen((prev) => !prev)}
    >
      {pickerContext.label ?? valueStr}
    </Button>
  );
}

interface CustomDatePickerProps {
  name?: string;
  label?: string;
  value?: string | Dayjs | null;
  onChange?: (value: string | null) => void;
  formik?: any; // optional formik instance
  error?: string | boolean;
}

export default function CustomDatePicker({
  name,
  label,
  value,
  onChange,
  formik,
  error,
}: CustomDatePickerProps) {
  // If Formik is provided, use its state management
  const formikValue = formik && name ? formik.values[name] : value;
  const formikError =
    formik && name && error
      ? formik.touched[name] && formik.errors[name]
      : error;

  const handleChange = (newValue: Dayjs | null) => {
    const formatted = newValue ? newValue.toISOString() : null;

    if (formik && name) formik.setFieldValue(name, formatted);
    if (onChange) onChange(formatted);
  };
  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      {/* <Box sx={{ display: "flex", flexDirection: "column" }}> */}
        <DatePicker
          label={
            formikValue
              ? dayjs(formikValue).format("MMM DD, YYYY")
              : label || null
          }
          value={formikValue ? dayjs(formikValue) : null}
          onChange={handleChange}
          slots={{ field: ButtonField }}
          views={["day", "month", "year"]}
        />
        {formikError && (
          <Typography color="error" variant="caption">
            {String(formikError)}
          </Typography>
        )}
      {/* </Box> */}
    </LocalizationProvider>
  );
}
