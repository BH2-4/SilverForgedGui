import { cookies, headers } from "next/headers";
import {
  DEFAULT_LOCALE,
  LOCALE_COOKIE,
  isLocale,
  localeFromAcceptLanguageEntry,
} from "./config";
import type { Locale } from "./config";

/**
 * Server-side locale resolution for the root layout.
 *
 * Priority:
 *   1. `sf_locale` cookie  — set by the in-app switcher (persisted choice)
 *   2. `Accept-Language`    — first-visit browser language
 *   3. zh-CN                — platform default
 *
 * The resolved value is used for BOTH `<html lang>` and the client
 * provider's initial state, so SSR markup and the first client render are
 * identical — no hydration mismatch, and a reload keeps the same language.
 */
export async function resolveLocale(): Promise<Locale> {
  const cookieStore = await cookies();
  const fromCookie = cookieStore.get(LOCALE_COOKIE)?.value;
  if (isLocale(fromCookie)) return fromCookie;

  const acceptLanguage = (await headers()).get("accept-language") ?? "";
  for (const entry of acceptLanguage.split(",")) {
    const match = localeFromAcceptLanguageEntry(entry);
    if (match) return match;
  }

  return DEFAULT_LOCALE;
}
