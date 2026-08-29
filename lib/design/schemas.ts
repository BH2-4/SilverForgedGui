/**
 * STAGE 3 — CULTURAL DESIGN TRANSLATION · Schemas
 *
 * Defines the Zod contract for the Design Translation Engine:
 *   input  — Global Design DNA + Selected Heritage Match (+ Stage 2 guardrail)
 *   output — a structured Design Brief that downstream image generation can
 *            consume without ever touching raw user text.
 *
 * TRUTH LAYERING (the core principle of this stage):
 *   1. Documented Cultural Evidence  — `documented_cultural_facts`, strings
 *      that must be byte-identical to knowledge-base fields (verified in
 *      lib/design/verification.ts via their `origin` pointer).
 *   2. Design Interpretation         — `design_interpretation`, system design
 *      reasoning. Always carries the literal AI DESIGN INTERPRETATION notice
 *      so it can never masquerade as cultural fact.
 *   3. AI Generated Design Proposal  — `generation_prompt` / the concrete
 *      design decisions, assembled ONLY from the structured fields above.
 *
 * The Stage 2 payload mirrors below are compile-time asserted to stay in
 * sync with lib/heritage/types — the engines themselves are untouched.
 */

import { z } from "zod";
import { GlobalDesignBriefSchema } from "@/lib/ai/schemas";
import {
  ClaimLevelSchema,
  EvidenceLevelSchema,
  MATCH_ENTITY_KINDS,
  MatchWhySchema,
  RegionInfoSchema,
  type CulturalMatchResult,
  type GuardrailResult,
  type SourceRef,
} from "@/lib/heritage/types";

/* -------------------------------------------------------------------------- */
/*  Compile-time drift guards (Stage 2 ⇄ Stage 3 contract parity)              */
/* -------------------------------------------------------------------------- */

type AssertEqual<A, B> = (<T>() => T extends A ? 1 : 2) extends
  (<T>() => T extends B ? 1 : 2)
  ? true
  : false;

/** Fails to compile if the Stage 2 CulturalMatchResult interface drifts. */
type _MatchCompat = AssertEqual<
  z.infer<typeof CulturalMatchResultSchema>,
  CulturalMatchResult
>;
/** Fails to compile if the Stage 2 GuardrailResult interface drifts. */
type _GuardrailCompat = AssertEqual<
  z.infer<typeof GuardrailResultSchema>,
  GuardrailResult
>;
/** Fails to compile if the Stage 2 SourceRef type drifts. */
type _SourceRefCompat = AssertEqual<z.infer<typeof SourceRefSchema>, SourceRef>;

/* -------------------------------------------------------------------------- */
/*  Stage 2 payload mirrors (validation-only; attributes are re-derived)      */
/* -------------------------------------------------------------------------- */

const ScoreBreakdownSchema = z.object({
  visual_style_fit: z.number(),
  product_fit: z.number(),
  wearability_fit: z.number(),
  regional_fit: z.number(),
  keyword_fit: z.number(),
  evidence_confidence: z.number(),
});

/**
 * Mirror of the Stage 2 match result. IMPORTANT: the translation engine only
 * trusts the `id` of this payload for knowledge-base lookup — every cultural
 * attribute (name, region, evidence, sources) is re-derived server-side so a
 * tampered client payload can never inject cultural claims.
 */
export const CulturalMatchResultSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  type: z.enum(MATCH_ENTITY_KINDS),
  region: z.string().nullable(),
  match_score: z.number().int().min(0).max(100),
  score_breakdown: ScoreBreakdownSchema,
  score_breakdown_weighted: ScoreBreakdownSchema,
  matched_reasons: z.array(z.string().min(1)),
  cultural_evidence: z.array(z.string().min(1)),
  cultural_meaning: z.string().nullable(),
  meaning_status: z.enum(["documented", "not_documented", "not_applicable"]),
  source_ids: z.array(z.string().min(1)),
  evidence_level: EvidenceLevelSchema,
  /** Knowledge-base enhancement: structured region hierarchy. */
  region_info: RegionInfoSchema,
  /** Knowledge-base enhancement: three-layer "why" contract. */
  why: MatchWhySchema,
  /** Knowledge-base enhancement: dataset-derived claim level (never AI-raised). */
  claim_level: ClaimLevelSchema,
});

export const GuardrailCheckSchema = z.object({
  rule_id: z.string().min(1),
  rule_type: z.string().min(1),
  severity: z.enum(["high", "medium", "low"]),
  passed: z.boolean(),
  message: z.string(),
});

export const GuardrailResultSchema = z.object({
  passed: z.boolean(),
  checks: z.array(GuardrailCheckSchema),
  warnings: z.array(z.string()),
});

export const SourceRefSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  publisher: z.string().min(1),
  url: z.string().min(1),
});

/**
 * Stage 2 → Stage 3 hand-off payload (persisted by the match page).
 * A match that cites no sources is malformed Stage 2 output — rejected.
 */
const SelectedMatchPayloadSchema = CulturalMatchResultSchema.refine(
  (m) => m.source_ids.length > 0,
  { message: "Selected heritage match must cite at least one source id." },
);

export const TranslationHandoffSchema = z.object({
  designBrief: GlobalDesignBriefSchema.superRefine((brief, ctx) => {
    if (
      brief.style.length === 0 &&
      brief.emotion.length === 0 &&
      brief.design_keywords.length === 0
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["designBrief"],
        message:
          "Design DNA is empty — no style, emotion, or keywords to translate.",
      });
    }
  }),
  selectedMatch: SelectedMatchPayloadSchema,
  guardrail: GuardrailResultSchema.optional(),
});
export type TranslationHandoff = z.infer<typeof TranslationHandoffSchema>;

/* -------------------------------------------------------------------------- */
/*  Design Brief — the Stage 3 output contract                                */
/* -------------------------------------------------------------------------- */

export const DesignInterpretationSchema = z.object({
  /**
   * Literal marker. Rendered verbatim by the UI and asserted by the
   * verification layer — interpretation can never be mistaken for fact.
   */
  notice: z.literal(
    "AI DESIGN INTERPRETATION — system design reasoning, not documented cultural fact.",
  ),
  statements: z.array(z.string().min(1)).min(1),
});

/** Knowledge-base origin of one documented fact (for tamper verification). */
export const FactOriginSchema = z.object({
  entity_id: z.string().min(1),
  /** Dataset field the fact was copied from. */
  field: z.enum(["description", "documented_meaning", "features"]),
});

export const DocumentedFactSchema = z.object({
  fact: z.string().min(1),
  source_ids: z.array(z.string().min(1)).min(1),
  region: z.string().nullable(),
  evidence_level: EvidenceLevelSchema,
  origin: FactOriginSchema,
});

export const MotifElementSchema = z.object({
  name: z.string().min(1),
  region: z.string().nullable(),
  /**
   * `visual-subject` — the motif is used purely as a documented visual
   * element. `documented-meaning` — the dataset records a symbolic meaning
   * (currently none does; the field exists so the data can grow honestly).
   */
  presented_as: z.enum(["visual-subject", "documented-meaning"]),
  documented_meaning: z.string().nullable(),
  source_ids: z.array(z.string().min(1)).min(1),
  evidence_level: EvidenceLevelSchema,
  origin_entity_id: z.string().min(1),
});

export const HeritageReferenceSchema = z.object({
  match_id: z.string().min(1),
  name: z.string().min(1),
  type: z.enum(MATCH_ENTITY_KINDS),
  region: z.string().nullable(),
  meaning_status: z.enum(["documented", "not_documented", "not_applicable"]),
  source_ids: z.array(z.string().min(1)).min(1),
  evidence_level: EvidenceLevelSchema,
});

/* -------------------------------------------------------------------------- */
/*  Stage 3 — Design Directions (exploration layer)                            */
/* -------------------------------------------------------------------------- */

/**
 * A localizable engine sentence: the engine (pure, deterministic) emits a
 * template key + interpolation vars; the UI renders it with t(). This keeps
 * the engine free of hard-coded copy while staying fully typed (no `any`).
 */
export const WhyItemSchema = z.object({
  key: z.string().min(1),
  vars: z.record(z.string(), z.string()).optional(),
});
export type WhyItem = z.infer<typeof WhyItemSchema>;

/**
 * Differentiation tiers. A direction = (one heritage entity) × (one tier).
 * The tier drives complexity / scale / finish / craft density, so
 * quiet / balanced / statement directions differ structurally, not just in
 * naming.
 */
export const DIRECTION_TIERS = ["quiet", "balanced", "statement"] as const;
export type DirectionTier = (typeof DIRECTION_TIERS)[number];

export const TIER_COMPLEXITY: Record<DirectionTier, "low" | "medium" | "high"> = {
  quiet: "low",
  balanced: "medium",
  statement: "high",
};

/** KB craft pick (id used for i18n gloss lookup, name shown verbatim). */
export const DirectionCraftSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
});
export type DirectionCraft = z.infer<typeof DirectionCraftSchema>;

export const DesignDirectionSchema = z.object({
  /** Stable slot id: dir-a = quiet, dir-b = balanced, dir-c = statement. */
  id: z.enum(["dir-a", "dir-b", "dir-c"]),
  tier: z.enum(DIRECTION_TIERS),

  /** Heritage entity the direction is grounded in (null = form-led). */
  origin_match_id: z.string().nullable(),
  origin_match_name: z.string().nullable(),
  /** Stage-2 match score of the origin entity, when it came from the pool. */
  origin_match_score: z.number().int().min(0).max(100).nullable(),
  heritage_reference: HeritageReferenceSchema.nullable(),

  /* --- design content (structured tokens; UI renders via i18n) --- */
  design_keywords: z.array(z.string().min(1)).min(1),
  /** product_type token; UI adds the tier-specific form phrase. */
  form_token: z.string().min(1),
  recommended_scale: z.enum(["small", "medium", "large"]),
  material_finish: z.enum(["high-polish", "satin-matte", "textured-relief"]),
  crafts: z.array(DirectionCraftSchema),
  motif_elements: z.array(MotifElementSchema),
  /** occasion tokens (rendered with existing tv("occasion", …)). */
  wearing_scenes: z.array(z.string().min(1)).min(1),
  /** emotion tokens (rendered with existing tv("emotion", …)). */
  emotional_expression: z.array(z.string().min(1)).min(1),

  /* --- explanation (template sentences) --- */
  why_suitable: z.array(WhyItemSchema).min(1),

  /* --- evidence (Layer 1) --- */
  documented_cultural_facts: z.array(DocumentedFactSchema),
  source_refs: z.array(SourceRefSchema),
  evidence_level: EvidenceLevelSchema,
  meaning_status: z.enum(["documented", "not_documented", "not_applicable"]),

  /* --- honesty layer --- */
  uncertainties: z.array(WhyItemSchema),
  cultural_constraints: z.array(WhyItemSchema),
  design_interpretation: DesignInterpretationSchema,
  confidence: z.number().min(0).max(1),
});
export type DesignDirection = z.infer<typeof DesignDirectionSchema>;

/** SECTION 02 — the four-layer reasoning chain. */
export const ReasoningChainSchema = z.object({
  /** Raw (sanitized) DNA tokens the customer expressed. */
  customer_preferences: z.array(z.string().min(1)),
  /** How those preferences translate into design parameters. */
  design_signals: z.array(WhyItemSchema),
  /** The heritage directions the Stage-2 engine surfaced for them. */
  cultural_directions: z.array(
    z.object({
      id: z.string().min(1),
      name: z.string().min(1),
      type: z.enum(MATCH_ENTITY_KINDS),
      region: z.string().nullable(),
      match_score: z.number().int().min(0).max(100),
    }),
  ),
  /** One-sentence pointer per generated direction. */
  design_possibilities: z.array(WhyItemSchema),
});
export type ReasoningChain = z.infer<typeof ReasoningChainSchema>;

/** SECTION 01 — the orientation summary (hedged, never absolute). */
export const OrientationSummarySchema = z.object({
  summary: WhyItemSchema,
  selected_name: z.string().nullable(),
  match_count: z.number().int().min(0),
});
export type OrientationSummary = z.infer<typeof OrientationSummarySchema>;

export const DesignBriefSchema = z.object({
  design_title: z.string().min(1),
  market: z.string(),
  consumer_profile: z.string(),
  product_type: z.string(),

  style_direction: z.array(z.string().min(1)).min(1),
  form_language: z.array(z.string().min(1)).min(1),
  motif_elements: z.array(MotifElementSchema),

  material: z.object({
    primary: z.string().min(1),
    finish: z.string().min(1),
    notes: z.string().nullable(),
  }),
  color: z.object({
    palette: z.array(z.string().min(1)).min(1),
    rationale: z.string().min(1),
  }),

  size: z.string().min(1),
  weight: z.string().min(1),
  wearability: z.string().min(1),
  complexity: z.string().min(1),
  cultural_visibility: z.string().min(1),

  heritage_reference: HeritageReferenceSchema.nullable(),

  /** Layer 1 — verbatim knowledge-base strings with traceable origin. */
  documented_cultural_facts: z.array(DocumentedFactSchema),
  /** Layer 2 — design reasoning, clearly marked as AI interpretation. */
  design_interpretation: DesignInterpretationSchema,

  avoid_elements: z.array(z.string().min(1)),
  cultural_constraints: z.array(z.string().min(1)),

  /** Downstream sources referenced by this brief. */
  evidence_sources: z.array(SourceRefSchema),

  confidence: z.number().min(0).max(1),

  /** Layer 3 — generated strictly from the structured fields above. */
  generation_prompt: z.string().min(1),
  negative_prompt: z.string().min(1),

  /** Input tokens discarded for carrying unsupported symbolic claims. */
  discarded_symbolic_inputs: z.array(z.string().min(1)),

  /* --- Stage 3 direction extension (brief step) ------------------------- */
  /** The direction snapshot the customer chose ("dir-a" | "dir-b" | "dir-c"). */
  selected_direction: DesignDirectionSchema,
  /** Recommended crafts carried over from the chosen direction. */
  craft: z.object({
    primary: z.string().min(1),
    alternatives: z.array(z.string().min(1)),
  }),
  /** Primary wearing scene (occasion token). */
  wearing_scene: z.string().min(1),
  /** Emotional intent (emotion tokens). */
  emotional_intent: z.array(z.string().min(1)).min(1),
  /** Why this direction fits the customer — hedged, template-based. */
  customer_reason: z.array(WhyItemSchema),
  /** Honest unknowns carried from the direction into the brief. */
  uncertainties: z.array(WhyItemSchema),
});

export type DesignBrief = z.infer<typeof DesignBriefSchema>;
export type DocumentedFact = z.infer<typeof DocumentedFactSchema>;
export type MotifElement = z.infer<typeof MotifElementSchema>;
export type HeritageReference = z.infer<typeof HeritageReferenceSchema>;
export type DesignInterpretation = z.infer<typeof DesignInterpretationSchema>;

/* -------------------------------------------------------------------------- */
/*  Request / response contracts (two-step protocol)                           */
/* -------------------------------------------------------------------------- */

/**
 * /api/design-translation request. Two steps:
 *  - "directions": generate 2–3 differentiated design directions.
 *  - "brief": assemble the final Design Brief for one chosen direction.
 * `step` defaults to "brief" so the previous single-step contract keeps
 * working unchanged.
 */
export const TranslationRequestSchema = z.object({
  designBrief: GlobalDesignBriefSchema.superRefine((brief, ctx) => {
    if (
      brief.style.length === 0 &&
      brief.emotion.length === 0 &&
      brief.design_keywords.length === 0
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["designBrief"],
        message:
          "Design DNA is empty — no style, emotion, or keywords to translate.",
      });
    }
  }),
  selectedMatch: SelectedMatchPayloadSchema.nullable().optional(),
  guardrail: GuardrailResultSchema.optional(),
  step: z.enum(["directions", "brief"]).default("brief"),
  /** Required when step = "brief" (chosen in the exploration step). */
  direction_id: z.string().min(1).optional(),
  /** Rotation offset for「再看看其他方向」— shifts the entity pool start. */
  refresh: z.number().int().min(0).max(20).default(0),
});
export type TranslationRequest = z.infer<typeof TranslationRequestSchema>;

export const DirectionsResponseSchema = z.object({
  success: z.literal(true),
  design_dna: GlobalDesignBriefSchema,
  orientation: OrientationSummarySchema,
  reasoning_chain: ReasoningChainSchema,
  directions: z.array(DesignDirectionSchema).min(2).max(3),
  source_refs: z.array(SourceRefSchema),
});
export type DirectionsResponse = z.infer<typeof DirectionsResponseSchema>;

/** Full API response body for /api/design-translation (brief step). */
export const TranslationResponseSchema = z.object({
  success: z.literal(true),
  design_dna: GlobalDesignBriefSchema,
  selected_match_id: z.string().nullable(),
  selected_direction_id: z.string().min(1).nullable(),
  design_brief: DesignBriefSchema,
  verification: GuardrailResultSchema,
  source_refs: z.array(SourceRefSchema),
});

/* -------------------------------------------------------------------------- */
/*  STAGE 4 — CUSTOM DESIGN PROPOSAL · Schemas                                 */
/*                                                                             */
/*  Turns the Design Brief into the customer-facing document: a complete       */
/*  "贵州银饰定制设计提案". The proposal RE-EXPORTS brief content verbatim     */
/*  (facts, motif, sources, uncertainties) and adds only three kinds of new   */
/*  information — all template-based, all UI-i18n driven, none of them        */
/*  cultural claims:                                                          */
/*    · deterministic derivations (thickness, composition, presence…),       */
/*    · the reasoning chain (你的选择 → 设计基因 → 文化方向 → 设计语言 → 方案)  */
/*    · classification of what is official record vs visual reference.       */
/*  The final visual generation is deliberately NOT part of this stage:      */
/*  the customer first confirms the direction itself.                        */
/* -------------------------------------------------------------------------- */

/** Display name for SECTION 01 — {tier} · {core}{product}. */
export const ProposalTitleSchema = z.object({
  tier: z.enum(DIRECTION_TIERS),
  /** KB display name (entity name) — null when the proposal is form-led. */
  core: z.string().nullable(),
  product_type: z.string().min(1),
});

/** One-line concept — rendered from tokens only, never invented prose. */
export const ProposalConceptSchema = z.object({
  emotion_tokens: z.array(z.string()).min(1),
  scene: z.string().min(1),
});

/** SECTION 02 input — what the customer actually asked for, from Stage 0. */
export const CustomerIntentSchema = z.object({
  product_type: z.string().min(1),
  /** Sanitized in Stage 3 (brief.style_direction) — unsupported symbolic tokens never appear. */
  style: z.array(z.string()).min(1),
  emotions: z.array(z.string()).min(1),
  occasion: z.string(),
  keywords: z.array(z.string()),
  size: z.enum(["small", "medium", "large", "unknown"]),
  weight: z.enum(["light", "medium", "heavy", "unknown"]),
  cultural_visibility: z.enum(["subtle", "balanced", "strong", "unknown"]),
});

/** SECTION 03 — form factor. */
export const ProposalFormSchema = z.object({
  product_type: z.string().min(1),
  /** Derived from tier complexity (quiet → slim … statement → substantial). */
  thickness: z.enum(["slim", "medium", "substantial"]),
  weight: z.enum(["light", "medium", "heavy", "unknown"]),
  /** Wearing position — per-product template key. */
  position: WhyItemSchema,
});

/** SECTION 05 — material. */
export const ProposalMaterialSchema = z.object({
  base: z.literal("silver"),
  finish: z.enum(["high-polish", "satin-matte", "textured-relief"]),
});

/** A craft as cited in SECTION 05 — resolved from the KB, sources intact. */
export const ProposalCraftRefSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  source_ids: z.array(z.string().min(1)),
  evidence_level: EvidenceLevelSchema,
});

export const ProposalCraftSchema = z.object({
  primary: ProposalCraftRefSchema,
  alternatives: z.array(ProposalCraftRefSchema),
  /** Level of detail — mirrors tier complexity. */
  fineness: z.enum(["low", "medium", "high"]),
});

/** SECTION 04 — pattern. */
export const ProposalMotifSchema = z.object({
  /** Verbatim MotifElement from the brief — null when form-led. */
  primary: MotifElementSchema.nullable(),
  /** Structural accent tokens (design inference, never cultural claims). */
  secondary: z.array(z.string()),
});

export const ProposalCompositionSchema = z.object({
  arrangement: z.enum(["single-focus", "balanced-dual", "layered-system"]),
  coverage: z.enum(["local", "partial", "full"]),
  /** Where the motif system is applied — per-product template key. */
  usage_scope: WhyItemSchema,
});

export const ProposalScaleSchema = z.object({
  size: z.enum(["small", "medium", "large"]),
});

export const ProposalVisualPresenceSchema = z.object({
  level: z.enum(["subtle", "balanced", "strong"]),
});

/** SECTION 06 — wearability. */
export const ProposalWearabilitySchema = z.object({
  level: z.enum(["low", "medium", "high", "unknown"]),
  scenes: z.array(z.string().min(1)).min(1),
  /** Per-scene fit — one template-backed reason per wearing scene. */
  reasons: z.array(WhyItemSchema).min(1),
});

/**
 * SECTION 07 — a cultural source card. This is the trust core of the whole
 * system: everything the proposal asserts about culture lives here, with
 * its sources, evidence level, claim level and confidence.
 */
export const PROPOSAL_SOURCE_CLASSIFICATIONS = [
  "official_record",
  "visual_reference",
] as const;

export const ProposalCulturalSourceSchema = z.object({
  entity_id: z.string().min(1),
  entity_name: z.string().min(1),
  entity_kind: z.enum(MATCH_ENTITY_KINDS),
  region: z.string().nullable(),
  meaning_status: z.enum(["documented", "not_documented", "not_applicable"]),
  /**
   * `visual_reference` — only the visual form is documented, no symbolic
   * meaning may be derived. `official_record` — a documented cultural record.
   * Derived from meaning_status, verified by RULE-007.
   */
  classification: z.enum(PROPOSAL_SOURCE_CLASSIFICATIONS),
  /** Verbatim documented facts (byte-identical to the KB — RULE-006). */
  facts: z.array(DocumentedFactSchema),
  source_refs: z.array(SourceRefSchema),
  evidence_level: EvidenceLevelSchema,
  claim_level: ClaimLevelSchema,
  confidence: z.number().min(0).max(1),
});

/** SECTION 02 — the five reasoning layers, in fixed derivation order. */
export const PROPOSAL_REASONING_STEPS = [
  "your_choices",
  "design_dna",
  "cultural_direction",
  "design_language",
  "final_proposal",
] as const;

export const ProposalReasoningStepSchema = z.object({
  step: z.enum(PROPOSAL_REASONING_STEPS),
  items: z.array(WhyItemSchema).min(1),
});

export const DesignProposalSchema = z.object({
  id: z.string().min(1),
  title: ProposalTitleSchema,
  concept: ProposalConceptSchema,
  customer_intent: CustomerIntentSchema,
  /** The direction snapshot the customer chose in Stage 3, verbatim. */
  design_direction: DesignDirectionSchema,
  form: ProposalFormSchema,
  material: ProposalMaterialSchema,
  craft: ProposalCraftSchema,
  motif: ProposalMotifSchema,
  composition: ProposalCompositionSchema,
  scale: ProposalScaleSchema,
  wearability: ProposalWearabilitySchema,
  visual_presence: ProposalVisualPresenceSchema,
  cultural_sources: z.array(ProposalCulturalSourceSchema),
  design_reasoning: z.array(ProposalReasoningStepSchema).min(1),
  /** Layer 2 — design interpretation, verbatim from the brief. */
  design_interpretation: DesignInterpretationSchema,
  confidence: z.number().min(0).max(1),
  uncertainties: z.array(WhyItemSchema),
  /** Filled after the proposal passes the guardrail verification. */
  guardrail_status: GuardrailResultSchema,
});
export type DesignProposal = z.infer<typeof DesignProposalSchema>;
export type ProposalCulturalSource = z.infer<typeof ProposalCulturalSourceSchema>;
export type ProposalReasoningStep = z.infer<typeof ProposalReasoningStepSchema>;
export type ProposalCraftRef = z.infer<typeof ProposalCraftRefSchema>;

/**
 * /api/design-proposal request. The brief was server-generated in Stage 3
 * and is re-verified here (facts re-checked against the KB, direction
 * re-checked, origin entity re-grounded) — a tampered payload is rejected
 * before any proposal is assembled.
 */
export const ProposalRequestSchema = z.object({
  designDna: GlobalDesignBriefSchema,
  designBrief: DesignBriefSchema,
});
export type ProposalRequest = z.infer<typeof ProposalRequestSchema>;

/**
 * Stage 4 → Stage 5 hand-off, persisted when the customer confirms the
 * proposal. Stage 5 (visual design) re-derives nothing: it reads the
 * confirmed proposal directly and renders it.
 */
export const ProposalHandoffSchema = z.object({
  designDna: GlobalDesignBriefSchema,
  designBrief: DesignBriefSchema,
  selectedDirectionId: z.string().min(1),
  proposal: DesignProposalSchema,
});
export type ProposalHandoff = z.infer<typeof ProposalHandoffSchema>;
