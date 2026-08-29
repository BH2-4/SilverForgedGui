"use client";

import { Bot } from "lucide-react";
import { SectionLabel } from "@/components/shared/SectionLabel";
import { useI18n } from "@/components/i18n/I18nProvider";
import { Disclosure } from "@/components/shared/Disclosure";
import type { DesignBrief } from "@/lib/design/schemas";

interface DesignBriefPanelProps {
  brief: DesignBrief;
}

/**
 * EXPERIENCE LAYER · Design Reveal（Stage 3 最终简报）
 *
 * 先看到设计：标题 → 一句定位 → 风格标签。消费者页面不再展示论文式
 * 文化证据块——文献事实、来源与证据层级仍完整保留在 Design Brief 数据
 * 层（documented_cultural_facts / evidence_sources），供文化护栏、
 * 内部验证与后续审计使用。AI 设计解释与生成提示词收进「阅读完整设计
 * 日志」渐进披露。
 */
export function DesignBriefPanel({ brief }: DesignBriefPanelProps) {
  const { t, tv } = useI18n();

  return (
    <section className="flex flex-col gap-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <SectionLabel>{t("designTranslation.briefLabel")}</SectionLabel>
        <span className="text-[11px] tracking-[0.22em] text-[var(--color-silver-600)] uppercase">
          {t("common.labels.confidence")}{" "}
          {Math.round(brief.confidence * 100)}%
        </span>
      </div>

      <article className="flex flex-col gap-10">
        {/* Title + positioning */}
        <div className="flex flex-col gap-5">
          <h3 className="act-title">{brief.design_title}</h3>
          <p className="max-w-2xl text-[14px] leading-relaxed text-[var(--color-silver-300)]">
            {brief.consumer_profile}
          </p>
          <div className="flex flex-wrap gap-2">
            {brief.style_direction.map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-[var(--color-line)] px-3 py-1 text-[11px] tracking-[0.14em] text-[var(--color-silver-300)] uppercase"
              >
                {tv("style", tag)}
              </span>
            ))}
          </div>
        </div>

        {/* AI 设计解释 + 生成提示词 —— 渐进披露 */}
        <Disclosure label={t("common.actions.readDesignLog")}>
          <div className="flex flex-col gap-8">
            {/* AI design interpretation — visually segregated */}
            <div className="flex flex-col gap-4 border-t border-dashed border-[var(--color-line-strong)] pt-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="text-[11px] tracking-[0.22em] text-[var(--color-silver-500)] uppercase">
                  {t("designTranslation.interpretationLabel")}
                </span>
                <span className="inline-flex items-center gap-1.5 text-[10px] tracking-[0.18em] text-[var(--color-silver-400)] uppercase">
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
                <p className="text-[12px] leading-relaxed text-[var(--color-silver-500)]">
                  {t("designTranslation.discardedNote", {
                    items: brief.discarded_symbolic_inputs.join(", "),
                  })}
                </p>
              )}
            </div>

            {/* Prompts for the next stage */}
            <div className="flex flex-col gap-5 border-t border-[var(--color-line)] pt-6">
              <div className="flex items-center justify-between">
                <span className="text-[11px] tracking-[0.22em] text-[var(--color-silver-500)] uppercase">
                  {t("designTranslation.generationPromptLabel")}
                </span>
                <span className="text-[10px] tracking-[0.18em] text-[var(--color-silver-600)] uppercase">
                  {t("designTranslation.generationPromptNote")}
                </span>
              </div>
              <pre className="overflow-x-auto rounded-[var(--radius-md)] border border-[var(--color-line)] bg-[rgba(0,0,0,0.3)] p-5 font-mono text-[12px] leading-relaxed whitespace-pre-wrap text-[var(--color-silver-300)]">
                {brief.generation_prompt}
              </pre>
              <div className="flex items-center justify-between pt-2">
                <span className="text-[11px] tracking-[0.22em] text-[var(--color-silver-500)] uppercase">
                  {t("designTranslation.negativePromptLabel")}
                </span>
                <span className="text-[10px] tracking-[0.18em] text-[var(--color-silver-600)] uppercase">
                  {t("designTranslation.negativePromptNote")}
                </span>
              </div>
              <pre className="overflow-x-auto rounded-[var(--radius-md)] border border-[var(--color-line)] bg-[rgba(0,0,0,0.3)] p-5 font-mono text-[12px] leading-relaxed whitespace-pre-wrap text-[var(--color-silver-400)]">
                {brief.negative_prompt}
              </pre>
            </div>
          </div>
        </Disclosure>
      </article>
    </section>
  );
}
