/**
 * i18n configuration — locale registry shared by server and client.
 *
 * Supported locales: Simplified Chinese (default), English, Japanese, French.
 * The active locale is persisted in a long-lived cookie so the root layout
 * (server component) and the client provider agree on the first paint —
 * no hydration mismatch, no reload required when switching.
 */

export const LOCALES = ["zh-CN", "en", "ja", "fr"] as const;

export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "zh-CN";

export const LOCALE_COOKIE = "sf_locale";

/** Display labels used by the language switcher — no flag emojis. */
export const LOCALE_LABELS: Record<Locale, string> = {
  "zh-CN": "中文",
  en: "EN",
  ja: "日本語",
  fr: "FR",
};

/** RFC 5646 language tags for <html lang>. */
export const LOCALE_HTML_TAGS: Record<Locale, string> = {
  "zh-CN": "zh-CN",
  en: "en",
  ja: "ja",
  fr: "fr",
};

export function isLocale(value: unknown): value is Locale {
  return (
    typeof value === "string" && (LOCALES as readonly string[]).includes(value)
  );
}

/**
 * Map an `Accept-Language` entry ("fr-CA", "en-US;q=0.8", "zh-Hant") to a
 * supported locale. Returns null when nothing matches.
 */
export function localeFromAcceptLanguageEntry(entry: string): Locale | null {
  const tag = entry.split(";")[0]?.trim().toLowerCase();
  if (!tag) return null;
  if (tag.startsWith("zh")) return "zh-CN";
  const primary = tag.split("-")[0];
  if (primary === "en" || primary === "ja" || primary === "fr") return primary;
  return null;
}
