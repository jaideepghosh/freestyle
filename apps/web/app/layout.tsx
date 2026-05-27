import type { Metadata } from "next";
import localFont from "next/font/local";
import "@freestyle/ui/globals.css";
import I18nProvider from "./lib/I18nProvider";
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

  // Support nested message objects (e.g., app: { title, description })
  const nestedApp =
    typeof (messages as Record<string, unknown>).app === "object"
      ? ((messages as Record<string, unknown>).app as Record<string, unknown>)
      : undefined;
  const appTitle =
    (typeof nestedApp?.title === "string" ? nestedApp.title : undefined) ||
    (messages["app.title"] as string | undefined);
  const appDescription =
    (typeof nestedApp?.description === "string"
      ? nestedApp.description
      : undefined) || (messages["app.description"] as string | undefined);

  return {
    title: appTitle ?? "Freestyle",
    description:
      appDescription ??
      "Freestyle is an open-source, local-first API testing & documentation app — combining Postman's usability with Bruno's portability, while staying enterprise-ready and self-hostable.",
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

  const cookieTheme = cookieStore.get("theme")?.value ?? "light";
  const theme =
    cookieTheme === "dark" ||
    cookieTheme === "light" ||
    cookieTheme === "system"
      ? cookieTheme
      : "light";

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        {/* Apply theme immediately to prevent flash */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                const theme = localStorage.getItem('theme') || '${theme}';
                if (theme === 'dark') {
                  document.documentElement.classList.add('dark');
                } else if (theme === 'system') {
                  if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
                    document.documentElement.classList.add('dark');
                  } else {
                    document.documentElement.classList.remove('dark');
                  }
                } else {
                  document.documentElement.classList.remove('dark');
                }
              })();
            `,
          }}
        />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <I18nProvider initialLocale={locale} initialMessages={messages}>
          {children}
        </I18nProvider>
      </body>
    </html>
  );
}
