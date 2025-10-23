import { useLocale, useTranslations } from "next-intl";
import { routing } from "@/i18n/routing";
import LanguageSwitcherSelect from "./LanguageSwitcherSelect";
import { MenuItem } from "@mui/material";

export default function LanguageSwitcher() {
  const t = useTranslations("LocaleSwitcher");
  const locale = useLocale();

  return (
    <LanguageSwitcherSelect defaultValue={locale} label={t("label")}>
      {routing.locales.map((cur) => (
        <MenuItem key={cur} value={cur}>
          {t("locale", { locale: cur })}
        </MenuItem>
      ))}
    </LanguageSwitcherSelect>
  );
}
