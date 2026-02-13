"use client";

import { SitemarkIcon } from "@/app/dashboard/components/CustomIcons";
import AppTheme from "@/app/shared-theme/AppTheme";
import ColorModeSelect from "@/app/shared-theme/ColorModeSelect";
import {
  Box,
  Button,
  CssBaseline,
  FormControl,
  FormLabel,
  Stack,
  styled,
  TextField,
  Typography,
} from "@mui/material";
import MuiCard from "@mui/material/Card";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const Card = styled(MuiCard)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  alignSelf: "center",
  width: "100%",
  padding: theme.spacing(4),
  gap: theme.spacing(2),
  margin: "auto",
  [theme.breakpoints.up("sm")]: {
    maxWidth: "450px",
  },
  boxShadow:
    "hsla(220, 30%, 5%, 0.05) 0px 5px 15px 0px, hsla(220, 25%, 10%, 0.05) 0px 15px 35px -5px",
  ...theme.applyStyles("dark", {
    boxShadow:
      "hsla(220, 30%, 5%, 0.5) 0px 5px 15px 0px, hsla(220, 25%, 10%, 0.08) 0px 15px 35px -5px",
  }),
}));

const SignInContainer = styled(Stack)(({ theme }) => ({
  height: "calc((1 - var(--template-frame-height, 0)) * 100dvh)",
  minHeight: "100%",
  padding: theme.spacing(2),
  [theme.breakpoints.up("sm")]: {
    padding: theme.spacing(4),
  },
  "&::before": {
    content: '""',
    display: "block",
    position: "absolute",
    zIndex: -1,
    inset: 0,
    backgroundImage:
      "radial-gradient(ellipse at 50% 50%, hsl(210, 100%, 97%), hsl(0, 0%, 100%))",
    backgroundRepeat: "no-repeat",
    ...theme.applyStyles("dark", {
      backgroundImage:
        "radial-gradient(at 50% 50%, hsla(210, 100%, 16%, 0.5), hsl(220, 30%, 5%))",
    }),
  },
}));


export default function ResetPassword(props: { disableCustomTheme?: boolean }) {
  const token = useSearchParams().get("token");
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false); // Track loading state

  const [passwordError, setPasswordError] = useState(false);
  const [passwordErrorMessage, setPasswordErrorMessage] = useState("");

  useEffect(() => {
    fetch(
      `${process.env.NEXT_PUBLIC_BACK_END_URL}/api/v1/auth/reset-password/verify?token=${token}`,
    )
      .then((res) => {
        if (!res.ok) throw new Error();
      })
      .catch(() => router.push("/auth/expired-link"));
  }, []);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setIsLoading(true);
    if (passwordError) {
      event.preventDefault();
      return;
    }
    const data = new FormData(event.currentTarget);
    const sentData = {
      password: data.get("password")?.toString() || "",
    };

    await fetch(
      `${process.env.NEXT_PUBLIC_BACK_END_URL}/api/v1/auth/reset-password`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword: sentData.password }),
      },
    );
    router.push("/signin");
  };

  const validateInputs = () => {
    const password = document.getElementById("password") as HTMLInputElement;

    let isValid = true;

    if (!password.value || password.value.length < 6) {
      setPasswordError(true);
      setPasswordErrorMessage("Password must be at least 6 characters long.");
      isValid = false;
    } else {
      setPasswordError(false);
      setPasswordErrorMessage("");
    }

    return isValid;
  };

  return (
    <AppTheme {...props}>
      <CssBaseline enableColorScheme />
      <SignInContainer direction="column" justifyContent="space-between">
        <ColorModeSelect
          sx={{ position: "fixed", top: "1rem", right: "1rem" }}
        />
        <Card variant="outlined">
          <SitemarkIcon />
          <Typography
            component="h1"
            variant="h4"
            sx={{ width: "100%", fontSize: "clamp(2rem, 10vw, 2.15rem)" }}
          >
            Reset Password
          </Typography>
          <Box
            component="form"
            onSubmit={handleSubmit}
            noValidate
            sx={{
              display: "flex",
              flexDirection: "column",
              width: "100%",
              gap: 2,
            }}
          >
            <FormControl>
              <FormLabel htmlFor="password">New Password</FormLabel>
              <TextField
                error={passwordError}
                helperText={passwordErrorMessage}
                name="password"
                placeholder="••••••"
                type="password"
                id="password"
                autoComplete="current-password"
                autoFocus
                required
                fullWidth
                variant="outlined"
                color={passwordError ? "error" : "primary"}
              />
            </FormControl>
            <Button
              type="submit"
              fullWidth
              variant="outlined"
              onClick={validateInputs}
              loading={isLoading}
            >
              Reset
            </Button>
          </Box>
        </Card>
      </SignInContainer>
    </AppTheme>
  );
}