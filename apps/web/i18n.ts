import { getRequestConfig } from "next-intl/server";
import { messages as allMessages, type Locale } from "@freestyle/locales";

export default getRequestConfig(async ({ locale }) => {
  const safeLocale: Locale =
    locale === "en" || locale === "es" ? (locale as Locale) : "en";
  return {
    locale: safeLocale,
    messages: allMessages[safeLocale],
  };
});
