"use client";

import { ArrowUpRight } from "lucide-react";
import { SectionLabel } from "@/components/shared/SectionLabel";
import { useI18n } from "@/components/i18n/I18nProvider";
import type { CulturalMatchResult, SourceRef } from "@/lib/heritage/types";
import type { DesignBrief } from "@/lib/design/schemas";

interface CulturalDirectionPanelProps {
  match: CulturalMatchResult | null;
  brief: DesignBrief;
  sourceRefs: SourceRef[];
}

/**
 * CULTURAL DIRECTION — the heritage match this translation is grounded in.
 * Facts shown here are the SERVER-DERIVED strings from the Design Brief
 * (never the client hand-off payload), so provenance is intact.
 *
 * Structural enums (type / evidence level / meaning status) are localized
 * via the values.* layer; factual strings stay verbatim.
 */
export function CulturalDirectionPanel({
  match,
  brief,
  sourceRefs,
}: CulturalDirectionPanelProps) {
  const { t, tv } = useI18n();
  const reference = brief.heritage_reference;

  return (
    <section className="flex flex-col gap-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <SectionLabel>{t("designTranslation.directionLabel")}</SectionLabel>
        <span className="text-[11px] tracking-[0.22em] text-[var(--color-silver-600)] uppercase">
          {t("designTranslation.directionMetaLabel")}
        </span>
      </div>

      <div className="glass-panel flex flex-col gap-8 rounded-[var(--radius-lg)] p-8 sm:p-10">
        {reference ? (
          <>
            <div className="flex flex-wrap items-start justify-between gap-6">
              <div className="flex min-w-0 flex-col gap-3">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-[11px] tracking-[0.22em] text-[var(--color-silver-500)] uppercase">
                    {tv("matchType", reference.type)}
                  </span>
                  {reference.region && (
                    <span className="rounded-full border border-[var(--color-line)] px-2.5 py-0.5 text-[11px] tracking-[0.12em] text-[var(--color-silver-300)]">
                      {reference.region}
                    </span>
                  )}
                  <span className="font-mono text-[11px] tracking-[0.16em] text-[var(--color-silver-600)]">
                    {reference.match_id}
                  </span>
                </div>
                <h3 className="font-sans text-[24px] leading-[1.1] tracking-[-0.01em] text-[var(--color-ivory)] sm:text-[28px]">
                  {reference.name}
                </h3>
              </div>
              {match && (
                <div className="text-right">
                  <div className="text-[11px] tracking-[0.22em] text-[var(--color-silver-500)] uppercase">
                    {t("common.labels.match")}
                  </div>
                  <div className="font-sans text-[28px] leading-none text-[var(--color-ivory)]">
                    {match.match_score}
                    <span className="text-[var(--color-silver-500)]">%</span>
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-4 border-t border-[var(--color-line)] pt-6">
              <div className="flex items-center justify-between">
                <span className="text-[11px] tracking-[0.22em] text-[var(--color-silver-500)] uppercase">
                  {t("culturalMatch.card.evidenceLabel")}
                </span>
                <span className="text-[10px] tracking-[0.18em] text-[var(--color-silver-600)] uppercase">
                  {t("common.badges.officialRecord")}
                </span>
              </div>
              <ul className="flex flex-col gap-2.5">
                {brief.documented_cultural_facts.map((fact, i) => (
                  <li
                    key={i}
                    className="flex flex-col gap-1.5 text-[13px] leading-relaxed text-[var(--color-silver-300)]"
                  >
                    <span>{fact.fact}</span>
                    <span className="flex flex-wrap items-center gap-3 text-[11px] tracking-[0.1em] text-[var(--color-silver-500)]">
                      <span className="font-mono uppercase">
                        {tv("evidenceLevel", fact.evidence_level)}
                      </span>
                      {fact.source_ids.map((id) => (
                        <span key={id} className="font-mono">
                          {id}
                        </span>
                      ))}
                    </span>
                  </li>
                ))}
              </ul>
              <span className="text-[12px] tracking-[0.1em] text-[var(--color-silver-500)] uppercase">
                {tv("meaningStatus", reference.meaning_status)}
              </span>
            </div>

            {sourceRefs.length > 0 && (
              <div className="flex flex-col gap-3 border-t border-[var(--color-line)] pt-6">
                <span className="text-[11px] tracking-[0.22em] text-[var(--color-silver-500)] uppercase">
                  {t("designTranslation.verifiedSourcesLabel")}
                </span>
                <div className="flex flex-wrap gap-x-6 gap-y-2">
                  {sourceRefs.map((source) => (
                    <a
                      key={source.id}
                      href={source.url}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="group inline-flex items-center gap-1.5 text-[12px] tracking-[0.06em] text-[var(--color-silver-500)] transition-colors hover:text-[var(--color-silver-200)]"
                      title={source.publisher}
                    >
                      <span className="font-mono text-[11px]">{source.id}</span>
                      <span className="max-w-[280px] truncate">{source.title}</span>
                      <ArrowUpRight
                        className="h-3 w-3 shrink-0 opacity-50 transition-opacity group-hover:opacity-100"
                        strokeWidth={1.5}
                      />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-col gap-3">
            <h3 className="font-sans text-2xl leading-[1.15] text-[var(--color-silver-200)]">
              {t("designTranslation.noDirectionTitle")}
            </h3>
            <p className="max-w-xl text-[13px] leading-relaxed text-[var(--color-silver-500)]">
              {t("designTranslation.noDirectionBody")}
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
