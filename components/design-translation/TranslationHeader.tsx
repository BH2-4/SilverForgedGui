"use client";

import Link from "next/link";
import { SectionLabel } from "@/components/shared/SectionLabel";
import { useI18n } from "@/components/i18n/I18nProvider";

/**
 * Header for the Design Translation studio. Mirrors the earlier stages'
 * visual language and states the pipeline lineage explicitly.
 */
export function TranslationHeader() {
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
          <span className="inline-flex items-center gap-2 rounded-full border border-[var(--color-line-strong)] bg-[rgba(231,226,211,0.06)] px-3 py-1 text-[10px] tracking-[0.18em] text-[var(--color-accent)] uppercase">
            <span
              aria-hidden
              className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--color-accent)]"
            />
            {t("common.badges.sourceFirst")}
          </span>
          <span className="eyebrow hidden sm:inline">
            {t("designTranslation.studioEyebrow")}
          </span>
        </div>
      </div>

      <div className="hairline" aria-hidden />

      <div className="flex flex-col gap-8 pt-4">
        <SectionLabel>{t("designTranslation.engineLabel")}</SectionLabel>
        <div className="max-w-3xl animate-fade-in">
          <h1 className="type-h1">
            {t("designTranslation.headerTitle")}
          </h1>
          <p className="type-body mt-6 max-w-xl">
            {t("designTranslation.headerSubtitle")}
          </p>
        </div>
        <nav
          aria-label={t("common.navAria")}
          className="flex flex-wrap items-center gap-3 text-[10px] tracking-[0.2em] uppercase"
        >
          <Link
            href="/global-design"
            className="text-[var(--color-silver-500)] transition-colors hover:text-[var(--color-silver-200)]"
          >
            {t("common.stages.globalDemand")}
          </Link>
          <span aria-hidden className="h-px w-6 bg-[var(--color-line-strong)]" />
          <Link
            href="/cultural-match"
            className="text-[var(--color-silver-500)] transition-colors hover:text-[var(--color-silver-200)]"
          >
            {t("common.stages.culturalMatch")}
          </Link>
          <span aria-hidden className="h-px w-6 bg-[var(--color-line-strong)]" />
          <span className="text-[var(--color-accent)]">
            {t("common.stages.designTranslation")}
          </span>
          <span aria-hidden className="h-px w-6 bg-[var(--color-line)]" />
          <Link
            href="/design-proposal"
            className="text-[var(--color-silver-500)] transition-colors hover:text-[var(--color-silver-200)]"
          >
            {t("common.stages.designProposal")}
          </Link>
        </nav>
      </div>
    </header>
  );
}
