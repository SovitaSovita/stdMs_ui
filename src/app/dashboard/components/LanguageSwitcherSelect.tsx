"use client";

import clsx from "clsx";
import { useParams } from "next/navigation";
import { Locale } from "next-intl";
import { ChangeEvent, ReactNode, useTransition } from "react";
import { usePathname, useRouter } from "@/i18n/navigation";
import { Box, FormControl, Select, SelectChangeEvent } from "@mui/material";

type Props = {
  children: ReactNode;
  defaultValue: string;
  label: string;
};

export default function LanguageSwitcherSelect({
  children,
  defaultValue,
  label,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const pathname = usePathname();
  const params = useParams();

  function onSelectChange(event: SelectChangeEvent) {
    const nextLocale = event.target.value as Locale;
    startTransition(() => {
      router.replace(
        // @ts-expect-error -- TypeScript will validate that only known `params`
        // are used in combination with a given `pathname`. Since the two will
        // always match for the current route, we can skip runtime checks.
        { pathname, params },
        { locale: nextLocale }
      );
    });
  }

  return (
    <Box aria-hidden={isPending ? "true" : "false"}>
      <FormControl>
        <Select
          size="small"
          labelId={`select-lan-label`}
          defaultValue={defaultValue}
          disabled={isPending}
          onChange={onSelectChange}
          MenuProps={{ disablePortal: true }}
        >
          {children}
        </Select>
      </FormControl>
    </Box>
  );
}
