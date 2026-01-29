"use client";

import * as React from "react";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import OutlinedInput from "@mui/material/OutlinedInput";
import { FormControl, FormLabel, TextField } from "@mui/material";

interface ForgotPasswordProps {
  open: boolean;
  handleClose: () => void;
}

export default function ForgotPassword({
  open,
  handleClose,
}: ForgotPasswordProps) {
  const [email, setEmail] = React.useState("");
  const [emailError, setEmailError] = React.useState(false);
  const [emailErrorMessage, setEmailErrorMessage] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false); // Track loading state

  const handleSubmit = async () => {
    // 1. Capture the result of the validation immediately
    const isFormValid = validateInputs();

    // 2. If it's not valid, stop here
    if (!isFormValid) {
      return;
    }

    setIsLoading(true);

    try {
      const result = await fetch(
        `${process.env.NEXT_PUBLIC_BACK_END_URL}/api/v1/auth/forgot-password?email=${email}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        },
      );

      if (result.ok) {
        confirm("If email exists, reset link sent. Pls check your gmail.");
        handleClose(); 
      } else {
        setEmailError(true);
        setEmailErrorMessage("Something went wrong. Please try again later.");
      }
    } catch (error) {
      console.error("Submission error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const validateInputs = () => {
    let isValid = true;

    // Standard Email Regex pattern
    const emailRegex = /\S+@\S+\.\S+/;

    if (!email || email.trim() === "") {
      setEmailError(true);
      setEmailErrorMessage("Email address is required.");
      isValid = false;
    } else if (!emailRegex.test(email)) {
      setEmailError(true);
      setEmailErrorMessage(
        "Please enter a valid email address (e.g., name@example.com).",
      );
      isValid = false;
    } else {
      setEmailError(false);
      setEmailErrorMessage("");
    }

    return isValid;
  };

  return (
    <Dialog open={open} onClose={handleClose}>
      <DialogTitle>Reset password</DialogTitle>
      <DialogContent
        sx={{ display: "flex", flexDirection: "column", gap: 2, width: "100%" }}
      >
        <DialogContentText>
          Enter your account&apos;s email address, and we&apos;ll send you a
          link to reset your password.
        </DialogContentText>
        <FormControl>
          <TextField
            error={emailError}
            helperText={emailErrorMessage}
            id="email"
            type="email"
            name="email"
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            autoComplete="email"
            autoFocus
            required
            fullWidth
            variant="outlined"
            color={emailError ? "error" : "primary"}
          />
        </FormControl>
      </DialogContent>
      <DialogActions sx={{ pb: 3, px: 3 }}>
        <Button onClick={handleClose}>Cancel</Button>
        <Button variant="contained" onClick={handleSubmit} loading={isLoading}>
          Continue
        </Button>
      </DialogActions>
    </Dialog>
  );
}
