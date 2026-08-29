"use client";

import { ShieldCheck } from "lucide-react";
import { SectionLabel } from "@/components/shared/SectionLabel";
import { useI18n } from "@/components/i18n/I18nProvider";
import type { GuardrailResult } from "@/lib/heritage/types";

interface GuardrailPanelProps {
  guardrail: GuardrailResult;
}

/**
 * CULTURAL GUARDRAIL — the six compliance checks rendered as a pass/fail
 * list, plus honest warnings (meaning-not-documented disclosures).
 *
 * Rule types and rule ids are translated structurally (values.ruleType) —
 * semantic consistency is preserved across locales. Engine-generated
 * `message` / `warnings` strings are provenance data and stay verbatim.
 */
export function GuardrailPanel({ guardrail }: GuardrailPanelProps) {
  const { t, tv } = useI18n();

  return (
    <section className="flex flex-col gap-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <SectionLabel>{t("culturalMatch.guardrailTitle")}</SectionLabel>
        <span
          className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[10px] tracking-[0.18em] uppercase ${guardrail.passed
            ? "border-[rgba(231,226,211,0.25)] text-[var(--color-accent)]"
            : "border-red-500/30 text-red-300/90"
            }`}
        >
          <ShieldCheck
            className="h-3.5 w-3.5"
            strokeWidth={1.5}
            aria-hidden
          />
          {guardrail.passed
            ? t("culturalMatch.guardrailAllPassed")
            : t("culturalMatch.guardrailFailed")}
        </span>
      </div>

      <div className="glass-panel flex flex-col gap-5 rounded-[var(--radius-lg)] p-8">
        <ul className="flex flex-col gap-3.5">
          {guardrail.checks.map((check) => (
            <li key={check.rule_id} className="flex items-start gap-3">
              <span
                aria-hidden
                className={`mt-[3px] font-mono text-[11px] ${check.passed
                  ? "text-[var(--color-accent)]"
                  : "text-red-300/80"
                  }`}
              >
                {check.passed ? "✓" : "✕"}
              </span>
              <div className="flex min-w-0 flex-col gap-1">
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <span className="text-[12px] tracking-[0.1em] text-[var(--color-silver-200)]">
                    {check.passed
                      ? t("culturalMatch.guardrailCheckPassed")
                      : t("culturalMatch.guardrailCheckFailed")}{" "}
                    · {tv("ruleType", check.rule_type)}
                  </span>
                  <span className="font-mono text-[9px] tracking-[0.16em] text-[var(--color-silver-600)] uppercase">
                    {check.rule_id}
                  </span>
                </div>
                <p className="text-[12px] leading-relaxed text-[var(--color-silver-500)]">
                  {check.message}
                </p>
              </div>
            </li>
          ))}
        </ul>

        {guardrail.warnings.length > 0 && (
          <div className="flex flex-col gap-2 border-t border-[var(--color-line)] pt-5">
            <span className="text-[10px] tracking-[0.22em] text-[var(--color-silver-500)] uppercase">
              {t("culturalMatch.disclosuresLabel")}
            </span>
            <ul className="flex flex-col gap-1.5">
              {guardrail.warnings.map((warning, i) => (
                <li
                  key={i}
                  className="text-[12px] leading-relaxed text-[var(--color-silver-400)]"
                >
                  {warning}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}
