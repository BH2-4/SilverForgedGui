"use client";

import { LanguageSwitcher } from "@/components/i18n/LanguageSwitcher";

/**
 * Global utility bar rendered above every page's own header. Deliberately
 * quiet: a single hairline row whose only content is the language selector,
 * so the switcher is reachable on every route without competing with the
 * per-page editorial headers.
 */
export function SiteTopBar() {
  return (
    <div className="border-b border-[var(--color-line)]">
      <div className="mx-auto flex max-w-6xl items-center justify-end px-6 py-3 sm:px-10 lg:px-14">
        <LanguageSwitcher />
      </div>
    </div>
  );
}
