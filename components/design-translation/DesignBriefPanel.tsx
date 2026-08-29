"use client";

import { ArrowUpRight, Bot, Landmark } from "lucide-react";
import { SectionLabel } from "@/components/shared/SectionLabel";
import { useI18n } from "@/components/i18n/I18nProvider";
import type { DesignBrief } from "@/lib/design/schemas";

interface DesignBriefPanelProps {
  brief: DesignBrief;
}

/**
 * DESIGN BRIEF — the full structured output. The two content blocks are
 * visually segregated exactly like the data model: documented facts (with
 * source ids / evidence level) vs. AI DESIGN INTERPRETATION (explicitly
 * labeled, never presented as culture).
 *
 * Engine content (titles, facts, statements, prompts) stays verbatim;
 * only chrome labels and enum badges are localized.
 */
export function DesignBriefPanel({ brief }: DesignBriefPanelProps) {
  const { t, tv } = useI18n();

  return (
    <section className="flex flex-col gap-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <SectionLabel>{t("designTranslation.briefLabel")}</SectionLabel>
        <span className="text-[10px] tracking-[0.22em] text-[var(--color-silver-600)] uppercase">
          {t("common.labels.confidence")}{" "}
          {Math.round(brief.confidence * 100)}%
        </span>
      </div>

      <article className="glass-panel flex flex-col gap-10 rounded-[var(--radius-lg)] p-8 sm:p-10">
        {/* Title + positioning */}
        <div className="flex flex-col gap-5">
          <h3 className="font-editorial text-3xl leading-[1.08] tracking-[-0.01em] text-[var(--color-ivory)] sm:text-4xl">
            {brief.design_title}
          </h3>
          <p className="max-w-2xl text-[13px] leading-relaxed text-[var(--color-silver-300)]">
            {brief.consumer_profile}
          </p>
          <div className="flex flex-wrap gap-2">
            {brief.style_direction.map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-[var(--color-line)] px-3 py-1 text-[10px] tracking-[0.14em] text-[var(--color-silver-300)] uppercase"
              >
                {tv("style", tag)}
              </span>
            ))}
          </div>
        </div>

        {/* Documented cultural evidence */}
        <div className="flex flex-col gap-4 border-t border-[var(--color-line)] pt-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="text-[10px] tracking-[0.22em] text-[var(--color-silver-500)] uppercase">
              {t("designTranslation.briefDocumentedLabel")}
            </span>
            <span className="inline-flex items-center gap-1.5 text-[9px] tracking-[0.18em] text-[var(--color-accent)] uppercase">
              <Landmark className="h-3 w-3" strokeWidth={1.5} aria-hidden />
              {t("designTranslation.briefNeverAi")}
            </span>
          </div>
          {brief.documented_cultural_facts.length > 0 ? (
            <ul className="flex flex-col gap-4">
              {brief.documented_cultural_facts.map((fact, i) => (
                <li
                  key={i}
                  className="flex flex-col gap-2 border-l-2 border-[rgba(231,226,211,0.2)] pl-4"
                >
                  <span className="text-[13px] leading-relaxed text-[var(--color-silver-200)]">
                    {fact.fact}
                  </span>
                  <span className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] tracking-[0.1em] text-[var(--color-silver-500)] uppercase">
                    <span className="font-mono">
                      {tv("evidenceLevel", fact.evidence_level)}
                    </span>
                    {fact.source_ids.map((id) => (
                      <a
                        key={id}
                        href={brief.evidence_sources.find((s) => s.id === id)?.url ?? "#"}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="inline-flex items-center gap-1 font-mono text-[var(--color-silver-400)] transition-colors hover:text-[var(--color-silver-200)]"
                      >
                        {id}
                        <ArrowUpRight className="h-2.5 w-2.5" strokeWidth={1.5} aria-hidden />
                      </a>
                    ))}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-[12px] leading-relaxed text-[var(--color-silver-500)]">
              {t("designTranslation.briefNoFacts")}
            </p>
          )}
        </div>

        {/* AI design interpretation — visually segregated */}
        <div className="flex flex-col gap-4 border-t border-dashed border-[var(--color-line-strong)] pt-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="text-[10px] tracking-[0.22em] text-[var(--color-silver-500)] uppercase">
              {t("designTranslation.interpretationLabel")}
            </span>
            <span className="inline-flex items-center gap-1.5 text-[9px] tracking-[0.18em] text-[var(--color-silver-400)] uppercase">
              <Bot className="h-3 w-3" strokeWidth={1.5} aria-hidden />
              {t("designTranslation.interpretationNote")}
            </span>
          </div>
          <ul className="flex flex-col gap-2.5">
            {brief.design_interpretation.statements.map((statement, i) => (
              <li
                key={i}
                className="text-[13px] leading-relaxed text-[var(--color-silver-300)]"
              >
                {statement}
              </li>
            ))}
          </ul>
          {brief.discarded_symbolic_inputs.length > 0 && (
            <p className="text-[11px] leading-relaxed text-[var(--color-silver-500)]">
              {t("designTranslation.discardedNote", {
                items: brief.discarded_symbolic_inputs.join(", "),
              })}
            </p>
          )}
        </div>

        {/* Constraints + avoid */}
        <div className="grid grid-cols-1 gap-8 border-t border-[var(--color-line)] pt-6 lg:grid-cols-2">
          <div className="flex flex-col gap-3">
            <span className="text-[10px] tracking-[0.22em] text-[var(--color-silver-500)] uppercase">
              {t("designTranslation.constraintsLabel")}
            </span>
            <ul className="flex flex-col gap-2">
              {brief.cultural_constraints.map((constraint, i) => (
                <li
                  key={i}
                  className="text-[12px] leading-relaxed text-[var(--color-silver-400)]"
                >
                  {constraint}
                </li>
              ))}
            </ul>
          </div>
          <div className="flex flex-col gap-3">
            <span className="text-[10px] tracking-[0.22em] text-[var(--color-silver-500)] uppercase">
              {t("designTranslation.avoidLabel")}
            </span>
            <div className="flex flex-wrap gap-2">
              {brief.avoid_elements.map((element) => (
                <span
                  key={element}
                  className="rounded-full border border-red-400/20 bg-red-500/[0.05] px-3 py-1 text-[10px] tracking-[0.1em] text-red-200/70"
                >
                  {element}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Prompts for the next stage */}
        <div className="flex flex-col gap-5 border-t border-[var(--color-line)] pt-6">
          <div className="flex items-center justify-between">
            <span className="text-[10px] tracking-[0.22em] text-[var(--color-silver-500)] uppercase">
              {t("designTranslation.generationPromptLabel")}
            </span>
            <span className="text-[9px] tracking-[0.18em] text-[var(--color-silver-600)] uppercase">
              {t("designTranslation.generationPromptNote")}
            </span>
          </div>
          <pre className="overflow-x-auto rounded-[var(--radius-md)] border border-[var(--color-line)] bg-[rgba(0,0,0,0.3)] p-5 font-mono text-[11px] leading-relaxed whitespace-pre-wrap text-[var(--color-silver-300)]">
            {brief.generation_prompt}
          </pre>
          <div className="flex items-center justify-between pt-2">
            <span className="text-[10px] tracking-[0.22em] text-[var(--color-silver-500)] uppercase">
              {t("designTranslation.negativePromptLabel")}
            </span>
            <span className="text-[9px] tracking-[0.18em] text-[var(--color-silver-600)] uppercase">
              {t("designTranslation.negativePromptNote")}
            </span>
          </div>
          <pre className="overflow-x-auto rounded-[var(--radius-md)] border border-[var(--color-line)] bg-[rgba(0,0,0,0.3)] p-5 font-mono text-[11px] leading-relaxed whitespace-pre-wrap text-[var(--color-silver-400)]">
            {brief.negative_prompt}
          </pre>
        </div>
      </article>
    </section>
  );
}
