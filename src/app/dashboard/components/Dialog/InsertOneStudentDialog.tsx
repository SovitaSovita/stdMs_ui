import React from "react";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import {
  FormControl,
  FormHelperText,
  InputLabel,
  MenuItem,
  Select,
} from "@mui/material";
import { useFormik } from "formik";
import { insertOneStuSchema } from "@/app/libs/formik/ValidationSchema";

type InsertOneStudentDialogProps = {
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => Promise<void>;
};

export const InsertOneStudentDialog = (props: InsertOneStudentDialogProps) => {
  const { handleSubmit } = props;
  const [open, setOpen] = React.useState(false);

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const formik = useFormik({
    initialValues: {
      // "id": 0,
      // "classId": 0,
      fullName: "",
      gender: "M",
      dateOfBirth: "",
      fatherName: "",
      fatherOccupation: "",
      montherName: "",
      montherOccupation: "",
      placeOfBirth: "",
      address: "",
    },
    validationSchema: insertOneStuSchema,
    onSubmit: (values) => {
      console.log("click");
      console.log(values);
    },
  });

  return (
    <>
      <Button onClick={handleClickOpen} variant="contained" size="small">
        បញ្ជូលសិស្សម្នាក់
      </Button>
      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>សូមបញ្ជូលពត័មានរបស់សិស្ស</DialogTitle>
        <form onSubmit={formik.handleSubmit}>
          <DialogContent>
            <TextField
              autoFocus
              required
              margin="dense"
              name="fullName"
              placeholder="ឈ្មោះពេញ"
              type="text"
              fullWidth
              variant="outlined"
              value={formik.values.fullName}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.fullName && Boolean(formik.errors.fullName)}
              helperText={formik.touched.fullName && formik.errors.fullName}
            />

            <FormControl fullWidth margin="dense">
              <Select
                labelId="select-gender-label"
                value={formik.values.gender}
                name="gender"
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                variant="outlined"
              >
                <MenuItem value="M">ប្រុស</MenuItem>
                <MenuItem value="F">ស្រី</MenuItem>
              </Select>
            </FormControl>

            <TextField
              multiline
              rows={3}
              required
              margin="dense"
              name="address"
              placeholder="Address"
              type="address"
              fullWidth
              variant="outlined"
              value={formik.values.address}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.address && Boolean(formik.errors.address)}
              helperText={formik.touched.address && formik.errors.address}
            />
          </DialogContent>

          <DialogActions>
            <Button onClick={handleClose}>ថយក្រោយ</Button>
            <Button type="submit">រួចរាល់</Button>
          </DialogActions>
        </form>
      </Dialog>
    </>
  );
};
