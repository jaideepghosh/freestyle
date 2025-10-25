import type { Metadata } from "next";
import localFont from "next/font/local";
import "@freestyle/ui/globals.css";
import { NextIntlClientProvider } from "next-intl";
import { cookies } from "next/headers";
import { getMessages, type Locale } from "@freestyle/locales";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
});

export async function generateMetadata(): Promise<Metadata> {
  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get("locale")?.value as Locale | undefined;
  const locale: Locale =
    cookieLocale === "en" || cookieLocale === "es" ? cookieLocale : "en";
  const messages = getMessages(locale);

  return {
    title: messages["app.title"] ?? "Freestyle",
    description:
      messages["app.description"] ??
      "Freestyle is an open-source, local-first API testing & documentation app — combining Postman’s usability with Bruno’s portability, while staying enterprise-ready and self-hostable.",
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get("locale")?.value as Locale | undefined;
  const locale: Locale =
    cookieLocale === "en" || cookieLocale === "es" ? cookieLocale : "en";
  const messages = getMessages(locale);

  return (
    <html lang={locale}>
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <NextIntlClientProvider locale={locale} messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
