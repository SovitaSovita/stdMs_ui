import { hasLocale, Locale, NextIntlClientProvider } from "next-intl";
import { notFound } from "next/navigation";
import Dashboard from "../dashboard/Dashboard";
import React, { ReactNode } from "react";
import {
  getMessages,
  getTranslations,
  setRequestLocale,
} from "next-intl/server";
import { routing } from "@/i18n/routing";
import "../globals.css";

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
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
    <html lang={locale}>
      <body className={`antialiased`}>
        {/* ✅ Provide translation context */}
        <NextIntlClientProvider>
            <Dashboard>{children}</Dashboard>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
