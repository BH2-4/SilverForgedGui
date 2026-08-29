"use client";

import { ArrowUpRight, Check } from "lucide-react";
import { MATCH_WEIGHTS } from "@/lib/heritage/types";
import type {
  ClaimLevel,
  CulturalMatchResult,
  ScoreDimension,
  SourceRef,
} from "@/lib/heritage/types";
import { useI18n } from "@/components/i18n/I18nProvider";

interface HeritageDirectionCardProps {
  match: CulturalMatchResult;
  sourceRefs: SourceRef[];
  rank: number;
  /** When provided, the card renders as selectable for the Stage 3 hand-off. */
  selection?: {
    selected: boolean;
    onSelect: () => void;
  };
}

const DIMENSION_KEYS: Record<ScoreDimension, string> = {
  visual_style_fit: "values.scoreDimension.visual_style_fit",
  product_fit: "values.scoreDimension.product_fit",
  wearability_fit: "values.scoreDimension.wearability_fit",
  regional_fit: "values.scoreDimension.regional_fit",
  keyword_fit: "values.scoreDimension.keyword_fit",
  evidence_confidence: "values.scoreDimension.evidence_confidence",
};

function ScoreBar({ dimension, value }: { dimension: ScoreDimension; value: number }) {
  const { t } = useI18n();
  const max = MATCH_WEIGHTS[dimension];
  const pct = Math.round((value / max) * 100);
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-[10px] tracking-[0.14em] text-[var(--color-silver-500)] uppercase">
          {t(DIMENSION_KEYS[dimension])}
        </span>
        <span className="font-mono text-[10px] text-[var(--color-silver-400)]">
          {value.toFixed(1)} / {max}
        </span>
      </div>
      <div className="h-1 overflow-hidden rounded-full bg-[rgba(255,255,255,0.06)]">
        <div
          className="h-full rounded-full bg-[linear-gradient(90deg,var(--color-silver-400),var(--color-silver-100))]"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

/**
 * One ranked heritage direction. Everything factual on this card comes
 * from the dataset with sources; the "why" section is labeled AI rationale.
 *
 * Structural enums (type / evidence level / meaning status) are localized
 * via the values.* dictionary layer; entity names, regions, reasons and
 * evidence strings are knowledge-base data and remain verbatim.
 */
export function HeritageDirectionCard({
  match,
  sourceRefs,
  rank,
  selection,
}: HeritageDirectionCardProps) {
  const { t, tv } = useI18n();
  const dimensions = Object.keys(MATCH_WEIGHTS) as ScoreDimension[];
  const sources = match.source_ids
    .map((id) => sourceRefs.find((s) => s.id === id))
    .filter((s): s is SourceRef => s !== undefined);

  const meaningLabel = tv("meaningStatus", match.meaning_status);
  const meaningOk = match.meaning_status === "documented";

  // Region honesty (RULE-002): when no county can be confirmed, render the
  // fallback label instead of forcing an attribution.
  const regionLabel = match.region_info.unattributed
    ? t("culturalMatch.card.regionFallback")
    : match.region;

  const claimLevelLabel = tv("claimLevel", match.claim_level);

  return (
    <article
      className={`glass-panel flex flex-col gap-8 rounded-[var(--radius-lg)] p-8 transition-[border-color,box-shadow] sm:p-10 ${selection?.selected
        ? "border-[rgba(231,226,211,0.4)] shadow-[0_0_0_1px_rgba(231,226,211,0.25)]"
        : ""
        }`}
    >
      {/* Identity row */}
      <div className="flex flex-wrap items-start justify-between gap-6">
        <div className="flex min-w-0 flex-col gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <span className="font-mono text-[10px] tracking-[0.2em] text-[var(--color-silver-600)]">
              {String(rank).padStart(2, "0")}
            </span>
            <span className="text-[10px] tracking-[0.22em] text-[var(--color-silver-500)] uppercase">
              {tv("matchType", match.type)}
            </span>
            {regionLabel && (
              <span className="rounded-full border border-[var(--color-line)] px-2.5 py-0.5 text-[10px] tracking-[0.12em] text-[var(--color-silver-300)]">
                {regionLabel}
              </span>
            )}
          </div>
          <h3 className="font-editorial text-3xl leading-[1.1] tracking-[-0.01em] text-[var(--color-ivory)] sm:text-4xl">
            {match.name}
          </h3>
        </div>
        <div className="text-right">
          <div className="text-[10px] tracking-[0.22em] text-[var(--color-silver-500)] uppercase">
            {t("common.labels.match")}
          </div>
          <div className="font-editorial text-4xl leading-none text-[var(--color-ivory)] sm:text-5xl">
            {match.match_score}
            <span className="text-[var(--color-silver-500)]">%</span>
          </div>
        </div>
      </div>

      {/* Match sources — the three-layer "why" contract.
          A. cultural facts  (traceable, official record)
          B. interpretation  (aesthetic affinity — labeled AI-side)
          C. suggestions     (AI design proposal — labeled, never factual) */}
      <div className="flex flex-col gap-5">
        <span className="text-[10px] tracking-[0.22em] text-[var(--color-silver-500)] uppercase">
          {t("culturalMatch.card.matchSourceLabel")}
        </span>

        {/* Customer preference tokens */}
        {match.why.preference_links.length > 0 && (
          <div className="flex flex-col gap-2">
            <span className="text-[10px] tracking-[0.18em] text-[var(--color-silver-600)] uppercase">
              {t("culturalMatch.card.preferenceLabel")}
            </span>
            <div className="flex flex-wrap gap-2">
              {match.why.preference_links.map((token) => (
                <span
                  key={token}
                  className="rounded-full border border-[var(--color-line)] px-2.5 py-0.5 text-[11px] tracking-[0.08em] text-[var(--color-silver-200)]"
                >
                  {token}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Layer B — design interpretation */}
        {match.why.visual_links.length > 0 && (
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3">
              <span className="text-[10px] tracking-[0.18em] text-[var(--color-silver-600)] uppercase">
                {t("culturalMatch.card.visualLinkLabel")}
              </span>
              <span className="text-[9px] tracking-[0.16em] text-[var(--color-silver-600)] uppercase">
                {t("culturalMatch.card.interpretationBadge")}
              </span>
            </div>
            <ul className="flex flex-col gap-2.5">
              {match.why.visual_links.map((item, i) => (
                <li
                  key={i}
                  className="flex gap-3 text-[13px] leading-relaxed text-[var(--color-silver-200)]"
                >
                  <span
                    aria-hidden
                    className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-[var(--color-silver-400)]"
                  />
                  {t(item.key, item.vars)}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Layer A — cultural facts, each traceable to a source */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <span className="text-[10px] tracking-[0.18em] text-[var(--color-silver-600)] uppercase">
              {t("culturalMatch.card.factLabel")}
            </span>
            <span className="text-[9px] tracking-[0.16em] text-[var(--color-silver-600)] uppercase">
              {t("common.badges.officialRecord")}
            </span>
          </div>
          <ul className="flex flex-col gap-3">
            {match.why.cultural_facts.map((fact, i) => (
              <li key={i} className="flex flex-col gap-1.5">
                <p className="text-[13px] leading-relaxed text-[var(--color-silver-300)]">
                  {fact.claim}
                </p>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                  <span className="text-[10px] tracking-[0.1em] text-[var(--color-silver-500)] uppercase">
                    {t("culturalMatch.card.claimLevelLabel")} ·{" "}
                    <span className="text-[var(--color-silver-300)]">
                      {tv("claimLevel", fact.claimLevel)}
                    </span>
                  </span>
                  {fact.sourceId && fact.citation && (
                    <a
                      href={fact.citation}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="group inline-flex items-center gap-1 text-[10px] tracking-[0.06em] text-[var(--color-silver-500)] transition-colors hover:text-[var(--color-silver-200)]"
                      title={fact.sourceTitle ?? undefined}
                    >
                      <span className="font-mono">{fact.sourceId}</span>
                      <ArrowUpRight
                        className="h-3 w-3 shrink-0 opacity-50 transition-opacity group-hover:opacity-100"
                        strokeWidth={1.5}
                      />
                    </a>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Layer C — AI design suggestions */}
        {match.why.design_suggestions.length > 0 && (
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3">
              <span className="text-[10px] tracking-[0.18em] text-[var(--color-silver-600)] uppercase">
                {t("culturalMatch.card.suggestionLabel")}
              </span>
              <span className="text-[9px] tracking-[0.16em] text-[var(--color-silver-600)] uppercase">
                {t("common.badges.aiRationale")}
              </span>
            </div>
            <ul className="flex flex-col gap-2.5">
              {match.why.design_suggestions.map((item, i) => (
                <li
                  key={i}
                  className="flex gap-3 text-[13px] leading-relaxed text-[var(--color-silver-200)]"
                >
                  <span
                    aria-hidden
                    className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-[var(--color-silver-400)]"
                  />
                  {t(item.key, item.vars)}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Cultural boundary — what the data does NOT support */}
        <p className="border-l border-[var(--color-line-strong)] pl-4 text-[12px] leading-relaxed text-[var(--color-silver-400)]">
          {t("culturalMatch.card.boundaryLabel")} ·{" "}
          {t(match.why.cultural_boundary, { entity: match.name })}
        </p>
      </div>

      {/* Score breakdown — the transparent scoring model */}
      <div className="flex flex-col gap-4">
        <span className="text-[10px] tracking-[0.22em] text-[var(--color-silver-500)] uppercase">
          {t("culturalMatch.card.scoreLabel")}
        </span>
        <div className="grid grid-cols-1 gap-x-10 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
          {dimensions.map((dim) => (
            <ScoreBar
              key={dim}
              dimension={dim}
              value={match.score_breakdown_weighted[dim]}
            />
          ))}
        </div>
      </div>

      {/* Evidence level, meaning status, sources */}
      <div className="flex flex-col gap-3 border-t border-[var(--color-line)] pt-6">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[11px] tracking-[0.1em] text-[var(--color-silver-400)]">
          <span className="uppercase">
            {t("common.labels.evidence")} ·{" "}
            <span className="text-[var(--color-silver-200)]">
              {tv("evidenceLevel", match.evidence_level)}
            </span>
          </span>
          <span className="uppercase">
            {t("culturalMatch.card.claimLevelLabel")} ·{" "}
            <span className="text-[var(--color-silver-200)]">
              {claimLevelLabel}
            </span>
          </span>
          <span
            className={`uppercase ${meaningOk
              ? "text-[var(--color-accent)]"
              : "text-[var(--color-silver-500)]"
              }`}
          >
            {meaningLabel}
          </span>
        </div>
        <div className="flex flex-wrap gap-x-6 gap-y-2">
          {sources.map((source) => (
            <a
              key={source.id}
              href={source.url}
              target="_blank"
              rel="noreferrer noopener"
              className="group inline-flex items-center gap-1.5 text-[11px] tracking-[0.06em] text-[var(--color-silver-500)] transition-colors hover:text-[var(--color-silver-200)]"
              title={source.publisher}
            >
              <span className="font-mono text-[10px]">{source.id}</span>
              <span className="max-w-[280px] truncate">{source.title}</span>
              <ArrowUpRight
                className="h-3 w-3 shrink-0 opacity-50 transition-opacity group-hover:opacity-100"
                strokeWidth={1.5}
              />
            </a>
          ))}
        </div>
      </div>

      {selection && (
        <div className="flex border-t border-[var(--color-line)] pt-6">
          <button
            type="button"
            onClick={selection.onSelect}
            aria-pressed={selection.selected}
            className={`inline-flex items-center gap-2.5 rounded-full border px-6 py-3 text-[11px] font-medium tracking-[0.14em] uppercase transition-all duration-300 active:scale-[0.97] ${selection.selected
              ? "border-[rgba(231,226,211,0.45)] bg-[linear-gradient(180deg,var(--color-silver-100),var(--color-silver-300))] text-[var(--color-bg)]"
              : "border-[var(--color-line-strong)] text-[var(--color-silver-200)] hover:border-[rgba(231,226,211,0.35)] hover:text-[var(--color-ivory)]"
              }`}
          >
            <Check
              className={`h-3.5 w-3.5 ${selection.selected ? "opacity-100" : "opacity-40"}`}
              strokeWidth={1.5}
              aria-hidden
            />
            {selection.selected
              ? t("common.actions.selectedForTranslation")
              : t("common.actions.useThisDirection")}
          </button>
        </div>
      )}
    </article>
  );
}
