/**
 * STAGE 4 — CUSTOM DESIGN PROPOSAL · Engine
 *
 * Turns the server-generated Design Brief into the customer-facing
 * 「贵州银饰定制设计提案」. Deterministic, template-based, zero AI calls.
 *
 * TRUTH MODEL (unchanged from Stage 3, now customer-facing):
 *   · Every cultural statement on the proposal is RE-EXPORTED VERBATIM from
 *     the brief (facts, motif, sources, uncertainties) — nothing new is
 *     claimed about culture at this stage.
 *   · The only new content is deterministic derivations (thickness,
 *     composition, presence — all functions of the chosen tier) and
 *     template sentences whose prose lives in the i18n dictionaries, not
 *     in this engine.
 *   · No final imagery is generated here. The customer first confirms the
 *     direction itself; visual generation is the NEXT stage by design.
 *
 * INTEGRITY — the brief arrives from the client (sessionStorage hand-off),
 * so it is never trusted structurally:
 *   1. verifyDesignBrief + verifyDesignDirection re-run against the KB;
 *   2. the brief's direction/heritage/craft/motif fields must be mutually
 *      consistent (a stitched-together payload is rejected);
 *   3. every craft and source card is re-resolved from the KB by id.
 */

import { getHeritageById, getSourceById } from "@/lib/heritage/repository";
import { claimLevelFromEvidence } from "@/lib/heritage/evidence";
import type { SourceRef } from "@/lib/heritage/types";
import type { GlobalDesignBrief } from "@/lib/ai/schemas";
import {
  verifyDesignBrief,
  verifyDesignDirection,
  verifyDesignProposal,
} from "@/lib/design/verification";
import type {
  DesignBrief,
  DesignProposal,
  ProposalCulturalSource,
  ProposalCraftRef,
  WhyItem,
} from "@/lib/design/schemas";
import { EVIDENCE_WEIGHT } from "@/lib/design/translate";

/* -------------------------------------------------------------------------- */
/*  Errors                                                                     */
/* -------------------------------------------------------------------------- */

export type ProposalErrorCode =
  | "invalid_input"
  | "guardrail_violation"
  | "inconsistent_brief"
  | "unknown_heritage_entity";

export class ProposalInputError extends Error {
  constructor(
    public code: ProposalErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "ProposalInputError";
  }
}

/* -------------------------------------------------------------------------- */
/*  Input / output                                                             */
/* -------------------------------------------------------------------------- */

export interface BuildProposalInput {
  designDna: GlobalDesignBrief;
  designBrief: DesignBrief;
}

export interface BuildProposalOutput {
  proposal: DesignProposal;
  verification: DesignProposal["guardrail_status"];
}

/* -------------------------------------------------------------------------- */
/*  Deterministic tier derivations                                             */
/* -------------------------------------------------------------------------- */

const TIER_THICKNESS = { quiet: "slim", balanced: "medium", statement: "substantial" } as const;
const TIER_ARRANGEMENT = {
  quiet: "single-focus",
  balanced: "balanced-dual",
  statement: "layered-system",
} as const;
const TIER_COVERAGE = { quiet: "local", balanced: "partial", statement: "full" } as const;
const TIER_FINESS = { quiet: "low", balanced: "medium", statement: "high" } as const;

/** Products the i18n dictionaries ship a dedicated wearing-position line for. */
const KNOWN_PRODUCTS = new Set([
  "necklace",
  "earrings",
  "bracelet",
  "ring",
  "brooch",
  "pendant",
  "cuff",
  "anklet",
  "hairpiece",
]);

/** Occasions the i18n dictionaries ship a dedicated scene-fit line for. */
const KNOWN_SCENES = new Set([
  "everyday",
  "date",
  "festival",
  "wedding",
  "gift",
  "formal",
  "travel",
]);

/* -------------------------------------------------------------------------- */
/*  KB re-resolution helpers                                                   */
/* -------------------------------------------------------------------------- */

type EntityData = NonNullable<ReturnType<typeof getHeritageById>>;

function entityName(entity: EntityData): string {
  return "name" in entity.data ? String(entity.data.name) : entity.kind;
}

function entityRegion(entity: EntityData): string | null {
  return "region" in entity.data ? (entity.data.region ?? null) : null;
}

function entityMeaningStatus(entity: EntityData): ProposalCulturalSource["meaning_status"] {
  if ("documented_meaning" in entity.data && entity.data.documented_meaning) {
    return "documented";
  }
  if (entity.kind === "motif") return "not_documented";
  return "not_applicable";
}

function toSourceRefs(sourceIds: string[]): SourceRef[] {
  return sourceIds
    .map((id) => getSourceById(id))
    .filter((s): s is NonNullable<typeof s> => Boolean(s))
    .map(({ id, title, publisher, url }) => ({ id, title, publisher, url }));
}

/** Same evidence scoring as Stage 3 (lib/design/translate.ts). */
function evidenceConfidence(
  evidenceLevel: string,
  sourceCount: number,
): number {
  const weight = EVIDENCE_WEIGHT[evidenceLevel] ?? 0.5;
  const sourceBonus =
    sourceCount >= 2 ? 0.4 : sourceCount === 1 ? 0.28 : 0;
  return Math.round((weight * 0.6 + sourceBonus) * 100) / 100;
}

/* -------------------------------------------------------------------------- */
/*  Engine                                                                     */
/* -------------------------------------------------------------------------- */

export function buildDesignProposal(
  input: BuildProposalInput,
): BuildProposalOutput {
  const { designDna: dna, designBrief: brief } = input;
  const direction = brief.selected_direction;

  /* 1 — Re-run the Stage 3 guardrails against the live knowledge base.
     A hand-edited or stitched-together brief fails here, before any
     proposal content is assembled. */
  const briefVerification = verifyDesignBrief(brief);
  if (!briefVerification.passed) {
    throw new ProposalInputError(
      "guardrail_violation",
      `The submitted design brief failed the cultural guardrails and was rejected: ${briefVerification.checks
        .filter((c) => !c.passed)
        .map((c) => `${c.rule_id}: ${c.message}`)
        .join(" | ")}`,
    );
  }
  const directionVerification = verifyDesignDirection(direction);
  if (!directionVerification.passed) {
    throw new ProposalInputError(
      "guardrail_violation",
      `The selected design direction failed the cultural guardrails and was rejected: ${directionVerification.checks
        .filter((c) => !c.passed)
        .map((c) => `${c.rule_id}: ${c.message}`)
        .join(" | ")}`,
    );
  }

  /* 2 — Internal consistency: the brief must describe the same direction
     it claims to carry (heritage entity, motif, crafts). */
  const heritage = brief.heritage_reference;
  if (direction.origin_match_id !== (heritage?.match_id ?? null)) {
    throw new ProposalInputError(
      "inconsistent_brief",
      "The brief's heritage reference does not match the direction it carries — the payload looks stitched together.",
    );
  }
  if (heritage && (heritage.name !== direction.origin_match_name)) {
    throw new ProposalInputError(
      "inconsistent_brief",
      "The brief's heritage name does not match the direction's origin entity.",
    );
  }
  if (
    direction.motif_elements.length !== brief.motif_elements.length ||
    direction.motif_elements.some(
      (m, i) => m.origin_entity_id !== brief.motif_elements[i]?.origin_entity_id,
    )
  ) {
    throw new ProposalInputError(
      "inconsistent_brief",
      "The brief's motif elements do not match the direction's motif elements.",
    );
  }
  if (direction.crafts[0] && brief.craft.primary !== direction.crafts[0].name) {
    throw new ProposalInputError(
      "inconsistent_brief",
      "The brief's primary craft does not match the direction's recommended craft.",
    );
  }

  /* 3 — Ground the origin entity + crafts in the KB (id-level trust only). */
  if (direction.origin_match_id) {
    const ground = getHeritageById(direction.origin_match_id);
    if (!ground) {
      throw new ProposalInputError(
        "unknown_heritage_entity",
        `Direction origin "${direction.origin_match_id}" does not exist in the knowledge base.`,
      );
    }
  }
  const craftRefs: ProposalCraftRef[] = [];
  for (const craft of direction.crafts) {
    const ground = getHeritageById(craft.id);
    if (!ground || ground.kind !== "craft") {
      throw new ProposalInputError(
        "unknown_heritage_entity",
        `Cited craft "${craft.id}" does not exist in the knowledge base.`,
      );
    }
    craftRefs.push({
      id: ground.data.id,
      name: ground.data.name,
      source_ids: ground.data.source_ids,
      evidence_level: ground.data.evidence_level,
    });
  }
  if (craftRefs.length === 0) {
    throw new ProposalInputError(
      "inconsistent_brief",
      "The direction carries no craft citation — a proposal cannot be assembled without one.",
    );
  }

  /* 4 — Cultural source cards (SECTION 07). Facts are grouped by their
     origin entity and re-resolved from the KB; classification and claim
     level are DERIVED, never asserted (RULE-007 polices this). */
  const factGroups = new Map<string, typeof brief.documented_cultural_facts>();
  for (const fact of brief.documented_cultural_facts) {
    const list = factGroups.get(fact.origin.entity_id) ?? [];
    list.push(fact);
    factGroups.set(fact.origin.entity_id, list);
  }

  const cards: ProposalCulturalSource[] = [];
  for (const [entityId, facts] of factGroups) {
    const entity = getHeritageById(entityId);
    if (
      !entity ||
      entity.kind === "person" ||
      !("source_ids" in entity.data)
    ) {
      throw new ProposalInputError(
        "unknown_heritage_entity",
        `Fact origin "${entityId}" does not exist in the knowledge base.`,
      );
    }
    const meaningStatus = entityMeaningStatus(entity);
    const sourceRefs = toSourceRefs(entity.data.source_ids);
    cards.push({
      entity_id: entity.data.id,
      entity_name: entityName(entity),
      entity_kind: entity.kind,
      region: entityRegion(entity),
      meaning_status: meaningStatus,
      classification:
        entity.kind === "motif" && meaningStatus === "not_documented"
          ? "visual_reference"
          : "official_record",
      facts,
      source_refs: sourceRefs,
      evidence_level: entity.data.evidence_level,
      claim_level: claimLevelFromEvidence(
        entity.data.evidence_level,
        sourceRefs.length,
      ),
      confidence: evidenceConfidence(
        entity.data.evidence_level,
        sourceRefs.length,
      ),
    });
  }

  /* 5 — Deterministic derivations from the chosen tier. */
  const motif = brief.motif_elements[0] ?? null;
  const productKey = KNOWN_PRODUCTS.has(brief.product_type)
    ? brief.product_type
    : "default";
  const formPosition: WhyItem = { key: `proposal.form.position.${productKey}` };

  const compositionScope: WhyItem = motif
    ? {
      key: `proposal.composition.scope.${direction.tier}`,
      vars: { motif: motif.name },
    }
    : { key: "proposal.composition.scope.form-led" };

  const sceneReasons: WhyItem[] = direction.wearing_scenes.map((scene) => ({
    key: KNOWN_SCENES.has(scene)
      ? `proposal.wearability.reason.${scene}`
      : "proposal.wearability.reason.default",
  }));

  /* 6 — The five-layer reasoning chain (SECTION 02), template-backed. */
  const designReasoning: DesignProposal["design_reasoning"] = [
    {
      step: "your_choices",
      items: [
        {
          key: "proposal.reasoning.choices",
          vars: {
            style: String(dna.style.length),
            emotion: String(dna.emotion.length),
            keywords: String(dna.design_keywords.length),
          },
        },
      ],
    },
    {
      step: "design_dna",
      items: [
        {
          key: "proposal.reasoning.dna",
          vars: { discarded: String(brief.discarded_symbolic_inputs.length) },
        },
      ],
    },
    {
      step: "cultural_direction",
      items: [
        direction.origin_match_name
          ? {
            key: "proposal.reasoning.cultural",
            vars: {
              entity: direction.origin_match_name,
              score: String(direction.origin_match_score ?? 0),
            },
          }
          : { key: "proposal.reasoning.culturalFormLed" },
      ],
    },
    {
      step: "design_language",
      items: [
        motif
          ? { key: "proposal.reasoning.language", vars: { motif: motif.name } }
          : { key: "proposal.reasoning.languageFormLed" },
      ],
    },
    {
      step: "final_proposal",
      items: [
        {
          key: `proposal.reasoning.final.${direction.tier}`,
        },
      ],
    },
  ];

  /* 7 — Assemble. guardrail_status is filled after verification below. */
  const draft: DesignProposal = {
    id: `proposal-${direction.id}`,
    title: {
      tier: direction.tier,
      core: direction.origin_match_name,
      product_type: brief.product_type,
    },
    concept: {
      emotion_tokens: brief.emotional_intent,
      scene: brief.wearing_scene,
    },
    customer_intent: {
      product_type: brief.product_type,
      style: brief.style_direction,
      emotions: brief.emotional_intent,
      occasion: dna.occasion,
      keywords: dna.design_keywords,
      size: dna.size_preference,
      weight: dna.weight_preference,
      cultural_visibility: dna.cultural_visibility,
    },
    design_direction: direction,
    form: {
      product_type: brief.product_type,
      thickness: TIER_THICKNESS[direction.tier],
      weight: dna.weight_preference,
      position: formPosition,
    },
    material: {
      base: "silver",
      finish: direction.material_finish,
    },
    craft: {
      primary: craftRefs[0],
      alternatives: craftRefs.slice(1),
      fineness: TIER_FINESS[direction.tier],
    },
    motif: {
      primary: motif,
      secondary: brief.form_language.slice(0, 2),
    },
    composition: {
      arrangement: TIER_ARRANGEMENT[direction.tier],
      coverage: TIER_COVERAGE[direction.tier],
      usage_scope: compositionScope,
    },
    scale: {
      size: direction.recommended_scale,
    },
    wearability: {
      level: dna.wearability,
      scenes: direction.wearing_scenes,
      reasons: sceneReasons,
    },
    visual_presence: {
      level: dna.cultural_visibility === "unknown" ? "balanced" : dna.cultural_visibility,
    },
    cultural_sources: cards,
    design_reasoning: designReasoning,
    design_interpretation: brief.design_interpretation,
    confidence: brief.confidence,
    uncertainties: brief.uncertainties,
    guardrail_status: {
      passed: true,
      checks: [],
      warnings: [],
    },
  };

  /* 8 — Guardrail the customer-facing document before it is returned. */
  const verification = verifyDesignProposal(draft);
  draft.guardrail_status = verification;
  if (!verification.passed) {
    const failed = verification.checks
      .filter((c) => !c.passed)
      .map((c) => `${c.rule_id}: ${c.message}`)
      .join(" | ");
    throw new ProposalInputError(
      "guardrail_violation",
      `The assembled design proposal failed the cultural guardrails and was withheld: ${failed}`,
    );
  }

  return { proposal: draft, verification };
}
