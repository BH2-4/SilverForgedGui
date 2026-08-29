"use client";

import { LOCALES, LOCALE_LABELS } from "@/lib/i18n/config";
import { useI18n } from "@/components/i18n/I18nProvider";

/**
 * Editorial language selector — quiet text links separated by hairline
 * slashes, no flags, no bulky buttons. The active locale is rendered in
 * ivory; the rest stay muted silver until hovered.
 *
 * Clicking re-renders the entire site in the new locale instantly (cookie
 * + React state, no reload).
 */
export function LanguageSwitcher({ className }: { className?: string }) {
  const { locale, setLocale } = useI18n();

  return (
    <nav
      aria-label="Language"
      className={`flex items-center gap-3 text-[13px] tracking-[0.14em] uppercase ${className ?? ""}`}
    >
      {LOCALES.map((loc, i) => {
        const active = locale === loc;
        return (
          <span key={loc} className="flex items-center gap-3">
            {i > 0 && (
              <span
                aria-hidden
                className="h-px w-2.5 bg-[var(--color-line-strong)]"
              />
            )}
            <button
              type="button"
              lang={loc}
              onClick={() => setLocale(loc)}
              aria-current={active ? "true" : undefined}
              className={`transition-colors duration-300 ${
                active
                  ? "cursor-default text-[var(--color-ivory)]"
                  : "cursor-pointer text-[var(--color-silver-500)] hover:text-[var(--color-silver-200)]"
              }`}
            >
              {LOCALE_LABELS[loc]}
            </button>
          </span>
        );
      })}
    </nav>
  );
}
