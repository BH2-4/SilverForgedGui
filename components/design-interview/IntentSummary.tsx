"use client";

import { ArrowRight, RotateCcw } from "lucide-react";
import { useI18n } from "@/components/i18n/I18nProvider";
import type { UserDesignIntent } from "@/lib/design-interview/intent-types";

type Props = {
  intent: UserDesignIntent;
  source: "ai" | "rule";
  onRestart: () => void;
  onContinue: () => void;
  continuing: boolean;
};

/**
 * 完成摘要：以设计工作室「Brief Review」的形式呈现 UserDesignIntent。
 * 只呈现用户偏好本身，不含任何文化结论——文化匹配完全留给 Stage 2。
 * 文案与词条来自 messages/*.json 的 interview 段。
 */
export function IntentSummary({
  intent,
  source,
  onRestart,
  onContinue,
  continuing,
}: Props) {
  const { t } = useI18n();
  const confidencePct = Math.round(intent.confidence * 100);

  const value = (category: string, token: string): string => {
    const key = `interview.values.${category}.${token}`;
    const label = t(key);
    if (label === key) return token;
    return token === "unknown" ? t("interview.values.unknown") : label;
  };

  const joinOrDash = (category: string, tokens: string[]): string => {
    if (tokens.length === 0) return "—";
    return tokens.map((token) => value(category, token)).join(" · ");
  };

  const orDash = (category: string, token: string): string =>
    token === "unknown" ? "—" : value(category, token);

  const Fact = ({
    label,
    display,
    dim,
  }: {
    label: string;
    display: string;
    dim?: boolean;
  }) => (
    <div className="flex flex-col gap-1.5 border-t border-l border-[var(--color-line)] p-4 first:border-l-0 sm:p-5">
      <span className="font-mono text-[10px] tracking-[0.18em] text-[var(--color-silver-500)] uppercase">
        {label}
      </span>
      <span
        className={`text-[13px] ${dim ? "text-[var(--color-silver-600)]" : "text-[var(--color-silver-200)]"}`}
      >
        {display}
      </span>
    </div>
  );

  return (
    <section className="animate-fade-in flex flex-col gap-8">
      <h2 className="font-editorial text-3xl leading-[1.2] tracking-[-0.01em] text-[var(--color-ivory)] sm:text-4xl">
        {t("interview.summaryTitle")}
      </h2>

      <blockquote className="rounded-[0_var(--radius-md)_var(--radius-md)_0] border-l-2 border-[var(--color-silver-300)] bg-[rgba(255,255,255,0.03)] px-6 py-5">
        <p className="font-editorial text-[15px] leading-[1.9] text-[var(--color-silver-200)]">
          {intent.user_context}
        </p>
        <span className="mt-3 block font-mono text-[10px] tracking-[0.16em] text-[var(--color-silver-500)] uppercase">
          {t("interview.userContextLabel")} ·{" "}
          {source === "ai"
            ? t("interview.sourceAi")
            : t("interview.sourceRule")}{" "}
          · {t("interview.confidence", { value: confidencePct })}
        </span>
      </blockquote>

      <div className="grid grid-cols-1 overflow-hidden rounded-[var(--radius-md)] border border-[var(--color-line)] bg-[rgba(255,255,255,0.015)] sm:grid-cols-2">
        <Fact
          label={t("interview.fields.occasion")}
          display={orDash("occasion", intent.occasion)}
          dim={intent.occasion === "unknown"}
        />
        <Fact
          label={t("interview.fields.product")}
          display={orDash("product", intent.product_type)}
          dim={intent.product_type === "unknown"}
        />
        <Fact
          label={t("interview.fields.style")}
          display={joinOrDash("style", intent.style)}
          dim={intent.style.length === 0}
        />
        <Fact
          label={t("interview.fields.emotion")}
          display={joinOrDash("emotion", intent.emotional_direction)}
          dim={intent.emotional_direction.length === 0}
        />
        <Fact
          label={t("interview.fields.presence")}
          display={orDash("visibility", intent.visual_presence)}
          dim={intent.visual_presence === "unknown"}
        />
        <Fact
          label={t("interview.fields.scale")}
          display={orDash("size", intent.scale)}
          dim={intent.scale === "unknown"}
        />
        <Fact
          label={t("interview.fields.weight")}
          display={orDash("weight", intent.weight)}
          dim={intent.weight === "unknown"}
        />
        <Fact
          label={t("interview.fields.wearability")}
          display={orDash("wearability", intent.wearability)}
          dim={intent.wearability === "unknown"}
        />
        <Fact
          label={t("interview.fields.material")}
          display={joinOrDash("material", intent.material_preference)}
          dim={intent.material_preference.length === 0}
        />
        <Fact
          label={t("interview.fields.form")}
          display={joinOrDash("form", intent.form_preference)}
          dim={intent.form_preference.length === 0}
        />
      </div>

      <div className="flex items-center gap-4">
        <span className="font-mono text-[10px] tracking-[0.18em] text-[var(--color-silver-500)] uppercase">
          {t("interview.confidenceLabel")}
        </span>
        <div className="h-0.5 flex-1 overflow-hidden rounded-full bg-[rgba(255,255,255,0.08)]">
          <div
            className="h-full rounded-full bg-[linear-gradient(90deg,var(--color-silver-500),var(--color-silver-200))] transition-[width] duration-700"
            style={{ width: `${confidencePct}%` }}
          />
        </div>
        <span className="font-mono text-[12px] tracking-[0.1em] text-[var(--color-silver-400)]">
          {confidencePct}%
        </span>
      </div>

      <div className="flex flex-col items-start gap-5 border-t border-[var(--color-line)] pt-8">
        <button
          type="button"
          onClick={onContinue}
          disabled={continuing}
          className="group inline-flex items-center gap-3 rounded-full border border-[var(--color-line-strong)] bg-[linear-gradient(180deg,var(--color-silver-100),var(--color-silver-300))] px-8 py-4 text-[12px] font-medium tracking-[0.18em] text-[var(--color-bg)] uppercase transition-all duration-300 hover:brightness-105 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-40"
        >
          {continuing
            ? t("interview.continuing")
            : t("interview.continueToStage1")}
          <ArrowRight
            className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5"
            strokeWidth={1.5}
          />
        </button>
        <p className="max-w-md text-[12px] leading-relaxed text-[var(--color-silver-500)]">
          {t("interview.summaryNote")}
        </p>
        <button
          type="button"
          onClick={onRestart}
          className="inline-flex items-center gap-2 text-[11px] tracking-[0.16em] text-[var(--color-silver-500)] uppercase transition-colors duration-200 hover:text-[var(--color-silver-300)]"
        >
          <RotateCcw className="h-3.5 w-3.5" strokeWidth={1.5} />
          {t("interview.restart")}
        </button>
      </div>
    </section>
  );
}
