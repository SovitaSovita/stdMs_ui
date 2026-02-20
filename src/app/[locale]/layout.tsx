import { hasLocale, Locale, NextIntlClientProvider } from "next-intl";
import { notFound } from "next/navigation";
import Dashboard from "../dashboard/DashboardLayout";
import React, { ReactNode } from "react";
import {
  getMessages,
  getTranslations,
  setRequestLocale,
} from "next-intl/server";
import { routing } from "@/i18n/routing";
import "../globals.css";
import Provider from "../Provider";
import DashboardLayout from "../dashboard/DashboardLayout";
import ClientLayout from "./ClientLayout";

type Props = {
  children: React.ReactNode;
  params: { locale: string };
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

// export async function generateMetadata(
//   props: Omit<LayoutProps<'/[locale]'>, 'children'>
// ) {
//   const {locale} = await props.params;

//   const t = await getTranslations({
//     locale: locale as Locale,
//     namespace: 'LocaleLayout'
//   });

//   return {
//     title: t('title')
//   };
// }

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  // Enable static rendering
  setRequestLocale(locale);

  return (
    <Provider>
      <NextIntlClientProvider>
        <ClientLayout>{children}</ClientLayout>
      </NextIntlClientProvider>
    </Provider>
  );
}
