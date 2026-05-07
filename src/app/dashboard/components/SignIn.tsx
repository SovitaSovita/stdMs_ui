"use client";
import * as React from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CssBaseline from "@mui/material/CssBaseline";
import FormLabel from "@mui/material/FormLabel";
import FormControl from "@mui/material/FormControl";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import Link from "@mui/material/Link";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import MuiCard from "@mui/material/Card";
import { alpha, styled, useTheme } from "@mui/material/styles";
import Alert from "@mui/material/Alert";
import Collapse from "@mui/material/Collapse";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";
import VisibilityOffRoundedIcon from "@mui/icons-material/VisibilityOffRounded";
import GroupsRoundedIcon from "@mui/icons-material/GroupsRounded";
import LibraryBooksRoundedIcon from "@mui/icons-material/LibraryBooksRounded";
import AssignmentTurnedInRoundedIcon from "@mui/icons-material/AssignmentTurnedInRounded";
import AppTheme from "../../shared-theme/AppTheme";
import ColorModeIconDropdown from "../../shared-theme/ColorModeIconDropdown";
import { AppLogo } from "./CustomIcons";
import ForgotPassword from "./ForgotPassword";
import LanguageIconDropdown from "./LanguageIconDropdown";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { useTranslations } from "next-intl";

const Card = styled(MuiCard)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  width: "100%",
  padding: theme.spacing(4),
  gap: theme.spacing(2.5),
  borderRadius: 16,
  boxShadow:
    "hsla(220, 30%, 5%, 0.06) 0px 4px 12px 0px, hsla(220, 25%, 10%, 0.05) 0px 12px 32px -4px",
  ...theme.applyStyles("dark", {
    boxShadow:
      "hsla(220, 30%, 5%, 0.5) 0px 4px 12px 0px, hsla(220, 25%, 10%, 0.08) 0px 12px 32px -4px",
  }),
}));

const PageRoot = styled(Box)(({ theme }) => ({
  minHeight: "100dvh",
  display: "grid",
  gridTemplateColumns: "1fr",
  [theme.breakpoints.up("md")]: {
    gridTemplateColumns: "1.05fr 1fr",
  },
}));

const HERO_WALLPAPER_URL = "/static/images/signin-bg.jpg";

const HeroPanel = styled(Box)(({ theme }) => ({
  display: "none",
  position: "relative",
  overflow: "hidden",
  padding: theme.spacing(6),
  color: theme.palette.primary.contrastText,
  // Layer order: dark gradient overlay (top) → wallpaper image → brand-color fallback (bottom)
  backgroundImage: `linear-gradient(135deg, ${alpha(
    theme.palette.primary.dark,
    0.78
  )} 0%, ${alpha("#0b1730", 0.7)} 100%), url('${HERO_WALLPAPER_URL}'), linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.info.main} 100%)`,
  backgroundSize: "cover, cover, cover",
  backgroundPosition: "center, center, center",
  backgroundRepeat: "no-repeat, no-repeat, no-repeat",
  [theme.breakpoints.up("md")]: {
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
  },
  "&::before, &::after": {
    content: '""',
    position: "absolute",
    borderRadius: "50%",
    pointerEvents: "none",
  },
  "&::before": {
    width: 460,
    height: 460,
    top: -160,
    right: -160,
    background: `radial-gradient(circle, ${alpha("#fff", 0.14)} 0%, transparent 70%)`,
  },
  "&::after": {
    width: 320,
    height: 320,
    bottom: -120,
    left: -100,
    background: `radial-gradient(circle, ${alpha("#fff", 0.1)} 0%, transparent 70%)`,
  },
}));

const FormPanel = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: theme.spacing(3),
  position: "relative",
  [theme.breakpoints.up("sm")]: {
    padding: theme.spacing(6),
  },
  background: theme.palette.background.default,
  "&::before": {
    content: '""',
    position: "absolute",
    inset: 0,
    pointerEvents: "none",
    backgroundImage:
      "radial-gradient(ellipse at top right, hsl(210, 100%, 97%), transparent 60%)",
    ...theme.applyStyles("dark", {
      backgroundImage:
        "radial-gradient(ellipse at top right, hsla(210, 100%, 16%, 0.4), transparent 60%)",
    }),
  },
}));

function HeroFeature({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <Stack
      direction="row"
      spacing={2}
      alignItems="flex-start"
      sx={{
        p: 1.75,
        borderRadius: 2,
        bgcolor: alpha("#000", 0.18),
        backdropFilter: "blur(10px)",
        border: `1px solid ${alpha("#fff", 0.18)}`,
      }}
    >
      <Box
        sx={{
          width: 40,
          height: 40,
          flexShrink: 0,
          borderRadius: 2,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          bgcolor: alpha("#fff", 0.22),
          color: "common.white",
        }}
      >
        {icon}
      </Box>
      <Box>
        <Typography sx={{ fontWeight: 700, color: "common.white" }}>
          {title}
        </Typography>
        <Typography variant="body2" sx={{ color: alpha("#fff", 0.9) }}>
          {desc}
        </Typography>
      </Box>
    </Stack>
  );
}

export default function SignIn(props: { disableCustomTheme?: boolean }) {
  const theme = useTheme();
  const [emailError, setEmailError] = React.useState(false);
  const [emailErrorMessage, setEmailErrorMessage] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [passwordError, setPasswordError] = React.useState(false);
  const [passwordErrorMessage, setPasswordErrorMessage] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [open, setOpen] = React.useState(false);
  const [apiError, setApiError] = React.useState<string | null>(null);
  const router = useRouter();
  const t = useTranslations();

  const handleClickOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setApiError(null);
    setIsLoading(true);
    if (emailError || passwordError) {
      event.preventDefault();
      setIsLoading(false);
      return;
    }
    const data = new FormData(event.currentTarget);
    const sentData = {
      username: data.get("email")?.toString() || "",
      password: data.get("password")?.toString() || "",
    };

    try {
      const result = await signIn("credentials", {
        username: sentData.username,
        password: sentData.password,
        redirect: false,
        callbackUrl: "/",
      });

      if (result?.error) {
        // next-auth returns "CredentialsSignin" when it strips the thrown
        // message, otherwise it returns the message we threw in `authorize`.
        const message =
          result.error === "CredentialsSignin"
            ? t("SignIn.invalidCredentials")
            : result.error;
        setApiError(message);
      } else {
        router.push("/");
      }
    } catch (err) {
      setApiError(t("SignIn.unexpectedError"));
    } finally {
      setIsLoading(false);
    }
  };

  const validateInputs = () => {
    const email = document.getElementById("email") as HTMLInputElement;
    const password = document.getElementById("password") as HTMLInputElement;

    let isValid = true;

    if (!email.value || "") {
      setEmailError(true);
      setEmailErrorMessage(t("SignIn.errorUsername"));
      isValid = false;
    } else {
      setEmailError(false);
      setEmailErrorMessage("");
    }

    if (!password.value || password.value.length < 6) {
      setPasswordError(true);
      setPasswordErrorMessage(t("SignIn.errorPassword"));
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
      <PageRoot>
        {/* Left: hero / branding panel (md+) */}
        <HeroPanel>
          <AppLogo size={48} textColor="#fff" />

          <Stack spacing={2} sx={{ maxWidth: 480 }}>
            <Typography
              variant="h3"
              sx={{
                fontWeight: 800,
                lineHeight: 1.15,
                color: "common.white",
                textShadow: "0 2px 16px rgba(0,0,0,0.35)",
              }}
            >
              {t("SignIn.welcomeBack")}
            </Typography>
            <Typography
              variant="body1"
              sx={{
                color: alpha("#fff", 0.92),
                fontSize: "1.05rem",
                textShadow: "0 1px 8px rgba(0,0,0,0.3)",
              }}
            >
              {t("SignIn.tagline")}
            </Typography>

            <Stack spacing={2.5} sx={{ mt: 4 }}>
              <HeroFeature
                icon={<GroupsRoundedIcon />}
                title={t("SignIn.feature1Title")}
                desc={t("SignIn.feature1Desc")}
              />
              <HeroFeature
                icon={<LibraryBooksRoundedIcon />}
                title={t("SignIn.feature2Title")}
                desc={t("SignIn.feature2Desc")}
              />
              <HeroFeature
                icon={<AssignmentTurnedInRoundedIcon />}
                title={t("SignIn.feature3Title")}
                desc={t("SignIn.feature3Desc")}
              />
            </Stack>
          </Stack>

          <Typography
            variant="caption"
            sx={{ color: alpha("#fff", 0.7), zIndex: 1 }}
          >
            {t("SignIn.copyright", { year: new Date().getFullYear() })}
          </Typography>
        </HeroPanel>

        {/* Right: sign-in form */}
        <FormPanel>
          <Stack
            direction="row"
            spacing={1}
            alignItems="center"
            sx={{
              position: "absolute",
              top: 16,
              right: 16,
              zIndex: 1,
            }}
          >
            <LanguageIconDropdown />
            <ColorModeIconDropdown />
          </Stack>

          <Box
            sx={{
              width: "100%",
              maxWidth: 440,
              position: "relative",
              zIndex: 1,
            }}
          >
            {/* Mobile-only logo (hero is hidden on small screens) */}
            <Box sx={{ display: { xs: "flex", md: "none" }, mb: 3 }}>
              <AppLogo size={44} />
            </Box>

            <Card variant="outlined">
              <Box>
                <Typography
                  component="h1"
                  variant="h4"
                  sx={{ fontWeight: 800, letterSpacing: "-0.01em" }}
                >
                  {t("SignIn.title")}
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mt: 0.5 }}
                >
                  {t("SignIn.subtitle")}
                </Typography>
              </Box>

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
                <Collapse in={Boolean(apiError)}>
                  <Alert
                    severity="error"
                    onClose={() => setApiError(null)}
                    variant="outlined"
                    sx={{ alignItems: "center" }}
                  >
                    {apiError}
                  </Alert>
                </Collapse>
                <FormControl>
                  <FormLabel htmlFor="email">{t("SignIn.username")}</FormLabel>
                  <TextField
                    error={emailError}
                    helperText={emailErrorMessage}
                    id="email"
                    type="text"
                    name="email"
                    placeholder={t("SignIn.usernamePlaceholder")}
                    autoComplete="username"
                    autoFocus
                    required
                    fullWidth
                    variant="outlined"
                    color={emailError ? "error" : "primary"}
                  />
                </FormControl>

                <FormControl>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <FormLabel htmlFor="password">
                      {t("SignIn.password")}
                    </FormLabel>
                    <Link
                      component="button"
                      type="button"
                      onClick={handleClickOpen}
                      variant="caption"
                      sx={{ fontWeight: 600 }}
                    >
                      {t("SignIn.forgotPassword")}
                    </Link>
                  </Box>
                  <TextField
                    error={passwordError}
                    helperText={passwordErrorMessage}
                    name="password"
                    placeholder="••••••"
                    type={showPassword ? "text" : "password"}
                    id="password"
                    autoComplete="current-password"
                    required
                    fullWidth
                    variant="outlined"
                    color={passwordError ? "error" : "primary"}
                    slotProps={{
                      input: {
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              size="small"
                              edge="end"
                              onClick={() => setShowPassword((p) => !p)}
                              aria-label={
                                showPassword
                                  ? t("SignIn.hidePassword")
                                  : t("SignIn.showPassword")
                              }
                            >
                              {showPassword ? (
                                <VisibilityOffRoundedIcon fontSize="small" />
                              ) : (
                                <VisibilityRoundedIcon fontSize="small" />
                              )}
                            </IconButton>
                          </InputAdornment>
                        ),
                      },
                    }}
                  />
                </FormControl>

                <ForgotPassword open={open} handleClose={handleClose} />

                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  size="large"
                  onClick={validateInputs}
                  loading={isLoading}
                  sx={{
                    mt: 1,
                    py: 1.25,
                    fontWeight: 700,
                    borderRadius: 2,
                    textTransform: "none",
                    boxShadow: theme.shadows[2],
                  }}
                >
                  {t("SignIn.submit")}
                </Button>
              </Box>
            </Card>

            <Typography
              variant="caption"
              color="text.secondary"
              sx={{
                display: { xs: "block", md: "none" },
                textAlign: "center",
                mt: 3,
              }}
            >
              {t("SignIn.copyright", { year: new Date().getFullYear() })}
            </Typography>
          </Box>
        </FormPanel>
      </PageRoot>
    </AppTheme>
  );
}
