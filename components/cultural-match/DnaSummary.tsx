"use client";

import { SectionLabel } from "@/components/shared/SectionLabel";
import { useI18n } from "@/components/i18n/I18nProvider";
import type { GlobalDesignBrief } from "@/lib/ai/schemas";

interface DnaSummaryProps {
  brief: GlobalDesignBrief;
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-2 border-t border-[var(--color-line)] pt-4">
      <span className="text-[11px] tracking-[0.22em] text-[var(--color-silver-500)] uppercase">
        {label}
      </span>
      <span className="font-sans text-[18px] leading-[1.2] tracking-[-0.005em] text-[var(--color-ivory)]">
        {value}
      </span>
    </div>
  );
}

/**
 * YOUR DESIGN DNA — condensed view of the Stage-1 brief. Explicitly labeled
 * as AI inference to keep it separated from heritage facts (RULE-005).
 * Business values are localized for display only — the brief itself is untouched.
 */
export function DnaSummary({ brief }: DnaSummaryProps) {
  const { t, tv } = useI18n();

  const unspecified = tv("shared", "unknown");
  const joinTokens = (category: string, tokens: string[]) =>
    tokens.length === 0
      ? unspecified
      : tokens.map((token) => tv(category, token)).join(" · ");

  return (
    <section className="flex flex-col gap-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <SectionLabel>{t("globalDemand.resultDnaLabel")}</SectionLabel>
        <span className="text-[11px] tracking-[0.22em] text-[var(--color-silver-600)] uppercase">
          {t("common.badges.stage1AiInference")}
        </span>
      </div>

      <div className="glass-panel grid grid-cols-2 gap-x-8 gap-y-6 rounded-[var(--radius-lg)] p-8 sm:grid-cols-3 lg:grid-cols-6">
        <Stat label={t("common.labels.market")} value={tv("market", brief.market)} />
        <Stat
          label={t("common.labels.product")}
          value={tv("product", brief.product_type)}
        />
        <Stat label={t("common.labels.style")} value={joinTokens("style", brief.style)} />
        <Stat
          label={t("common.labels.occasion")}
          value={tv("occasion", brief.occasion)}
        />
        <Stat
          label={t("common.labels.emotion")}
          value={joinTokens("emotion", brief.emotion)}
        />
        <Stat
          label={t("common.labels.wearability")}
          value={tv("shared", brief.wearability)}
        />
      </div>
    </section>
  );
}
