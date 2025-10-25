"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { NextIntlClientProvider } from "next-intl";
import {
  getMessages as getAllMessages,
  type Messages,
  type Locale,
} from "@freestyle/locales";

interface I18nProviderProps {
  initialLocale: Locale;
  initialMessages: Messages;
  children: React.ReactNode;
}

export default function I18nProvider({
  initialLocale,
  initialMessages,
  children,
}: I18nProviderProps) {
  const [locale, setLocale] = useState<Locale>(initialLocale);
  const [messages, setMessages] = useState<Messages>(initialMessages);
  const [timeZone, setTimeZone] = useState<string>("UTC");

  const applyLocale = useCallback((nextLocale: string) => {
    const safeLocale =
      nextLocale === "en" || nextLocale === "es"
        ? (nextLocale as Locale)
        : "en";
    setLocale(safeLocale);
    setMessages(getAllMessages(safeLocale));
    if (typeof document !== "undefined") {
      document.documentElement.setAttribute("lang", safeLocale);
      document.cookie = `locale=${safeLocale}; path=/; max-age=31536000`;
    }
  }, []);

  useEffect(() => {
    // Prefer client environment time zone if available
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (tz) setTimeZone(tz);
    } catch {}

    const onLocaleChange = (e: Event) => {
      const custom = e as CustomEvent<string>;
      if (typeof custom.detail === "string") {
        applyLocale(custom.detail);
      }
    };
    window.addEventListener("locale-change", onLocaleChange as EventListener);
    return () => {
      window.removeEventListener(
        "locale-change",
        onLocaleChange as EventListener
      );
    };
  }, [applyLocale]);

  const providerValue = useMemo(
    () => ({ locale, messages }),
    [locale, messages]
  );

  return (
    <NextIntlClientProvider
      locale={providerValue.locale}
      messages={providerValue.messages}
      timeZone={timeZone}
    >
      {children}
    </NextIntlClientProvider>
  );
}
