"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import {
  DEFAULT_LOCALE,
  LOCALE_COOKIE,
  LOCALE_HTML_TAGS,
  isLocale,
} from "@/lib/i18n/config";
import { translate, translateApiError, translateValue } from "@/lib/i18n/dictionaries";
import type { Locale } from "@/lib/i18n/config";

/**
 * Instant, reload-free language switching.
 *
 * The provider is seeded with the locale resolved server-side (cookie or
 * Accept-Language), so the first client render matches SSR exactly.
 * Switching calls setState — React re-renders every consumer immediately —
 * while the cookie write makes the choice survive reloads and new tabs.
 */

type Vars = Record<string, string | number>;

interface I18nContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, vars?: Vars) => string;
  /** Translate a business-data enum value (display only, never mutates data). */
  tv: (category: string, value: string) => string;
  /** Translate an API error code, degrading to the server message. */
  tApiError: (code: string | undefined, fallback: string) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({
  initialLocale,
  children,
}: {
  initialLocale: Locale;
  children: React.ReactNode;
}) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    if (typeof document !== "undefined") {
      document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`;
      document.documentElement.lang = LOCALE_HTML_TAGS[next];
    }
  }, []);

  const t = useCallback(
    (key: string, vars?: Vars) => translate(locale, key, vars),
    [locale],
  );

  const tv = useCallback(
    (category: string, value: string) => translateValue(locale, category, value),
    [locale],
  );

  const tApiError = useCallback(
    (code: string | undefined, fallback: string) =>
      translateApiError(locale, code, fallback),
    [locale],
  );

  const value = useMemo<I18nContextValue>(
    () => ({ locale, setLocale, t, tv, tApiError }),
    [locale, setLocale, t, tv, tApiError],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error("useI18n must be used inside <I18nProvider>");
  }
  return ctx;
}

/** Safe variant for components rendered outside the provider tree. */
export function useI18nOptional(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (ctx) return ctx;
  return {
    locale: DEFAULT_LOCALE,
    setLocale: () => undefined,
    t: (key, vars) => translate(DEFAULT_LOCALE, key, vars),
    tv: (category, value) => translateValue(DEFAULT_LOCALE, category, value),
    tApiError: (code, fallback) => translateApiError(DEFAULT_LOCALE, code, fallback),
  };
}

export type { Locale };
export { isLocale };
