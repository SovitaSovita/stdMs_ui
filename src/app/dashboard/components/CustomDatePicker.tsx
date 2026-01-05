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
  DateView,
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
  const valueStr = pickerContext.value
    ? pickerContext.value.format(pickerContext.fieldFormat)
    : pickerContext.label || "Select date"; // shows label before picking

  return (
    <Button
      {...forwardedProps}
      variant="outlined"
      ref={handleRef}
      size="medium"
      disabled={pickerContext.disabled}
      endIcon={
        <CalendarTodayRoundedIcon
          fontSize="small"
          sx={{ opacity: pickerContext.disabled ? 0.5 : 0.8 }}
        />
      }
      onClick={() => pickerContext.setOpen((prev) => !prev)}
    >
      {valueStr}
    </Button>
  );
}

interface CustomDatePickerProps {
  name?: string;
  label?: string;
  value?: string | Dayjs | null;
  onChange?: (value: string | null) => void;
  formik?: any;
  error?: string | boolean;
  disabled?: boolean;
  minDate?: Dayjs;
  maxDate?: Dayjs;
  views?: DateView[];
  /** Date display format — e.g., 'MMM YYYY' for month picker */
  format?: string;
}

export default function CustomDatePicker({
  name,
  label,
  value,
  onChange,
  formik,
  error,
  disabled = false,
  minDate,
  maxDate,
  views = ["day", "month", "year"],
  format,
}: CustomDatePickerProps) {
  // ✅ Get value from Formik if available
  const formikValue = formik && name ? formik.values[name] : value;

  // ✅ Determine error message
  const formikError =
    formik && name ? formik.touched[name] && formik.errors[name] : error || "";

  const handleChange = (newValue: Dayjs | null) => {
    const formatted = newValue ? newValue.toISOString() : null;

    if (formik && name) {
      formik.setFieldValue(name, formatted);
      formik.setFieldTouched(name, true);
    }

    if (onChange) onChange(formatted);
  };

  // ✅ Auto-adjust format based on `views`
  const resolvedFormat =
    format ||
    (views.length === 1 && views[0] === "year"
      ? "YYYY"
      : views.length === 2 && views[0] === "month"
      ? "MMMM YYYY"
      : "MMMM DD, YYYY");

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <DatePicker
        label={label}
        disabled={disabled}
        value={formikValue ? dayjs(formikValue) : null}
        onChange={handleChange}
        minDate={minDate}
        maxDate={maxDate}
        views={views}
        format={resolvedFormat}
        // slots={{ field: ButtonField }}
        slotProps={{
          textField: {
            fullWidth: true,
            size: "small",
            variant: "outlined",
          },
        }}
      />
      {/* {formikError && (
        <Typography variant="caption" color="error">
          {String(formikError)}
        </Typography>
      )} */}
    </LocalizationProvider>
  );
}
