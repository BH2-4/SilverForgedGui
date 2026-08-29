"use client";

import { ArrowRight, RotateCcw } from "lucide-react";
import { SectionLabel } from "@/components/shared/SectionLabel";
import { useI18n } from "@/components/i18n/I18nProvider";
import { Disclosure } from "@/components/shared/Disclosure";
import type { GlobalDesignBrief } from "@/lib/ai/schemas";

interface DesignBriefResultProps {
  brief: GlobalDesignBrief;
  onReset: () => void;
  onContinue: () => void;
}

/**
 * EXPERIENCE LAYER · Design Reveal
 *
 * Stage 1 的结果不再以「报告表格」铺开，而是先给出 AI 的一句话理解，
 * 再以展签（design-attr）呈现关键属性；完整设计基因收进渐进披露，
 * 用户需要时才展开。业务数据（brief）一字不改。
 */
export function DesignBriefResult({
  brief,
  onReset,
  onContinue,
}: DesignBriefResultProps) {
  const { t, tv } = useI18n();
  const confidencePct = Math.round(brief.confidence * 100);

  /** Business values are localized for display only — the brief itself is untouched. */
  const signals = [
    ...brief.style.map((s) => tv("style", s)),
    ...brief.emotion.map((e) => tv("emotion", e)),
    brief.wearability !== "unknown"
      ? t("globalDemand.signalWear", { value: tv("shared", brief.wearability) })
      : null,
    brief.cultural_visibility !== "unknown"
      ? t("globalDemand.signalVisibility", {
        value: tv("shared", brief.cultural_visibility),
      })
      : null,
  ].filter((s): s is string => Boolean(s));

  // 第一层 —— 展签式关键属性
  const keyAttrs: Array<{ label: string; value: string }> = [
    { label: t("common.labels.market"), value: tv("market", brief.market) },
    { label: t("common.labels.product"), value: tv("product", brief.product_type) },
    { label: t("common.labels.occasion"), value: tv("occasion", brief.occasion) },
    { label: t("common.labels.style"), value: joinTokens(tv, "style", brief.style) },
    { label: t("common.labels.emotion"), value: joinTokens(tv, "emotion", brief.emotion) },
    {
      label: t("common.labels.culturalVisibility"),
      value: tv("shared", brief.cultural_visibility),
    },
  ];

  // 第二层 —— 完整设计基因（渐进披露）
  const fullDna: Array<{ label: string; value: string }> = [
    { label: t("common.labels.wearability"), value: tv("shared", brief.wearability) },
    { label: t("common.labels.complexity"), value: tv("shared", brief.complexity) },
    { label: t("common.labels.size"), value: tv("shared", brief.size_preference) },
    { label: t("common.labels.weight"), value: tv("shared", brief.weight_preference) },
    {
      label: t("common.labels.priceSensitivity"),
      value: tv("shared", brief.price_sensitivity),
    },
  ];

  return (
    <div className="animate-fade-in flex flex-col gap-16 py-6">
      {/* ─────────────  Reveal hero —— 结果标题  ───────────── */}
      <section className="flex flex-col gap-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <SectionLabel>{t("globalDemand.resultDnaLabel")}</SectionLabel>
          <span className="text-[11px] tracking-[0.22em] text-[var(--color-silver-600)] uppercase">
            {t("common.labels.confidence")} {confidencePct}%
          </span>
        </div>
        <h2 className="act-title">{t("globalDemand.resultTitle")}</h2>
      </section>

      {/* ─────────────  一句话 —— AI 的理解  ───────────── */}
      <section className="flex flex-col gap-6">
        <SectionLabel>{t("globalDemand.aiInterpretationLabel")}</SectionLabel>
        <p className="font-sans max-w-3xl text-[22px] leading-[1.35] text-[var(--color-ivory)] sm:text-[24px]">
          {brief.reasoning}
        </p>
        {brief.cultural_interest && brief.cultural_interest !== "unknown" && (
          <p className="max-w-2xl text-[13px] leading-relaxed text-[var(--color-silver-400)]">
            {t("globalDemand.culturalStance")} · {brief.cultural_interest}
          </p>
        )}
      </section>

      {/* ─────────────  关键属性 —— 展签网格  ───────────── */}
      <section className="flex flex-col gap-6">
        <SectionLabel>{t("globalDemand.resultDnaLabel")}</SectionLabel>
        <div className="grid grid-cols-2 gap-x-8 gap-y-2 sm:grid-cols-3">
          {keyAttrs.map((attr) => (
            <div className="design-attr" key={attr.label}>
              <span className="design-attr-label">{attr.label}</span>
              <span className="design-attr-value">{attr.value}</span>
            </div>
          ))}
        </div>
        <Disclosure label={t("common.actions.viewFullDna")}>
          <div className="flex flex-col gap-8">
            <div className="grid grid-cols-2 gap-x-8 gap-y-2 sm:grid-cols-3">
              {fullDna.map((attr) => (
                <div className="design-attr" key={attr.label}>
                  <span className="design-attr-label">{attr.label}</span>
                  <span className="design-attr-value">{attr.value}</span>
                </div>
              ))}
            </div>
            <div className="design-attr">
              <span className="design-attr-label">
                {t("common.labels.consumerProfile")}
              </span>
              <span className="max-w-2xl text-[14px] leading-relaxed text-[var(--color-silver-200)]">
                {brief.consumer_profile}
              </span>
            </div>
          </div>
        </Disclosure>
      </section>

      {/* ─────────────  Design Signals  ───────────── */}
      <section className="flex flex-col gap-6">
        <SectionLabel>{t("globalDemand.signalsLabel")}</SectionLabel>
        <div className="flex flex-wrap gap-2.5">
          {signals.length === 0 ? (
            <span className="text-[13px] text-[var(--color-silver-500)]">
              {t("globalDemand.signalsEmpty")}
            </span>
          ) : (
            signals.map((s) => (
              <span key={s} className="chip" data-selected="true">
                {s}
              </span>
            ))
          )}
        </div>
        {brief.avoid.length > 0 && (
          <div className="flex flex-col gap-3 pt-4">
            <span className="text-[11px] tracking-[0.22em] text-[var(--color-silver-500)] uppercase">
              {t("globalDemand.avoidLabel")}
            </span>
            <div className="flex flex-wrap gap-2.5">
              {brief.avoid.map((a) => (
                <span
                  key={a}
                  className="rounded-full border border-dashed border-[var(--color-line-strong)] px-3.5 py-1.5 text-[12px] tracking-[0.08em] text-[var(--color-silver-400)] uppercase"
                >
                  {a.replace(/[-_]/g, " ")}
                </span>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* ─────────────  What Comes Next —— 编辑级收尾  ───────────── */}
      <section className="flex flex-col gap-8 border-t border-[var(--color-line)] pt-12">
        <div className="flex flex-col gap-4">
          <SectionLabel>{t("globalDemand.whatComesNextLabel")}</SectionLabel>
          <h3 className="font-sans text-[24px] leading-[1.15] tracking-[-0.01em] text-[var(--color-ivory)] sm:text-[28px]">
            {t("globalDemand.whatComesNextTitle")}
          </h3>
          <p className="max-w-2xl text-[14px] leading-relaxed text-[var(--color-silver-300)]">
            {t("globalDemand.whatComesNextBody")}
          </p>
        </div>

        <div className="flex flex-col gap-4 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            onClick={onReset}
            className="inline-flex items-center gap-2 text-[12px] tracking-[0.14em] text-[var(--color-silver-400)] uppercase transition-colors hover:text-[var(--color-ivory)]"
          >
            <RotateCcw className="h-3.5 w-3.5" strokeWidth={1.5} />
            {t("common.actions.startOver")}
          </button>
          <button
            type="button"
            onClick={onContinue}
            data-variant="solid"
            className="journey-cta"
          >
            {t("common.actions.continueToCulturalMatch")}
            <ArrowRight className="h-4 w-4" strokeWidth={1.5} />
          </button>
        </div>
        <div className="text-[11px] tracking-[0.22em] text-[var(--color-silver-600)] uppercase">
          {t("globalDemand.stage2Ready")}
        </div>
      </section>
    </div>
  );
}

type TvFn = (category: string, value: string) => string;

function joinTokens(tv: TvFn, category: string, tokens: string[]): string {
  if (!tokens || tokens.length === 0) return tv("shared", "unknown");
  return tokens.map((token) => tv(category, token)).join(" · ");
}
