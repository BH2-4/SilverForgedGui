"use client";

import { SectionLabel } from "@/components/shared/SectionLabel";
import { useI18n } from "@/components/i18n/I18nProvider";
import type { ReasoningChain } from "@/lib/design/schemas";

interface ReasoningPanelProps {
  chain: ReasoningChain;
}

function Layer({
  label,
  note,
  items,
}: {
  label: string;
  note?: string;
  items: React.ReactNode[];
}) {
  return (
    <div className="flex flex-col gap-4 border-t border-[var(--color-line)] pt-6">
      <div className="flex flex-col gap-1">
        <span className="text-[10px] tracking-[0.22em] text-[var(--color-silver-500)] uppercase">
          {label}
        </span>
        {note ? (
          <span className="text-[11px] leading-relaxed text-[var(--color-silver-600)]">
            {note}
          </span>
        ) : null}
      </div>
      <ul className="flex flex-col gap-2.5">
        {items.map((item, i) => (
          <li
            key={i}
            className="text-[14px] leading-relaxed text-[var(--color-silver-300)]"
          >
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * SECTION 02 — 「为什么是这些方向？」
 *
 * The four-layer chain, each layer explicitly labeled and kept strictly
 * separate: customer preferences (from the interview), design inference
 * (AI translating preferences into design signals), cultural evidence
 * (verbatim from the verified knowledge base), and design possibilities.
 */
export function ReasoningPanel({ chain }: ReasoningPanelProps) {
  const { t, tv } = useI18n();

  const preferences = chain.customer_preferences.map((token, i) => (
    <span key={i} className="font-editorial text-[16px] tracking-[0.02em] text-[var(--color-ivory)]">
      {token}
    </span>
  ));

  const signals = chain.design_signals.map((item, i) => (
    <span key={i}>{t(`designDirections.signal.${item.key}`, item.vars)}</span>
  ));

  const cultural = chain.cultural_directions.map((direction, i) => (
    <span key={i}>
      {direction.name}
      {direction.region ? ` · ${direction.region}` : ""} ·{" "}
      <span className="text-[var(--color-silver-500)]">
        {direction.match_score}/100
      </span>
    </span>
  ));

  const possibilities = chain.design_possibilities.map((item, i) => (
    <span key={i}>
      {t(`designDirections.possibility.${item.key}`, item.vars)}
    </span>
  ));

  return (
    <section className="flex flex-col gap-8">
      <SectionLabel>{t("designDirections.section2Label")}</SectionLabel>
      <h2 className="font-editorial max-w-2xl text-[28px] leading-[1.1] tracking-[-0.01em] text-[var(--color-ivory)] sm:text-[34px]">
        {t("designDirections.section2Title")}
      </h2>
      <p className="max-w-xl text-[12px] leading-relaxed text-[var(--color-silver-600)]">
        {t("designDirections.layerNote")}
      </p>

      <div className="flex flex-col gap-6">
        <Layer label={t("designDirections.layerPreferences")} items={preferences} />
        <Layer label={t("designDirections.layerSignals")} items={signals} />
        <Layer label={t("designDirections.layerCultural")} items={cultural} />
        <Layer label={t("designDirections.layerPossibilities")} items={possibilities} />
      </div>
    </section>
  );
}
