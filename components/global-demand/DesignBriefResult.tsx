"use client";

import { ArrowRight, RotateCcw } from "lucide-react";
import { SectionLabel } from "@/components/shared/SectionLabel";
import { useI18n } from "@/components/i18n/I18nProvider";
import type { GlobalDesignBrief } from "@/lib/ai/schemas";

interface DesignBriefResultProps {
  brief: GlobalDesignBrief;
  onReset: () => void;
  onContinue: () => void;
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-2 border-t border-[var(--color-line)] pt-4">
      <span className="text-[10px] tracking-[0.22em] text-[var(--color-silver-500)] uppercase">
        {label}
      </span>
      <span className="font-editorial text-[22px] leading-[1.15] tracking-[-0.005em] text-[var(--color-ivory)]">
        {value}
      </span>
    </div>
  );
}

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

  return (
    <div className="animate-fade-in flex flex-col gap-16 py-6">
      {/* ─────────────────────  Design DNA  ───────────────────── */}
      <section className="flex flex-col gap-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <SectionLabel className="mb-6">
              {t("globalDemand.resultDnaLabel")}
            </SectionLabel>
            <h2 className="font-editorial text-4xl leading-[1.05] tracking-[-0.02em] text-[var(--color-ivory)] sm:text-5xl">
              {t("globalDemand.resultTitle")}
            </h2>
          </div>
          <div className="text-right">
            <div className="text-[10px] tracking-[0.22em] text-[var(--color-silver-500)] uppercase">
              {t("common.labels.confidence")}
            </div>
            <div className="font-editorial text-3xl text-[var(--color-ivory)]">
              {confidencePct}
              <span className="text-[var(--color-silver-500)]">%</span>
            </div>
          </div>
        </div>

        <div className="glass-panel grid grid-cols-2 gap-x-8 gap-y-6 rounded-[var(--radius-lg)] p-8 sm:grid-cols-3 lg:grid-cols-4">
          <Stat label={t("common.labels.market")} value={tv("market", brief.market)} />
          <Stat
            label={t("common.labels.product")}
            value={tv("product", brief.product_type)}
          />
          <Stat
            label={t("common.labels.occasion")}
            value={tv("occasion", brief.occasion)}
          />
          <Stat
            label={t("common.labels.style")}
            value={joinTokens(tv, "style", brief.style)}
          />
          <Stat
            label={t("common.labels.emotion")}
            value={joinTokens(tv, "emotion", brief.emotion)}
          />
          <Stat
            label={t("common.labels.culturalVisibility")}
            value={tv("shared", brief.cultural_visibility)}
          />
          <Stat
            label={t("common.labels.wearability")}
            value={tv("shared", brief.wearability)}
          />
          <Stat
            label={t("common.labels.complexity")}
            value={tv("shared", brief.complexity)}
          />
          <Stat
            label={t("common.labels.size")}
            value={tv("shared", brief.size_preference)}
          />
          <Stat
            label={t("common.labels.weight")}
            value={tv("shared", brief.weight_preference)}
          />
          <Stat
            label={t("common.labels.priceSensitivity")}
            value={tv("shared", brief.price_sensitivity)}
          />
          <div className="col-span-2 flex flex-col gap-2 border-t border-[var(--color-line)] pt-4 sm:col-span-3 lg:col-span-1">
            <span className="text-[10px] tracking-[0.22em] text-[var(--color-silver-500)] uppercase">
              {t("common.labels.consumerProfile")}
            </span>
            <span className="text-[14px] leading-relaxed text-[var(--color-silver-200)]">
              {brief.consumer_profile}
            </span>
          </div>
        </div>
      </section>

      {/* ─────────────────  AI Interpretation  ───────────────── */}
      <section className="flex flex-col gap-6">
        <SectionLabel>{t("globalDemand.aiInterpretationLabel")}</SectionLabel>
        <p className="font-editorial max-w-3xl text-[26px] leading-[1.35] text-[var(--color-ivory)] sm:text-[30px]">
          {brief.reasoning}
        </p>
        {brief.cultural_interest && brief.cultural_interest !== "unknown" && (
          <p className="max-w-2xl text-[13px] leading-relaxed text-[var(--color-silver-400)]">
            {t("globalDemand.culturalStance")} · {brief.cultural_interest}
          </p>
        )}
      </section>

      {/* ─────────────────  Design Signals  ──────────────────── */}
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
            <span className="text-[10px] tracking-[0.22em] text-[var(--color-silver-500)] uppercase">
              {t("globalDemand.avoidLabel")}
            </span>
            <div className="flex flex-wrap gap-2.5">
              {brief.avoid.map((a) => (
                <span
                  key={a}
                  className="rounded-full border border-dashed border-[var(--color-line-strong)] px-3.5 py-1.5 text-[11px] tracking-[0.08em] text-[var(--color-silver-400)] uppercase"
                >
                  {a.replace(/[-_]/g, " ")}
                </span>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* ─────────────────  What Comes Next  ─────────────────── */}
      <section className="glass-panel flex flex-col gap-8 rounded-[var(--radius-lg)] p-8 sm:p-10">
        <SectionLabel>{t("globalDemand.whatComesNextLabel")}</SectionLabel>
        <div className="flex flex-col gap-4">
          <h3 className="font-editorial text-3xl leading-[1.15] tracking-[-0.01em] text-[var(--color-ivory)] sm:text-4xl">
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
            className="group inline-flex items-center gap-3 rounded-full border border-[var(--color-line-strong)] bg-[linear-gradient(180deg,var(--color-silver-100),var(--color-silver-300))] px-7 py-3.5 text-[12px] font-medium tracking-[0.16em] text-[var(--color-bg)] uppercase transition-all duration-300 hover:brightness-105 active:scale-[0.97]"
          >
            {t("common.actions.continueToCulturalMatch")}
            <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" strokeWidth={1.5} />
          </button>
        </div>
        <div className="text-[10px] tracking-[0.22em] text-[var(--color-silver-600)] uppercase">
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
