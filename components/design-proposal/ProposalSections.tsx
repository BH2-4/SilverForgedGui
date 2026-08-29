"use client";

import { ArrowUpRight } from "lucide-react";
import { SectionLabel } from "@/components/shared/SectionLabel";
import { useI18n } from "@/components/i18n/I18nProvider";
import type { DesignProposal, ProposalCulturalSource } from "@/lib/design/schemas";

/* -------------------------------------------------------------------------- */
/*  Shared presentational bits                                                 */
/* -------------------------------------------------------------------------- */

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2 border-t border-[var(--color-line)] pt-5">
      <span className="text-[10px] tracking-[0.22em] text-[var(--color-silver-500)] uppercase">
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
    <span className="rounded-full border border-[var(--color-line)] px-2.5 py-0.5 text-[11px] tracking-[0.08em] text-[var(--color-silver-200)]">
      {children}
    </span>
  );
}

function SourceChip({ id }: { id: string }) {
  return (
    <span className="rounded-full border border-[var(--color-line)] px-2 py-0.5 font-mono text-[10px] tracking-[0.04em] text-[var(--color-silver-400)]">
      {id}
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/*  SECTION 01 — 你的设计                                                       */
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
    <section className="flex flex-col gap-8">
      <SectionLabel>{t("designProposal.section1Label")}</SectionLabel>
      <div className="flex flex-col gap-4">
        <span className="text-[10px] tracking-[0.22em] text-[var(--color-silver-500)] uppercase">
          {t("designProposal.titleLabel")}
        </span>
        <h2 className="font-editorial text-[30px] leading-[1.1] tracking-[-0.01em] text-[var(--color-ivory)] sm:text-[38px]">
          {title}
        </h2>
      </div>
      <div className="flex flex-col gap-3">
        <span className="text-[10px] tracking-[0.22em] text-[var(--color-silver-500)] uppercase">
          {t("designProposal.conceptLabel")}
        </span>
        <p className="font-editorial max-w-2xl text-[18px] leading-[1.5] tracking-[0.01em] text-[var(--color-silver-100)] sm:text-[20px]">
          {t("designProposal.concept", { emotions, scene })}
        </p>
        <p className="max-w-xl text-[11px] leading-relaxed text-[var(--color-silver-500)]">
          {t("designProposal.conceptNote")}
        </p>
      </div>
      <div className="flex items-center gap-4 border-t border-[var(--color-line)] pt-5">
        <span className="text-[10px] tracking-[0.22em] text-[var(--color-silver-500)] uppercase">
          {t("common.labels.confidence")}
        </span>
        <span className="text-[13px] text-[var(--color-silver-300)]">
          {t("designProposal.confidenceValue", {
            value: Math.round(proposal.confidence * 100),
          })}
        </span>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*  SECTION 02 — 为什么这样设计                                                  */
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
      <h2 className="font-editorial max-w-2xl text-[26px] leading-[1.15] tracking-[-0.01em] text-[var(--color-ivory)] sm:text-[32px]">
        {t("designProposal.section2Title")}
      </h2>
      <p className="max-w-xl text-[12px] leading-relaxed text-[var(--color-silver-600)]">
        {t("designProposal.section2Note")}
      </p>

      {/* What the customer actually asked for (Stage 0 verbatim tokens). */}
      <div className="flex flex-col gap-3">
        <span className="text-[10px] tracking-[0.18em] text-[var(--color-silver-500)] uppercase">
          {t("designProposal.intentTitle")}
        </span>
        <div className="flex flex-col gap-3">
          {intentChips.map((group) => (
            <div key={group.label} className="flex flex-wrap items-center gap-2">
              <span className="w-14 shrink-0 text-[11px] tracking-[0.06em] text-[var(--color-silver-500)]">
                {group.label}
              </span>
              {group.nodes.map((node, i) => (
                <Chip key={i}>{node}</Chip>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* The five-layer derivation chain. */}
      <div className="flex flex-col gap-0">
        {proposal.design_reasoning.map((step, i) => (
          <div key={step.step} className="flex flex-col gap-2 border-t border-[var(--color-line)] py-5">
            <div className="flex items-center gap-3">
              <span className="font-mono text-[10px] text-[var(--color-silver-600)]">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="text-[10px] tracking-[0.2em] text-[var(--color-silver-400)] uppercase">
                {t(`designProposal.reasoning.step.${step.step}`)}
              </span>
            </div>
            <ul className="flex flex-col gap-1.5">
              {step.items.map((item, j) => (
                <li key={j} className="text-[14px] leading-relaxed text-[var(--color-silver-300)]">
                  {t(item.key, item.vars)}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*  SECTION 03 — 形态                                                           */
/* -------------------------------------------------------------------------- */

export function ProposalFormSection({ proposal }: { proposal: DesignProposal }) {
  const { t, tv } = useI18n();

  return (
    <section className="flex flex-col gap-6">
      <SectionLabel>{t("designProposal.section3Label")}</SectionLabel>
      <h2 className="font-editorial max-w-2xl text-[26px] leading-[1.15] tracking-[-0.01em] text-[var(--color-ivory)] sm:text-[32px]">
        {t("designProposal.section3Title")}
      </h2>
      <div className="flex flex-col gap-5">
        <Row label={t("designProposal.form.product")}>
          {tv("product", proposal.form.product_type)}
        </Row>
        <Row label={t("designProposal.form.thickness")}>
          {t(`designProposal.thickness.${proposal.form.thickness}`)}
        </Row>
        <Row label={t("designProposal.form.weight")}>
          {tv("shared", proposal.form.weight)}
        </Row>
        <Row label={t("designProposal.form.position")}>
          {t(proposal.form.position.key, proposal.form.position.vars)}
        </Row>
        <Row label={t("designProposal.form.presence")}>
          {tv("shared", proposal.visual_presence.level)}
        </Row>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*  SECTION 04 — 纹样                                                           */
/* -------------------------------------------------------------------------- */

export function ProposalMotifSection({ proposal }: { proposal: DesignProposal }) {
  const { t, tv } = useI18n();
  const motif = proposal.motif.primary;

  return (
    <section className="flex flex-col gap-6">
      <SectionLabel>{t("designProposal.section4Label")}</SectionLabel>
      <h2 className="font-editorial max-w-2xl text-[26px] leading-[1.15] tracking-[-0.01em] text-[var(--color-ivory)] sm:text-[32px]">
        {t("designProposal.section4Title")}
      </h2>
      <div className="flex flex-col gap-5">
        <Row label={t("designProposal.motif.primary")}>
          {motif ? (
            <span className="flex flex-wrap items-center gap-3">
              <span className="text-[var(--color-ivory)]">{motif.name}</span>
              <span className="rounded-full border border-[var(--color-line-strong)] px-2 py-0.5 text-[10px] tracking-[0.12em] text-[var(--color-silver-400)] uppercase">
                {tv("presentedAs", motif.presented_as)}
              </span>
            </span>
          ) : (
            t("designProposal.motif.none")
          )}
        </Row>
        {motif?.documented_meaning ? (
          <Row label={t("designProposal.motif.meaning")}>
            {motif.documented_meaning}
          </Row>
        ) : null}
        <Row label={t("designProposal.motif.secondary")}>
          {proposal.motif.secondary.length > 0 ? (
            <div className="flex flex-col gap-1.5">
              {proposal.motif.secondary.map((token, i) => (
                <span key={i}>{tv("form", token)}</span>
              ))}
            </div>
          ) : (
            t("designProposal.motif.secondaryNone")
          )}
        </Row>
        <Row label={t("designProposal.composition.arrangement")}>
          {t(`designProposal.composition.arrangementValue.${proposal.composition.arrangement}`)}
        </Row>
        <Row label={t("designProposal.composition.coverage")}>
          {t(`designProposal.composition.coverageValue.${proposal.composition.coverage}`)}
        </Row>
        <Row label={t("designProposal.composition.usage")}>
          {t(
            proposal.composition.usage_scope.key,
            proposal.composition.usage_scope.vars,
          )}
        </Row>
      </div>
      {/* The visual-reference / cultural-meaning boundary, stated explicitly. */}
      <p className="border-l border-[var(--color-line-strong)] pl-4 text-[12px] leading-relaxed text-[var(--color-silver-400)]">
        {motif?.presented_as === "documented-meaning"
          ? t("designProposal.motif.documentedNote", { motif: motif.name })
          : motif
            ? t("designProposal.motif.visualNote", { motif: motif.name })
            : t("designProposal.motif.noMotifNote")}
      </p>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*  SECTION 05 — 材质与工艺                                                      */
/* -------------------------------------------------------------------------- */

export function ProposalMaterialSection({ proposal }: { proposal: DesignProposal }) {
  const { t, tv } = useI18n();
  const crafts = [proposal.craft.primary, ...proposal.craft.alternatives];

  return (
    <section className="flex flex-col gap-6">
      <SectionLabel>{t("designProposal.section5Label")}</SectionLabel>
      <h2 className="font-editorial max-w-2xl text-[26px] leading-[1.15] tracking-[-0.01em] text-[var(--color-ivory)] sm:text-[32px]">
        {t("designProposal.section5Title")}
      </h2>
      <div className="flex flex-col gap-5">
        <Row label={t("designProposal.material.base")}>
          {t("designProposal.material.silver")}
        </Row>
        <Row label={t("designProposal.material.finish")}>
          {t(`designProposal.material.finishValue.${proposal.material.finish}`)}
        </Row>
        <Row label={t("designProposal.craft.primary")}>
          <div className="flex flex-col gap-2">
            <span className="text-[var(--color-ivory)]">
              {proposal.craft.primary.name}
            </span>
            <div className="flex flex-wrap items-center gap-2">
              {proposal.craft.primary.source_ids.map((id) => (
                <SourceChip key={id} id={id} />
              ))}
              <span className="text-[10px] tracking-[0.1em] text-[var(--color-silver-500)] uppercase">
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
                  <span className="text-[10px] tracking-[0.1em] text-[var(--color-silver-500)] uppercase">
                    {tv("evidenceLevel", craft.evidence_level)}
                  </span>
                </span>
              ))}
            </div>
          </Row>
        ) : null}
        <Row label={t("designProposal.craft.fineness")}>
          {tv("shared", proposal.craft.fineness)}
        </Row>
      </div>
      <p className="border-l border-[var(--color-line-strong)] pl-4 text-[12px] leading-relaxed text-[var(--color-silver-400)]">
        {t("designProposal.craft.handNote")}
      </p>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*  SECTION 06 — 佩戴体验                                                        */
/* -------------------------------------------------------------------------- */

export function ProposalWearabilitySection({
  proposal,
}: {
  proposal: DesignProposal;
}) {
  const { t, tv } = useI18n();

  return (
    <section className="flex flex-col gap-6">
      <SectionLabel>{t("designProposal.section6Label")}</SectionLabel>
      <h2 className="font-editorial max-w-2xl text-[26px] leading-[1.15] tracking-[-0.01em] text-[var(--color-ivory)] sm:text-[32px]">
        {t("designProposal.section6Title")}
      </h2>
      <div className="flex flex-col gap-5">
        <Row label={t("designProposal.wearability.level")}>
          {tv("shared", proposal.wearability.level)}
        </Row>
        <Row label={t("designProposal.wearability.scenes")}>
          <div className="flex flex-wrap gap-2">
            {proposal.wearability.scenes.map((scene) => (
              <Chip key={scene}>{tv("occasion", scene)}</Chip>
            ))}
          </div>
        </Row>
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
        <Row label={t("designProposal.presence.title")}>
          {t(`designProposal.presence.note.${proposal.visual_presence.level}`)}
        </Row>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*  SECTION 07 — 文化来源                                                        */
/* -------------------------------------------------------------------------- */

function SourceCard({ card }: { card: ProposalCulturalSource }) {
  const { t, tv } = useI18n();

  return (
    <article className="flex flex-col gap-5 border-t border-[var(--color-line)] pt-6">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <div className="flex flex-wrap items-baseline gap-3">
          <h3 className="font-editorial text-[20px] tracking-[0.01em] text-[var(--color-ivory)]">
            {card.entity_name}
          </h3>
          <span className="font-mono text-[11px] text-[var(--color-silver-500)]">
            {card.entity_id}
          </span>
        </div>
        <span
          className={`rounded-full border px-2.5 py-0.5 text-[10px] tracking-[0.16em] uppercase ${card.classification === "official_record"
            ? "border-[var(--color-line-strong)] text-[var(--color-accent)]"
            : "border-[var(--color-line)] text-[var(--color-silver-400)]"
            }`}
        >
          {t(`designProposal.source.classification.${card.classification}`)}
        </span>
      </div>

      <div className="flex flex-wrap gap-x-6 gap-y-2">
        <span className="text-[11px] tracking-[0.06em] text-[var(--color-silver-500)]">
          {t("designProposal.source.kind")} ·{" "}
          <span className="text-[var(--color-silver-300)]">
            {tv("matchType", card.entity_kind)}
          </span>
        </span>
        {card.region ? (
          <span className="text-[11px] tracking-[0.06em] text-[var(--color-silver-500)]">
            {t("designProposal.source.region")} ·{" "}
            <span className="text-[var(--color-silver-300)]">{card.region}</span>
          </span>
        ) : null}
        <span className="text-[11px] tracking-[0.06em] text-[var(--color-silver-500)]">
          {t("designProposal.source.evidence")} ·{" "}
          <span className="text-[var(--color-silver-300)]">
            {tv("evidenceLevel", card.evidence_level)}
          </span>
        </span>
        <span className="text-[11px] tracking-[0.06em] text-[var(--color-silver-500)]">
          {t("designProposal.source.claimLevel")} ·{" "}
          <span className="text-[var(--color-silver-300)]">
            {tv("claimLevel", card.claim_level)}
          </span>
        </span>
        <span className="text-[11px] tracking-[0.06em] text-[var(--color-silver-500)]">
          {t("designProposal.source.confidence")} ·{" "}
          <span className="text-[var(--color-silver-300)]">
            {t("designProposal.confidenceValue", {
              value: Math.round(card.confidence * 100),
            })}
          </span>
        </span>
      </div>

      {/* Official evidence — verbatim knowledge-base strings. */}
      <div className="flex flex-col gap-3">
        <span className="text-[10px] tracking-[0.18em] text-[var(--color-silver-500)] uppercase">
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
                <span className="text-[10px] tracking-[0.1em] text-[var(--color-silver-500)] uppercase">
                  {tv("evidenceLevel", fact.evidence_level)}
                </span>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Cited official records. */}
      {card.source_refs.length > 0 ? (
        <div className="flex flex-col gap-2">
          <span className="text-[10px] tracking-[0.18em] text-[var(--color-silver-500)] uppercase">
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
                  <span className="font-mono text-[10px]">{ref.id}</span>
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

export function ProposalCulturalSources({ proposal }: { proposal: DesignProposal }) {
  const { t } = useI18n();

  return (
    <section className="flex flex-col gap-8">
      <SectionLabel>{t("designProposal.section7Label")}</SectionLabel>
      <h2 className="font-editorial max-w-2xl text-[26px] leading-[1.15] tracking-[-0.01em] text-[var(--color-ivory)] sm:text-[32px]">
        {t("designProposal.section7Title")}
      </h2>
      <p className="max-w-xl text-[12px] leading-relaxed text-[var(--color-silver-600)]">
        {t("designProposal.section7Note")}
      </p>

      {/* The three-way legend: what is official, what is inferred, what is
          visual-only. Every cultural statement below maps to exactly one. */}
      <div className="flex flex-col gap-2">
        <span className="text-[10px] tracking-[0.18em] text-[var(--color-silver-500)] uppercase">
          {t("designProposal.legend.title")}
        </span>
        <ul className="flex flex-col gap-1.5 text-[12px] leading-relaxed text-[var(--color-silver-400)]">
          <li>{t("designProposal.legend.official")}</li>
          <li>{t("designProposal.legend.inference")}</li>
          <li>{t("designProposal.legend.visual")}</li>
        </ul>
      </div>

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

      {/* Design interpretation — always labeled, never cultural fact. */}
      <div className="flex flex-col gap-4 border-t border-[var(--color-line)] pt-6">
        <div className="flex items-center gap-3">
          <span className="text-[10px] tracking-[0.18em] text-[var(--color-silver-500)] uppercase">
            {t("designTranslation.interpretationLabel")}
          </span>
          <span className="rounded-full border border-[var(--color-line)] px-2 py-0.5 text-[9px] tracking-[0.16em] text-[var(--color-silver-500)] uppercase">
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

      {/* Honest unknowns. */}
      {proposal.uncertainties.length > 0 ? (
        <div className="flex flex-col gap-3 border-t border-[var(--color-line)] pt-6">
          <span className="text-[10px] tracking-[0.18em] text-[var(--color-silver-500)] uppercase">
            {t("designProposal.uncertaintiesLabel")}
          </span>
          <ul className="flex flex-col gap-2.5">
            {proposal.uncertainties.map((item, i) => (
              <li
                key={i}
                className="flex gap-3 text-[12px] leading-relaxed text-[var(--color-silver-400)]"
              >
                <span
                  aria-hidden
                  className="mt-[6px] h-1 w-1 shrink-0 rounded-full bg-[var(--color-silver-500)]"
                />
                {t(`designDirections.${item.key}`, item.vars)}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {/* Guardrail seal. */}
      <p className="text-[11px] tracking-[0.08em] text-[var(--color-silver-500)]">
        {t("designProposal.guardrailPassed")}
      </p>
    </section>
  );
}
