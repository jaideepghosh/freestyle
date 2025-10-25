export type Messages = Record<string, string>;

import en from "./en.json";
import es from "./es.json";

export { en, es };

export const messages = { en, es } as const;
export type Locale = keyof typeof messages;

export function getMessages(locale: Locale): Messages {
  return messages[locale] ?? en;
}
