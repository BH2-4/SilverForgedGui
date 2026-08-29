"use client";

import Link from "next/link";
import { SectionLabel } from "@/components/shared/SectionLabel";
import { useI18n } from "@/components/i18n/I18nProvider";

export function MatchHeader() {
  const { t } = useI18n();

  return (
    <header className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <Link
          href="/"
          className="flex items-baseline gap-3 transition-opacity hover:opacity-80"
        >
          <span className="text-[13px] tracking-[0.32em] text-[var(--color-silver-200)]">
            SILVER
          </span>
          <span className="text-[13px] tracking-[0.32em] text-[var(--color-silver-400)]">
            FUTURE
          </span>
        </Link>
        <span className="eyebrow hidden sm:inline">
          {t("culturalMatch.studioEyebrow")}
        </span>
      </div>

      <div className="hairline" aria-hidden />

      <div className="flex flex-col gap-8 pt-4">
        <SectionLabel>{t("culturalMatch.engineLabel")}</SectionLabel>
        <div className="max-w-3xl animate-fade-in">
          <h1 className="type-h1">
            {t("culturalMatch.headerTitle")}
          </h1>
          <p className="type-body mt-6 max-w-xl">
            {t("culturalMatch.headerSubtitle")}
          </p>
        </div>
      </div>
    </header>
  );
}
