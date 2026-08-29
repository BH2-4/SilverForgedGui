"use client";

import Link from "next/link";
import { ArrowRight, RotateCcw } from "lucide-react";
import { SectionLabel } from "@/components/shared/SectionLabel";
import { useI18n } from "@/components/i18n/I18nProvider";
import type { DesignBrief } from "@/lib/design/schemas";

interface ReadyToCreateProps {
  brief: DesignBrief;
  onRestart: () => void;
}

/**
 * “Ready to Create” — closes the Stage 3 loop. The brief is persisted; the
 * next action hands the customer to Stage 4 (design proposal document),
 * where the brief becomes a customer-facing proposal. Image generation
 * remains a later stage.
 */
export function ReadyToCreate({ brief, onRestart }: ReadyToCreateProps) {
  const { t } = useI18n();

  return (
    <section className="glass-panel flex flex-col gap-8 rounded-[var(--radius-lg)] p-8 sm:p-10">
      <SectionLabel>{t("designTranslation.readyLabel")}</SectionLabel>
      <div className="flex flex-col gap-4">
        <h3 className="font-sans text-[24px] leading-[1.15] tracking-[-0.01em] text-[var(--color-ivory)] sm:text-[28px]">
          {brief.heritage_reference
            ? t("designTranslation.readyTitleGrounded")
            : t("designTranslation.readyTitlePlain")}
        </h3>
        <p className="max-w-2xl text-[14px] leading-relaxed text-[var(--color-silver-300)]">
          {t("designTranslation.readyBody")}
        </p>
      </div>
      <div className="flex flex-col gap-4 pt-4 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          onClick={onRestart}
          className="inline-flex items-center gap-2 text-[12px] tracking-[0.14em] text-[var(--color-silver-400)] uppercase transition-colors hover:text-[var(--color-ivory)]"
        >
          <RotateCcw className="h-3.5 w-3.5" strokeWidth={1.5} />
          {t("common.actions.startOver")}
        </button>
        <Link
          href="/design-proposal"
          className="group inline-flex items-center gap-3 rounded-full border border-[var(--color-line-strong)] bg-[rgba(231,226,211,0.06)] px-7 py-3.5 text-[12px] font-medium tracking-[0.16em] text-[var(--color-ivory)] uppercase transition-colors hover:border-[var(--color-accent)]"
        >
          {t("common.actions.viewProposal")}
          <ArrowRight
            className="h-4 w-4 transition-colors group-hover:text-[var(--color-accent)]"
            strokeWidth={1.5}
          />
        </Link>
      </div>
      <div className="text-[11px] tracking-[0.22em] text-[var(--color-silver-600)] uppercase">
        {t("designTranslation.readyNextTitle")}
      </div>
    </section>
  );
}
