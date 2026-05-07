"use client";

import * as React from "react";
import IconButton, { IconButtonOwnProps } from "@mui/material/IconButton";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import ListItemText from "@mui/material/ListItemText";
import ListItemIcon from "@mui/material/ListItemIcon";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import LanguageRoundedIcon from "@mui/icons-material/LanguageRounded";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import { useTransition } from "react";
import { useParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Locale } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

type LocaleMeta = { code: "en" | "km"; label: string; short: string };

const LOCALES: LocaleMeta[] = [
  { code: "en", label: "English", short: "EN" },
  { code: "km", label: "ភាសាខ្មែរ", short: "ខ្មែរ" },
];

export default function LanguageIconDropdown(props: IconButtonOwnProps) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const locale = useLocale();
  const t = useTranslations("LocaleSwitcher");
  const [isPending, startTransition] = useTransition();

  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => setAnchorEl(null);

  const handleSelect = (next: Locale) => () => {
    handleClose();
    if (next === locale) return;
    startTransition(() => {
      router.replace(
        // @ts-expect-error -- pathname/params correspond at runtime
        { pathname, params },
        { locale: next }
      );
    });
  };

  const current =
    LOCALES.find((l) => l.code === locale) ?? LOCALES[0];

  return (
    <React.Fragment>
      <IconButton
        onClick={handleOpen}
        disableRipple
        size="small"
        aria-label={t("label")}
        aria-controls={open ? "language-menu" : undefined}
        aria-haspopup="true"
        aria-expanded={open ? "true" : undefined}
        disabled={isPending}
        sx={(theme) => ({
          border: `1px solid ${theme.palette.divider}`,
          borderRadius: theme.shape.borderRadius,
          px: 1,
          gap: 0.5,
        })}
        {...props}
      >
        <LanguageRoundedIcon fontSize="small" />
        <Typography variant="caption" sx={{ fontWeight: 700 }}>
          {current.short}
        </Typography>
      </IconButton>
      <Menu
        id="language-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        slotProps={{
          paper: {
            variant: "outlined",
            elevation: 0,
            sx: { my: "4px", minWidth: 180 },
          },
        }}
        transformOrigin={{ horizontal: "right", vertical: "top" }}
        anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
      >
        {routing.locales.map((code) => {
          const meta =
            LOCALES.find((l) => l.code === code) ??
            ({ code, label: code, short: code.toUpperCase() } as LocaleMeta);
          const selected = code === locale;
          return (
            <MenuItem
              key={code}
              selected={selected}
              onClick={handleSelect(code as Locale)}
            >
              <ListItemIcon sx={{ minWidth: 28 }}>
                {selected ? (
                  <CheckRoundedIcon fontSize="small" color="primary" />
                ) : null}
              </ListItemIcon>
              <ListItemText
                primary={
                  <Stack direction="row" spacing={1} alignItems="baseline">
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {meta.label}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {meta.short}
                    </Typography>
                  </Stack>
                }
              />
            </MenuItem>
          );
        })}
      </Menu>
    </React.Fragment>
  );
}
