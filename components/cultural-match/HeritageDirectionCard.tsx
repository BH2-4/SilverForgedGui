"use client";

import { useCallback, useId, useState } from "react";
import { ArrowUpRight, Check } from "lucide-react";
import type {
  CulturalMatchResult,
  SourceRef,
} from "@/lib/heritage/types";
import { useI18n } from "@/components/i18n/I18nProvider";
import { Disclosure } from "@/components/shared/Disclosure";
import { archiveImageFor } from "./archive-images";

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

/**
 * EXPERIENCE LAYER · Archive card
 *
 * Stage 2 的文化对象不再以「报告条目」呈现，而是黑色档案馆中的一件
 * 展品：默认只露出影像、名称与契合线；点击影像进入焦点模式，信息
 * 才逐层展开（一句话 → WHY THIS MATCH → 证据与来源）。
 *
 * 业务契约不变：所有事实仍来自数据集与来源引用；「为什么匹配」是
 * AI 推断并明确标注。选择逻辑与 Stage 3 hand-off 完全保留。
 */
export function HeritageDirectionCard({
  match,
  sourceRefs,
  rank,
  selection,
}: HeritageDirectionCardProps) {
  const { t, tv } = useI18n();
  const [focused, setFocused] = useState(false);
  const panelId = useId();

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
  const image = archiveImageFor(match.id, match.type);

  // First-layer narrative: one sentence only. Prefer the engine's visual
  // link (the story ↔ culture connection); fall back to the first
  // documented cultural fact. Never invent new statements.
  const firstVisual = match.why.visual_links[0];
  const firstFact = match.why.cultural_facts[0];
  const oneLiner = firstVisual
    ? t(firstVisual.key, firstVisual.vars)
    : firstFact?.claim;

  const onImageClick = useCallback(() => {
    setFocused((v) => !v);
  }, []);

  return (
    <article
      className={`archive-card flex flex-col ${focused ? "lg:col-span-2" : ""}`}
      data-selected={selection?.selected ?? false}
      data-focused={focused}
    >
      {/* ---------------------------------------------------------------
          影像层 —— 黑色空间中的展品。点击进入 / 退出焦点模式。
         --------------------------------------------------------------- */}
      <button
        type="button"
        className="archive-card-image block w-full cursor-pointer text-left"
        aria-expanded={focused}
        aria-controls={panelId}
        onClick={onImageClick}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- 静态馆藏资源，非远程图片 */}
        <img
          src={image}
          alt={`${t("culturalMatch.card.archiveImageNote")} · ${match.name}`}
          loading="lazy"
        />
        <span className="absolute right-4 top-4 z-10 font-mono text-[10px] tracking-[0.22em] text-[var(--color-silver-500)] uppercase">
          {t("culturalMatch.card.archiveImageNote")}
        </span>

        {/* 默认信息 —— 名称 + 契合线，其余留给探索 */}
        <div className="absolute inset-x-0 bottom-0 z-10 flex flex-col gap-3 p-6 sm:p-7">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
            <span className="font-mono text-[11px] tracking-[0.2em] text-[var(--color-silver-500)]">
              {String(rank).padStart(2, "0")}
            </span>
            <span className="text-[10px] tracking-[0.22em] text-[var(--color-silver-400)] uppercase">
              {tv("matchType", match.type)}
            </span>
            {match.product_compatibility !== "exact" && (
              <span className="rounded-full border border-[var(--color-line)] px-2 py-0.5 text-[9px] tracking-[0.16em] text-[var(--color-silver-500)] uppercase">
                {t(`culturalMatch.card.compatibility.${match.product_compatibility}`)}
              </span>
            )}
            {regionLabel && (
              <span className="text-[10px] tracking-[0.14em] text-[var(--color-silver-300)]">
                {regionLabel}
              </span>
            )}
          </div>
          <h3 className="font-sans text-[22px] leading-[1.1] tracking-[-0.01em] text-[var(--color-ivory)] sm:text-[24px]">
            {match.name}
          </h3>
          <div className="flex items-center gap-4">
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
        </div>
      </button>

      {/* ---------------------------------------------------------------
          信息层 —— 仅焦点模式下展开：一句话 → WHY → 证据与来源。
         --------------------------------------------------------------- */}
      {focused && (
        <div
          id={panelId}
          className="animate-fade-in flex flex-col gap-7 p-6 sm:p-8"
        >
          {/* 第一层 —— 一句话 */}
          {oneLiner && (
            <div className="flex flex-col gap-2">
              {firstVisual && (
                <span className="text-[10px] tracking-[0.2em] text-[var(--color-silver-600)] uppercase">
                  {t("culturalMatch.card.interpretationBadge")}
                </span>
              )}
              <p className="max-w-2xl text-[15px] leading-relaxed text-[var(--color-silver-100)]">
                {oneLiner}
              </p>
            </div>
          )}

          {/* 第二层 —— WHY THIS MATCH（渐进披露） */}
          <Disclosure label={t("culturalMatch.card.whyThisMatch")}>
            <div className="flex flex-col gap-7">
              {/* Customer preference tokens */}
              {match.why.preference_links.length > 0 && (
                <div className="flex flex-col gap-2">
                  <span className="text-[11px] tracking-[0.18em] text-[var(--color-silver-600)] uppercase">
                    {t("culturalMatch.card.preferenceLabel")}
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {match.why.preference_links.map((token) => (
                      <span
                        key={token}
                        className="rounded-full border border-[var(--color-line)] px-2.5 py-0.5 text-[12px] tracking-[0.08em] text-[var(--color-silver-200)]"
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
                    <span className="text-[11px] tracking-[0.18em] text-[var(--color-silver-600)] uppercase">
                      {t("culturalMatch.card.visualLinkLabel")}
                    </span>
                    <span className="text-[10px] tracking-[0.16em] text-[var(--color-silver-600)] uppercase">
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
              {match.why.cultural_facts.length > 0 && (
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-3">
                    <span className="text-[11px] tracking-[0.18em] text-[var(--color-silver-600)] uppercase">
                      {t("culturalMatch.card.factLabel")}
                    </span>
                    <span className="text-[10px] tracking-[0.16em] text-[var(--color-silver-600)] uppercase">
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
                          <span className="text-[11px] tracking-[0.1em] text-[var(--color-silver-500)] uppercase">
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
                              className="group inline-flex items-center gap-1 text-[11px] tracking-[0.06em] text-[var(--color-silver-500)] transition-colors hover:text-[var(--color-silver-200)]"
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
              )}

              {/* Layer C — AI design suggestions */}
              {match.why.design_suggestions.length > 0 && (
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-3">
                    <span className="text-[11px] tracking-[0.18em] text-[var(--color-silver-600)] uppercase">
                      {t("culturalMatch.card.suggestionLabel")}
                    </span>
                    <span className="text-[10px] tracking-[0.16em] text-[var(--color-silver-600)] uppercase">
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
            </div>
          </Disclosure>

          {/* 第三层 —— 证据等级 / 意义状态 / 来源 */}
          <div className="flex flex-col gap-3 border-t border-[var(--color-line)] pt-6">
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[12px] tracking-[0.1em] text-[var(--color-silver-400)]">
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

          {/* 把这份文化带进设计 */}
          {selection && (
            <div className="flex flex-wrap items-center gap-4">
              <button
                type="button"
                onClick={selection.onSelect}
                aria-pressed={selection.selected}
                data-variant={selection.selected ? "solid" : undefined}
                className="journey-cta"
              >
                {selection.selected && (
                  <Check className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden />
                )}
                {selection.selected
                  ? t("common.actions.selectedForTranslation")
                  : t("culturalMatch.card.carryForward")}
              </button>
            </div>
          )}
        </div>
      )}
    </article>
  );
}
