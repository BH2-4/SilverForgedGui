"use client";

import { SectionLabel } from "@/components/shared/SectionLabel";
import { useI18n } from "@/components/i18n/I18nProvider";
import { Disclosure } from "@/components/shared/Disclosure";
import type { DesignProposal, ProposalCulturalSource } from "@/lib/design/schemas";

/* -------------------------------------------------------------------------- */
/*  Shared presentational bits                                                 */
/* -------------------------------------------------------------------------- */

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2 border-t border-[var(--color-line)] pt-5">
      <span className="text-[11px] tracking-[0.22em] text-[var(--color-silver-500)] uppercase">
        {label}
      </span>
      <div className="text-[14px] leading-relaxed text-[var(--color-silver-200)]">
        {children}
      </div>
    </div>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full border border-[var(--color-line)] px-2.5 py-0.5 text-[12px] tracking-[0.08em] text-[var(--color-silver-200)]">
      {children}
    </span>
  );
}

function SourceChip({ id }: { id: string }) {
  return (
    <span className="rounded-full border border-[var(--color-line)] px-2 py-0.5 font-mono text-[11px] tracking-[0.04em] text-[var(--color-silver-400)]">
      {id}
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/*  SECTION 01 — 你的设计 · Design Reveal                                       */
/*  先看到设计：大字标题 → 一句概念 → DESIGN SPEC 展签网格。                    */
/* -------------------------------------------------------------------------- */

export function ProposalHero({ proposal }: { proposal: DesignProposal }) {
  const { t, tv } = useI18n();
  const product = tv("product", proposal.title.product_type);
  const tier = t(`designProposal.tier.${proposal.title.tier}`);
  const title = proposal.title.core
    ? t("designProposal.title.pattern", {
      core: proposal.title.core,
      product,
      tier,
    })
    : t("designProposal.title.formLed", { product, tier });

  const emotions = proposal.concept.emotion_tokens
    .map((token) => tv("emotion", token))
    .join(t("designProposal.conceptJoin"));
  const scene = tv("occasion", proposal.concept.scene);

  return (
    <section className="flex flex-col gap-10">
      <SectionLabel>{t("designProposal.section1Label")}</SectionLabel>

      {/* 名称 —— 大字排版，设计以名字出现 */}
      <h2 className="act-title max-w-4xl">{title}</h2>

      {/* 概念 —— 一句话 */}
      <p className="max-w-2xl font-sans text-[18px] leading-[1.6] tracking-[0.01em] text-[var(--color-silver-100)]">
        {t("designProposal.concept", { emotions, scene })}
      </p>

      {/* DESIGN SPEC —— 先看到设计，再读日志 */}
      <div className="grid grid-cols-2 gap-x-8 gap-y-2 border-t border-[var(--color-line)] pt-8 sm:grid-cols-3">
        <div className="design-attr">
          <span className="design-attr-label">{t("designProposal.intent.product")}</span>
          <span className="design-attr-value">{product}</span>
        </div>
        <div className="design-attr">
          <span className="design-attr-label">{t("designProposal.material.finish")}</span>
          <span className="design-attr-value">
            {t(`designProposal.material.finishValue.${proposal.material.finish}`)}
          </span>
        </div>
        <div className="design-attr">
          <span className="design-attr-label">{t("designProposal.form.weight")}</span>
          <span className="design-attr-value">{tv("shared", proposal.form.weight)}</span>
        </div>
        <div className="design-attr">
          <span className="design-attr-label">{t("designProposal.form.thickness")}</span>
          <span className="design-attr-value">
            {t(`designProposal.thickness.${proposal.form.thickness}`)}
          </span>
        </div>
        <div className="design-attr">
          <span className="design-attr-label">{t("designProposal.intent.occasion")}</span>
          <span className="design-attr-value">{scene}</span>
        </div>
        <div className="design-attr">
          <span className="design-attr-label">{t("designProposal.presence.title")}</span>
          <span className="design-attr-value">{tv("shared", proposal.visual_presence.level)}</span>
        </div>
      </div>

      {/* 置信度 —— 低视觉权重 */}
      <div className="flex items-center gap-4 text-[12px] tracking-[0.14em] text-[var(--color-silver-600)] uppercase">
        <span>{t("common.labels.confidence")}</span>
        <span className="h-px w-8 bg-[var(--color-line)]" aria-hidden />
        <span className="text-[var(--color-silver-400)]">
          {t("designProposal.confidenceValue", {
            value: Math.round(proposal.confidence * 100),
          })}
        </span>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*  SECTION 02 — 为什么这样设计 · 渐进披露                                      */
/* -------------------------------------------------------------------------- */

export function ProposalReasoning({ proposal }: { proposal: DesignProposal }) {
  const { t, tv } = useI18n();
  const intent = proposal.customer_intent;

  const intentChips: Array<{ label: string; nodes: React.ReactNode[] }> = [
    {
      label: t("designProposal.intent.product"),
      nodes: [tv("product", intent.product_type)],
    },
    {
      label: t("designProposal.intent.style"),
      nodes: intent.style.map((token) => tv("style", token)),
    },
    {
      label: t("designProposal.intent.emotions"),
      nodes: intent.emotions.map((token) => tv("emotion", token)),
    },
    {
      label: t("designProposal.intent.occasion"),
      nodes: intent.occasion ? [tv("occasion", intent.occasion)] : [],
    },
    {
      label: t("designProposal.intent.keywords"),
      nodes: intent.keywords,
    },
    {
      label: t("designProposal.intent.size"),
      nodes: [tv("shared", intent.size)],
    },
    {
      label: t("designProposal.intent.weight"),
      nodes: [tv("shared", intent.weight)],
    },
    {
      label: t("designProposal.intent.visibility"),
      nodes: [tv("shared", intent.cultural_visibility)],
    },
  ].filter((group) => group.nodes.length > 0);

  return (
    <section className="flex flex-col gap-8">
      <SectionLabel>{t("designProposal.section2Label")}</SectionLabel>
      <h2 className="font-sans max-w-2xl text-[24px] leading-[1.15] tracking-[-0.01em] text-[var(--color-ivory)] sm:text-[28px]">
        {t("designProposal.section2Title")}
      </h2>

      <Disclosure label={t("designProposal.intentTitle")}>
        <div className="flex flex-col gap-5">
          <p className="max-w-xl text-[13px] leading-relaxed text-[var(--color-silver-500)]">
            {t("designProposal.section2Note")}
          </p>
          <div className="flex flex-col gap-3">
            {intentChips.map((group) => (
              <div key={group.label} className="flex flex-wrap items-center gap-2">
                <span className="w-14 shrink-0 text-[12px] tracking-[0.06em] text-[var(--color-silver-500)]">
                  {group.label}
                </span>
                {group.nodes.map((node, i) => (
                  <Chip key={i}>{node}</Chip>
                ))}
              </div>
            ))}
          </div>
        </div>
      </Disclosure>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*  SECTION 03 — 形态 · 展签网格                                                */
/* -------------------------------------------------------------------------- */

export function ProposalFormSection({ proposal }: { proposal: DesignProposal }) {
  const { t, tv } = useI18n();

  return (
    <section className="flex flex-col gap-8">
      <SectionLabel>{t("designProposal.section3Label")}</SectionLabel>
      <h2 className="font-sans max-w-2xl text-[24px] leading-[1.15] tracking-[-0.01em] text-[var(--color-ivory)] sm:text-[28px]">
        {t("designProposal.section3Title")}
      </h2>
      <div className="grid grid-cols-2 gap-x-8 gap-y-2 border-t border-[var(--color-line)] pt-8 sm:grid-cols-2 lg:grid-cols-4">
        <div className="design-attr">
          <span className="design-attr-label">{t("designProposal.form.product")}</span>
          <span className="design-attr-value">{tv("product", proposal.form.product_type)}</span>
        </div>
        <div className="design-attr">
          <span className="design-attr-label">{t("designProposal.form.thickness")}</span>
          <span className="design-attr-value">
            {t(`designProposal.thickness.${proposal.form.thickness}`)}
          </span>
        </div>
        <div className="design-attr">
          <span className="design-attr-label">{t("designProposal.form.weight")}</span>
          <span className="design-attr-value">{tv("shared", proposal.form.weight)}</span>
        </div>
        <div className="design-attr">
          <span className="design-attr-label">{t("designProposal.form.presence")}</span>
          <span className="design-attr-value">{tv("shared", proposal.visual_presence.level)}</span>
        </div>
      </div>
      <div className="max-w-2xl">
        <Row label={t("designProposal.form.position")}>
          {t(proposal.form.position.key, proposal.form.position.vars)}
        </Row>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*  SECTION 04 — 纹样 · 主纹样可见，其余渐进披露                                */
/* -------------------------------------------------------------------------- */

export function ProposalMotifSection({ proposal }: { proposal: DesignProposal }) {
  const { t, tv } = useI18n();
  const motif = proposal.motif.primary;

  return (
    <section className="flex flex-col gap-8">
      <SectionLabel>{t("designProposal.section4Label")}</SectionLabel>
      <h2 className="font-sans max-w-2xl text-[24px] leading-[1.15] tracking-[-0.01em] text-[var(--color-ivory)] sm:text-[28px]">
        {t("designProposal.section4Title")}
      </h2>

      {/* 主纹样 —— 先看到，像展签一样 */}
      <div className="grid grid-cols-2 gap-x-8 gap-y-2 border-t border-[var(--color-line)] pt-8 sm:grid-cols-3">
        <div className="design-attr">
          <span className="design-attr-label">{t("designProposal.motif.primary")}</span>
          <span className="design-attr-value">
            {motif ? (
              <span className="flex flex-wrap items-center gap-3">
                <span className="text-[var(--color-ivory)]">{motif.name}</span>
                <span className="rounded-full border border-[var(--color-line-strong)] px-2 py-0.5 text-[11px] tracking-[0.12em] text-[var(--color-silver-400)] uppercase">
                  {tv("presentedAs", motif.presented_as)}
                </span>
              </span>
            ) : (
              t("designProposal.motif.none")
            )}
          </span>
        </div>
        <div className="design-attr">
          <span className="design-attr-label">{t("designProposal.motif.secondary")}</span>
          <span className="design-attr-value">
            {proposal.motif.secondary.length > 0
              ? proposal.motif.secondary.map((token) => tv("form", token)).join(" · ")
              : t("designProposal.motif.secondaryNone")}
          </span>
        </div>
        <div className="design-attr">
          <span className="design-attr-label">{t("designProposal.composition.arrangement")}</span>
          <span className="design-attr-value">
            {t(`designProposal.composition.arrangementValue.${proposal.composition.arrangement}`)}
          </span>
        </div>
      </div>

      {/* 完整纹样日志 —— 渐进披露 */}
      <Disclosure label={t("common.actions.readDesignLog")}>
        <div className="flex max-w-2xl flex-col gap-5">
          {motif?.documented_meaning ? (
            <Row label={t("designProposal.motif.meaning")}>
              {motif.documented_meaning}
            </Row>
          ) : null}
          <Row label={t("designProposal.composition.coverage")}>
            {t(`designProposal.composition.coverageValue.${proposal.composition.coverage}`)}
          </Row>
          <Row label={t("designProposal.composition.usage")}>
            {t(proposal.composition.usage_scope.key, proposal.composition.usage_scope.vars)}
          </Row>
          <p className="border-l border-[var(--color-line-strong)] pl-4 text-[12px] leading-relaxed text-[var(--color-silver-400)]">
            {motif?.presented_as === "documented-meaning"
              ? t("designProposal.motif.documentedNote", { motif: motif.name })
              : motif
                ? t("designProposal.motif.visualNote", { motif: motif.name })
                : t("designProposal.motif.noMotifNote")}
          </p>
        </div>
      </Disclosure>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*  SECTION 05 — 材质与工艺 · 关键材质可见，工艺细节渐进披露                      */
/* -------------------------------------------------------------------------- */

export function ProposalMaterialSection({ proposal }: { proposal: DesignProposal }) {
  const { t, tv } = useI18n();

  return (
    <section className="flex flex-col gap-8">
      <SectionLabel>{t("designProposal.section5Label")}</SectionLabel>
      <h2 className="font-sans max-w-2xl text-[24px] leading-[1.15] tracking-[-0.01em] text-[var(--color-ivory)] sm:text-[28px]">
        {t("designProposal.section5Title")}
      </h2>

      {/* 材质 —— 展签 */}
      <div className="grid grid-cols-2 gap-x-8 gap-y-2 border-t border-[var(--color-line)] pt-8 sm:grid-cols-4">
        <div className="design-attr">
          <span className="design-attr-label">{t("designProposal.material.base")}</span>
          <span className="design-attr-value">{t("designProposal.material.silver")}</span>
        </div>
        <div className="design-attr">
          <span className="design-attr-label">{t("designProposal.material.finish")}</span>
          <span className="design-attr-value">
            {t(`designProposal.material.finishValue.${proposal.material.finish}`)}
          </span>
        </div>
        <div className="design-attr">
          <span className="design-attr-label">{t("designProposal.craft.fineness")}</span>
          <span className="design-attr-value">{tv("shared", proposal.craft.fineness)}</span>
        </div>
        <div className="design-attr">
          <span className="design-attr-label">{t("designProposal.craft.primary")}</span>
          <span className="design-attr-value">{proposal.craft.primary.name}</span>
        </div>
      </div>

      {/* 工艺细节 —— 渐进披露 */}
      <Disclosure label={t("common.actions.readDesignLog")}>
        <div className="flex max-w-2xl flex-col gap-5">
          <Row label={t("designProposal.craft.primary")}>
            <div className="flex flex-col gap-2">
              <span className="text-[var(--color-ivory)]">
                {proposal.craft.primary.name}
              </span>
              <div className="flex flex-wrap items-center gap-2">
                {proposal.craft.primary.source_ids.map((id) => (
                  <SourceChip key={id} id={id} />
                ))}
                <span className="text-[11px] tracking-[0.1em] text-[var(--color-silver-500)] uppercase">
                  {tv("evidenceLevel", proposal.craft.primary.evidence_level)}
                </span>
              </div>
            </div>
          </Row>
          {proposal.craft.alternatives.length > 0 ? (
            <Row label={t("designProposal.craft.alternatives")}>
              <div className="flex flex-col gap-2">
                {proposal.craft.alternatives.map((craft) => (
                  <span key={craft.id} className="flex flex-wrap items-center gap-2">
                    <span>{craft.name}</span>
                    <span className="text-[11px] tracking-[0.1em] text-[var(--color-silver-500)] uppercase">
                      {tv("evidenceLevel", craft.evidence_level)}
                    </span>
                  </span>
                ))}
              </div>
            </Row>
          ) : null}
          <p className="border-l border-[var(--color-line-strong)] pl-4 text-[12px] leading-relaxed text-[var(--color-silver-400)]">
            {t("designProposal.craft.handNote")}
          </p>
        </div>
      </Disclosure>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*  SECTION 06 — 佩戴体验 · 等级与场景可见，理由渐进披露                         */
/* -------------------------------------------------------------------------- */

export function ProposalWearabilitySection({
  proposal,
}: {
  proposal: DesignProposal;
}) {
  const { t, tv } = useI18n();

  return (
    <section className="flex flex-col gap-8">
      <SectionLabel>{t("designProposal.section6Label")}</SectionLabel>
      <h2 className="font-sans max-w-2xl text-[24px] leading-[1.15] tracking-[-0.01em] text-[var(--color-ivory)] sm:text-[28px]">
        {t("designProposal.section6Title")}
      </h2>

      <div className="grid grid-cols-2 gap-x-8 gap-y-2 border-t border-[var(--color-line)] pt-8 sm:grid-cols-3">
        <div className="design-attr">
          <span className="design-attr-label">{t("designProposal.wearability.level")}</span>
          <span className="design-attr-value">{tv("shared", proposal.wearability.level)}</span>
        </div>
        <div className="design-attr">
          <span className="design-attr-label">{t("designProposal.wearability.scenes")}</span>
          <span className="design-attr-value">
            <span className="flex flex-wrap gap-2">
              {proposal.wearability.scenes.map((scene) => (
                <Chip key={scene}>{tv("occasion", scene)}</Chip>
              ))}
            </span>
          </span>
        </div>
        <div className="design-attr">
          <span className="design-attr-label">{t("designProposal.presence.title")}</span>
          <span className="design-attr-value">
            {t(`designProposal.presence.note.${proposal.visual_presence.level}`)}
          </span>
        </div>
      </div>

      <Disclosure label={t("common.actions.readDesignLog")}>
        <div className="flex max-w-2xl flex-col gap-5">
          <Row label={t("designProposal.wearability.reason")}>
            <ul className="flex flex-col gap-2.5">
              {proposal.wearability.reasons.map((item, i) => (
                <li key={i} className="flex gap-3 text-[14px] leading-relaxed text-[var(--color-silver-300)]">
                  <span
                    aria-hidden
                    className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-[var(--color-silver-400)]"
                  />
                  {t(item.key, item.vars)}
                </li>
              ))}
            </ul>
          </Row>
        </div>
      </Disclosure>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*  SECTION 07 — 文化来源 · 证据核心，设计解读渐进披露                           */
/* -------------------------------------------------------------------------- */

/**
 * EXPERIENCE LAYER · SourceCard — 消费者只看到一句来源说明。
 * 论文式证据块（facts 清单、来源编号、证据层级、置信度元数据）不再
 * 面向消费者展示；完整数据仍保留在 proposal.cultural_sources 数据层，
 * 供文化护栏（RULE-007）、内部验证与后续审计使用。
 */
function SourceCard({ card }: { card: ProposalCulturalSource }) {
  const { t, tv } = useI18n();

  return (
    <article className="flex flex-col gap-4 border-t border-[var(--color-line)] pt-6">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <div className="flex flex-wrap items-baseline gap-3">
          <h3 className="font-sans text-[18px] tracking-[0.01em] text-[var(--color-ivory)]">
            {card.entity_name}
          </h3>
          {card.region ? (
            <span className="rounded-full border border-[var(--color-line)] px-2.5 py-0.5 text-[11px] tracking-[0.12em] text-[var(--color-silver-300)]">
              {card.region}
            </span>
          ) : null}
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

      <p className="text-[13px] leading-relaxed text-[var(--color-silver-400)]">
        {t("designProposal.source.trustNote", {
          kind: tv("matchType", card.entity_kind),
        })}
      </p>
    </article>
  );
}

export function ProposalCulturalSources({ proposal }: { proposal: DesignProposal }) {
  const { t } = useI18n();

  return (
    <section className="flex flex-col gap-8">
      <SectionLabel>{t("designProposal.section7Label")}</SectionLabel>
      <h2 className="font-sans max-w-2xl text-[24px] leading-[1.15] tracking-[-0.01em] text-[var(--color-ivory)] sm:text-[28px]">
        {t("designProposal.section7Title")}
      </h2>

      {proposal.cultural_sources.length > 0 ? (
        <div className="flex flex-col gap-6">
          {proposal.cultural_sources.map((card) => (
            <SourceCard key={card.entity_id} card={card} />
          ))}
        </div>
      ) : (
        <p className="text-[14px] leading-relaxed text-[var(--color-silver-400)]">
          {t("designProposal.sources.none")}
        </p>
      )}

      {/* 图例 + 设计解读 —— 渐进披露 */}
      <Disclosure label={t("designTranslation.interpretationLabel")}>
        <div className="flex flex-col gap-8">
          <div className="flex flex-col gap-2">
            <span className="text-[11px] tracking-[0.18em] text-[var(--color-silver-500)] uppercase">
              {t("designProposal.legend.title")}
            </span>
            <ul className="flex flex-col gap-1.5 text-[12px] leading-relaxed text-[var(--color-silver-400)]">
              <li>{t("designProposal.legend.official")}</li>
              <li>{t("designProposal.legend.inference")}</li>
              <li>{t("designProposal.legend.visual")}</li>
            </ul>
            <p className="max-w-xl pt-2 text-[12px] leading-relaxed text-[var(--color-silver-600)]">
              {t("designProposal.section7Note")}
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
        </div>
      </Disclosure>
    </section>
  );
}
