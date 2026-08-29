"use client";

import Link from "next/link";
import { SectionLabel } from "@/components/shared/SectionLabel";
import { useI18n } from "@/components/i18n/I18nProvider";

interface StudioHeaderProps {
  demoMode?: boolean;
}

export function StudioHeader({ demoMode = false }: StudioHeaderProps) {
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
        <div className="flex items-center gap-4">
          {demoMode && (
            <span className="inline-flex items-center gap-2 rounded-full border border-[var(--color-line-strong)] bg-[rgba(231,226,211,0.06)] px-3 py-1 text-[10px] tracking-[0.18em] text-[var(--color-accent)] uppercase">
              <span
                aria-hidden
                className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--color-accent)]"
              />
              {t("common.badges.demoMode")}
            </span>
          )}
          <span className="eyebrow hidden sm:inline">
            {t("globalDemand.studioEyebrow")}
          </span>
        </div>
      </div>

      <div className="hairline" aria-hidden />

      <div className="flex flex-col gap-8 pt-4">
        <SectionLabel>{t("globalDemand.engineLabel")}</SectionLabel>
        <div className="max-w-3xl animate-fade-in">
          <h1 className="type-h1">
            {t("globalDemand.headerTitle")}
          </h1>
          <p className="type-body mt-6 max-w-xl">
            {t("globalDemand.headerSubtitle")}
          </p>
        </div>
      </div>
    </header>
  );
}
