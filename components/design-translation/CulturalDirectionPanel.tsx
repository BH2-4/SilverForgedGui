"use client";

import { SectionLabel } from "@/components/shared/SectionLabel";
import { useI18n } from "@/components/i18n/I18nProvider";
import type { CulturalMatchResult } from "@/lib/heritage/types";
import type { DesignBrief } from "@/lib/design/schemas";

interface CulturalDirectionPanelProps {
  match: CulturalMatchResult | null;
  brief: DesignBrief;
}

/**
 * CULTURAL DIRECTION — the heritage match this translation is grounded in.
 * Facts shown here are the SERVER-DERIVED strings from the Design Brief
 * (never the client hand-off payload), so provenance is intact.
 *
 * EXPERIENCE LAYER：编辑级展陈——身份行 + 契合细线（弱化分数）+
 * 含义状态一行。论文式证据块与来源清单不再面向消费者展示；文献事实
 * 与来源仍完整保留在 Design Brief 数据层，供文化护栏与内部验证使用。
 */
export function CulturalDirectionPanel({
  match,
  brief,
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

      <div className="flex flex-col gap-8">
        {reference ? (
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
              <h3 className="act-title">{reference.name}</h3>
              <span className="text-[12px] tracking-[0.1em] text-[var(--color-silver-500)] uppercase">
                {tv("meaningStatus", reference.meaning_status)}
              </span>
            </div>
            {match && (
              <div className="fit-line min-w-[160px]">
                <span className="text-[10px] tracking-[0.2em] text-[var(--color-silver-500)] uppercase">
                  {t("culturalMatch.card.fitLabel")}
                </span>
                <span
                  className="fit-line-bar"
                  style={{ "--fit": `${match.match_score}%` } as React.CSSProperties}
                  aria-hidden
                />
                <span className="font-mono text-[11px] text-[var(--color-silver-400)]">
                  {match.match_score}
                </span>
              </div>
            )}
          </div>
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
