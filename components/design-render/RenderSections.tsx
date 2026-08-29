"use client";

import { ArrowUpRight } from "lucide-react";
import { SectionLabel } from "@/components/shared/SectionLabel";
import { useI18n } from "@/components/i18n/I18nProvider";
import { Disclosure } from "@/components/shared/Disclosure";
import type { ImagePrompt } from "@/lib/design/render-prompt";
import type {
  DesignProposal,
  ProposalCulturalSource,
} from "@/lib/design/schemas";

/* -------------------------------------------------------------------------- */
/*  Shared presentational bits                                                 */
/* -------------------------------------------------------------------------- */

function SourceChip({ id }: { id: string }) {
  return (
    <span className="rounded-full border border-[var(--color-line)] px-2 py-0.5 font-mono text-[11px] tracking-[0.04em] text-[var(--color-silver-400)]">
      {id}
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/*  SECTION 01 — AI 设计效果图                                                  */
/* -------------------------------------------------------------------------- */

interface RenderImageProps {
  imageUrl: string;
  prompt: ImagePrompt;
  model: string;
}

export function RenderImage({ imageUrl, prompt, model }: RenderImageProps) {
  const { t, tv } = useI18n();

  return (
    <section className="flex flex-col gap-10">
      <SectionLabel>{t("designRender.renderLabel")}</SectionLabel>
      <figure className="exhibition-plinth relative mx-auto flex w-full max-w-3xl flex-col items-center">
        <span
          aria-hidden
          className="exhibition-caption absolute -left-2 top-1/2 hidden -translate-y-1/2 lg:block xl:-left-10"
        >
          Design
        </span>
        <span
          aria-hidden
          className="exhibition-caption absolute -right-2 top-1/2 hidden -translate-y-1/2 rotate-180 lg:block xl:-right-10"
        >
          Culture
        </span>
        <div className="exhibition-frame exhibition-emerge w-full">
          {/* eslint-disable-next-line @next/next/no-img-element — data URL, not a remote asset */}
          <img
            src={imageUrl}
            alt={t("designRender.imageAlt")}
            className="mx-auto block h-auto max-h-[64vh] w-auto max-w-full object-contain"
          />
        </div>
        <figcaption className="mt-10 flex w-full max-w-2xl flex-col gap-6">
          <div className="flex flex-col gap-2 border-t border-[var(--color-line)] pt-6">
            <span className="exhibit-row flex items-baseline gap-5">
              <span className="exhibit-label w-28 shrink-0">
                {t("designRender.field.subject")}
              </span>
              <span className="text-[14px] text-[var(--color-ivory)]">
                {tv("product", prompt.form.product_type)} ·{" "}
                {t(`designProposal.tier.${prompt.vision.visual_style}`)}
              </span>
            </span>
            <span className="exhibit-row flex items-baseline gap-5">
              <span className="exhibit-label w-28 shrink-0">
                {t("designRender.field.finish")}
              </span>
              <span className="text-[14px] text-[var(--color-silver-200)]">
                {tv("renderFinish", prompt.material.finish)}
              </span>
            </span>
            <span className="exhibit-row flex items-baseline gap-5">
              <span className="exhibit-label w-28 shrink-0">
                {t("designRender.field.craft")}
              </span>
              <span className="text-[14px] text-[var(--color-silver-200)]">
                {prompt.craft.primary} · {tv("shared", prompt.craft.fineness)}
              </span>
            </span>
          </div>

          <Disclosure label={t("common.actions.viewDesignStory")}>
            <div className="flex flex-col gap-3">
              <span className="text-[11px] tracking-[0.18em] text-[var(--color-silver-500)] uppercase">
                {t("designRender.aiNoticeLabel")}
              </span>
              <p className="text-[13px] leading-relaxed text-[var(--color-silver-300)]">
                {t("designRender.aiNoticeBody")}
              </p>
              <p className="text-[12px] leading-relaxed text-[var(--color-silver-400)]">
                {t("designRender.aiNoticeBody2")}
              </p>
              <p className="text-[12px] leading-relaxed text-[var(--color-silver-500)]">
                {t("designRender.aiNoticeBody3")}
              </p>
              <span className="pt-1 font-mono text-[11px] tracking-[0.06em] text-[var(--color-silver-600)]">
                {t("designRender.providerNote", {
                  provider: prompt.vision.visual_style,
                  model,
                })}
              </span>
            </div>
          </Disclosure>
        </figcaption>
      </figure>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*  SECTION 02 — 为什么这样生成                                                  */
/* -------------------------------------------------------------------------- */

export function RenderWhy({ prompt }: { prompt: ImagePrompt }) {
  const { t, tv } = useI18n();

  return (
    <section className="flex flex-col gap-8">
      <SectionLabel>{t("designRender.whyLabel")}</SectionLabel>
      <div className="flex flex-col gap-4">
        <h2 className="font-sans max-w-2xl text-[22px] leading-[1.15] tracking-[-0.01em] text-[var(--color-ivory)] sm:text-[24px]">
          {t("designRender.whyTitle")}
        </h2>
        <p className="max-w-xl text-[12px] leading-relaxed text-[var(--color-silver-600)]">
          {t("designRender.whyNote")}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-x-8 gap-y-2 border-t border-[var(--color-line)] pt-8 sm:grid-cols-4">
        <div className="design-attr">
          <span className="design-attr-label">{t("designRender.field.subject")}</span>
          <span className="design-attr-value">
            {tv("product", prompt.form.product_type)} ·{" "}
            {t(`designProposal.tier.${prompt.vision.visual_style}`)}
          </span>
        </div>
        <div className="design-attr">
          <span className="design-attr-label">{t("designRender.field.scale")}</span>
          <span className="design-attr-value">
            {tv("shared", prompt.form.scale)} · {tv("thickness", prompt.form.thickness)}
          </span>
        </div>
        <div className="design-attr">
          <span className="design-attr-label">{t("designRender.field.finish")}</span>
          <span className="design-attr-value">
            {tv("renderFinish", prompt.material.finish)}
          </span>
        </div>
        <div className="design-attr">
          <span className="design-attr-label">{t("designRender.field.craft")}</span>
          <span className="design-attr-value">
            {prompt.craft.primary} · {tv("shared", prompt.craft.fineness)}
          </span>
        </div>
        <div className="design-attr">
          <span className="design-attr-label">{t("designRender.field.motif")}</span>
          <span className="design-attr-value">
            {prompt.motif !== null ? prompt.motif.name : t("designTranslation.motifNone")}
          </span>
        </div>
        <div className="design-attr">
          <span className="design-attr-label">{t("designRender.field.composition")}</span>
          <span className="design-attr-value">
            {tv("arrangement", prompt.form.arrangement)} ·{" "}
            {tv("coverage", prompt.form.coverage)}
          </span>
        </div>
        <div className="design-attr">
          <span className="design-attr-label">{t("designRender.field.scene")}</span>
          <span className="design-attr-value">
            {tv("occasion", prompt.wearing_scene)}
          </span>
        </div>
        <div className="design-attr">
          <span className="design-attr-label">{t("designRender.field.vision")}</span>
          <span className="design-attr-value">{prompt.vision.camera}</span>
        </div>
      </div>

      {prompt.motif !== null && (
        <p className="max-w-xl text-[12px] leading-relaxed text-[var(--color-silver-600)]">
          {t("designTranslation.motifPresented.visual-subject")}
        </p>
      )}
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*  SECTION 03 — 文化依据                                                       */
/* -------------------------------------------------------------------------- */

function CultureCard({ card }: { card: ProposalCulturalSource }) {
  const { t, tv } = useI18n();

  return (
    <article className="flex flex-col gap-5 border-t border-[var(--color-line)] pt-6">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <div className="flex flex-wrap items-baseline gap-3">
          <h3 className="font-sans text-[18px] tracking-[0.01em] text-[var(--color-ivory)]">
            {card.entity_name}
          </h3>
          <span className="font-mono text-[12px] text-[var(--color-silver-500)]">
            {card.entity_id}
          </span>
        </div>
        <span
          className={`rounded-full border px-2.5 py-0.5 text-[11px] tracking-[0.16em] uppercase ${card.classification === "official_record"
            ? "border-[var(--color-line-strong)] text-[var(--color-accent)]"
            : "border-[var(--color-line)] text-[var(--color-silver-400)]"
            }`}
        >
          {t(`designProposal.source.classification.${card.classification}`)}
        </span>
      </div>

      <div className="flex flex-wrap gap-x-6 gap-y-2">
        <span className="text-[12px] tracking-[0.06em] text-[var(--color-silver-500)]">
          {t("designProposal.source.kind")} ·{" "}
          <span className="text-[var(--color-silver-300)]">
            {tv("matchType", card.entity_kind)}
          </span>
        </span>
        {card.region ? (
          <span className="text-[12px] tracking-[0.06em] text-[var(--color-silver-500)]">
            {t("designProposal.source.region")} ·{" "}
            <span className="text-[var(--color-silver-300)]">{card.region}</span>
          </span>
        ) : null}
        <span className="text-[12px] tracking-[0.06em] text-[var(--color-silver-500)]">
          {t("designProposal.source.evidence")} ·{" "}
          <span className="text-[var(--color-silver-300)]">
            {tv("evidenceLevel", card.evidence_level)}
          </span>
        </span>
      </div>

      <div className="flex flex-col gap-3">
        <span className="text-[11px] tracking-[0.18em] text-[var(--color-silver-500)] uppercase">
          {t("designProposal.source.facts")}
        </span>
        <ul className="flex flex-col gap-3">
          {card.facts.map((fact, i) => (
            <li key={i} className="flex flex-col gap-1.5">
              <p className="text-[13px] leading-relaxed text-[var(--color-silver-300)]">
                {fact.fact}
              </p>
              <div className="flex flex-wrap items-center gap-2">
                {fact.source_ids.map((id) => (
                  <SourceChip key={id} id={id} />
                ))}
                <span className="text-[11px] tracking-[0.1em] text-[var(--color-silver-500)] uppercase">
                  {tv("evidenceLevel", fact.evidence_level)}
                </span>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {card.source_refs.length > 0 ? (
        <div className="flex flex-col gap-2">
          <span className="text-[11px] tracking-[0.18em] text-[var(--color-silver-500)] uppercase">
            {t("designProposal.source.records")}
          </span>
          <ul className="flex flex-col gap-1.5">
            {card.source_refs.map((ref) => (
              <li key={ref.id}>
                <a
                  href={ref.url}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="group inline-flex items-center gap-1.5 text-[12px] tracking-[0.04em] text-[var(--color-silver-400)] transition-colors hover:text-[var(--color-silver-200)]"
                >
                  <span className="font-mono text-[11px]">{ref.id}</span>
                  <span>{ref.title}</span>
                  <ArrowUpRight
                    className="h-3 w-3 shrink-0 opacity-50 transition-opacity group-hover:opacity-100"
                    strokeWidth={1.5}
                  />
                </a>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <p className="border-l border-[var(--color-line-strong)] pl-4 text-[12px] leading-relaxed text-[var(--color-silver-400)]">
        {tv("meaningStatus", card.meaning_status)}
      </p>
    </article>
  );
}

export function RenderCulture({ proposal }: { proposal: DesignProposal }) {
  const { t } = useI18n();

  return (
    <section className="flex flex-col gap-8">
      <SectionLabel>{t("designRender.cultureLabel")}</SectionLabel>
      <div className="flex flex-col gap-4">
        <h2 className="font-sans max-w-2xl text-[22px] leading-[1.15] tracking-[-0.01em] text-[var(--color-ivory)] sm:text-[24px]">
          {t("designRender.cultureTitle")}
        </h2>
        <p className="max-w-xl text-[12px] leading-relaxed text-[var(--color-silver-600)]">
          {t("designRender.cultureNote")}
        </p>
      </div>
      {proposal.cultural_sources.length > 0 ? (
        <div className="flex flex-col gap-6">
          {proposal.cultural_sources.map((card) => (
            <CultureCard key={card.entity_id} card={card} />
          ))}
        </div>
      ) : (
        <p className="text-[14px] leading-relaxed text-[var(--color-silver-400)]">
          {t("designProposal.sources.none")}
        </p>
      )}
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*  SECTION 04 — 设计转译                                                       */
/* -------------------------------------------------------------------------- */

export function RenderInterpretation({ proposal }: { proposal: DesignProposal }) {
  const { t } = useI18n();

  return (
    <section className="flex flex-col gap-8">
      <SectionLabel>{t("designRender.designLabel")}</SectionLabel>
      <div className="flex flex-col gap-4">
        <h2 className="font-sans max-w-2xl text-[22px] leading-[1.15] tracking-[-0.01em] text-[var(--color-ivory)] sm:text-[24px]">
          {t("designRender.designTitle")}
        </h2>
        <p className="max-w-xl text-[12px] leading-relaxed text-[var(--color-silver-600)]">
          {t("designRender.designNote")}
        </p>
      </div>

      <div className="flex flex-col gap-4 border-t border-[var(--color-line)] pt-6">
        <div className="flex items-center gap-3">
          <span className="text-[11px] tracking-[0.18em] text-[var(--color-silver-500)] uppercase">
            {t("designTranslation.interpretationLabel")}
          </span>
          <span className="rounded-full border border-[var(--color-line)] px-2 py-0.5 text-[10px] tracking-[0.16em] text-[var(--color-silver-500)] uppercase">
            {t("common.badges.aiRationale")}
          </span>
        </div>
        <ul className="flex flex-col gap-2.5">
          {proposal.design_interpretation.statements.map((statement, i) => (
            <li
              key={i}
              className="flex gap-3 text-[13px] leading-relaxed text-[var(--color-silver-300)]"
            >
              <span
                aria-hidden
                className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-[var(--color-silver-400)]"
              />
              {statement}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
