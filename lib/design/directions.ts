/**
 * STAGE 3 — Design Directions Engine.
 *
 * Translates the cultural-match result into 2–3 DESIGN DIRECTIONS the
 * customer can actually read. A direction is:
 *
 *   (one heritage entity from the re-run match pool) × (one design tier)
 *
 * The tier — quiet / balanced / statement — drives the design language
 * (complexity, scale, finish, craft density, scenes), so the directions
 * differ structurally, never just in naming.
 *
 * PRINCIPLES
 *   - The customer reads design language, not ethnographic vocabulary.
 *   - Every cultural attribute is derived server-side from the knowledge
 *     base; the client supplies only ids. (Same integrity model as
 *     translate.ts.)
 *   - Template sentences: the engine emits { key, vars } items, the UI
 *     renders them through the designDirections i18n section. Engine stays
 *     pure and locale-free.
 *   - Symbolic meaning is never invented: motifs without documented
 *     meaning surface the standard honesty template (see
 *     `uncertainty.visualOnly`).
 *
 * Stage 1 / Stage 2 engines are consumed read-only; nothing here modifies
 * them.
 */

import { matchCulturalHeritage } from "@/lib/heritage/match";
import { loadCrafts, loadSources } from "@/lib/heritage/repository";
import {
  CRAFT_AESTHETICS,
  ITEM_ORNATE,
  KNOWN_REGIONS,
  REGION_PROFILE,
} from "@/lib/heritage/glossary";
import type {
  CulturalMatchResult,
  MatchEntityKind,
  SourceRef,
} from "@/lib/heritage/types";
import type { GlobalDesignBrief } from "@/lib/ai/schemas";
import { TIER_COMPLEXITY } from "@/lib/design/schemas";
import type {
  DesignDirection,
  DirectionTier,
  OrientationSummary,
  ReasoningChain,
  WhyItem,
} from "@/lib/design/schemas";
import {
  EVIDENCE_WEIGHT,
  groundEntityById,
  type HeritageGround,
  TranslationInputError,
} from "@/lib/design/translate";

/* -------------------------------------------------------------------------- */
/*  Deterministic tier vocabulary                                             */
/* -------------------------------------------------------------------------- */

interface TierSpec {
  /** style tokens (rendered via values.style) */
  keywords: string[];
  scale: "small" | "medium" | "large";
  finish: "high-polish" | "satin-matte" | "textured-relief";
  /** KB craft names, priority order (ids resolved from the KB). */
  crafts: string[];
  defaultScenes: string[];
  defaultEmotions: string[];
}

const TIER_SPEC: Record<DirectionTier, TierSpec> = {
  quiet: {
    keywords: ["minimal", "delicate"],
    scale: "small",
    finish: "high-polish",
    crafts: ["拉丝", "洗涤/洗亮"],
    defaultScenes: ["everyday", "travel"],
    defaultEmotions: ["calm", "serenity"],
  },
  balanced: {
    keywords: ["refined", "classic"],
    scale: "medium",
    finish: "satin-matte",
    crafts: ["錾花/錾刻", "压花"],
    defaultScenes: ["everyday", "date"],
    defaultEmotions: ["joy", "connection"],
  },
  statement: {
    keywords: ["statement", "sculptural"],
    scale: "large",
    finish: "textured-relief",
    crafts: ["捶打/锤錾", "焊接/焊花"],
    defaultScenes: ["festival", "formal"],
    defaultEmotions: ["energy", "strength"],
  },
};

const SLOTS: Array<{ id: "dir-a" | "dir-b" | "dir-c"; tier: DirectionTier }> = [
  { id: "dir-a", tier: "quiet" },
  { id: "dir-b", tier: "balanced" },
  { id: "dir-c", tier: "statement" },
];

/** Valid display tokens (UI values tables) used when merging user DNA. */
const OCCASION_TOKENS = new Set([
  "everyday",
  "date",
  "festival",
  "wedding",
  "gift",
  "formal",
  "travel",
]);
const EMOTION_TOKENS = new Set([
  "love",
  "freedom",
  "protection",
  "new-beginning",
  "connection",
  "transformation",
  "calm",
  "joy",
  "hope",
  "strength",
  "rebirth",
  "serenity",
  "energy",
  "nostalgia",
]);

function normalizeToken(token: string): string {
  return token.trim().toLowerCase().replace(/\s+/g, "-");
}

/** User tokens first (their words matter), tier defaults fill the rest. */
function mergeTokens(
  userTokens: string[],
  valid: Set<string>,
  tierDefaults: string[],
  max: number,
): string[] {
  const kept = userTokens
    .map(normalizeToken)
    .filter((t) => valid.has(t));
  const merged = [...new Set([...kept, ...tierDefaults])];
  return merged.slice(0, max);
}

/* -------------------------------------------------------------------------- */
/*  Tier affinity (how well an entity's ornate weight fits a tier)            */
/* -------------------------------------------------------------------------- */

function entityOrnate(ground: HeritageGround | null): number {
  if (!ground) return 0.5;
  switch (ground.kind) {
    case "heritage_item":
      return ITEM_ORNATE[ground.displayName] ?? 0.5;
    case "regional_style": {
      const regions = KNOWN_REGIONS.filter((r) =>
        (ground.region ?? "").includes(r),
      );
      if (regions.length === 0) return 0.6;
      return (
        regions.reduce((sum, r) => sum + REGION_PROFILE[r].ornate, 0) /
        regions.length
      );
    }
    case "motif":
    case "craft":
      return 0.5;
    case "project":
      return 0.7;
  }
}

function tierAffinity(ornate: number, tier: DirectionTier): number {
  if (tier === "quiet") return 1 - ornate;
  if (tier === "statement") return ornate;
  return 1 - Math.abs(ornate - 0.55) * 1.6;
}

/* -------------------------------------------------------------------------- */
/*  Direction derivation                                                      */
/* -------------------------------------------------------------------------- */

function resolveCrafts(tier: DirectionTier) {
  const kb = loadCrafts();
  const picks = TIER_SPEC[tier].crafts
    .map((name) => kb.find((c) => c.name === name))
    .filter((c): c is NonNullable<typeof c> => Boolean(c))
    .slice(0, 2)
    .map((c) => ({ id: c.id, name: c.name }));
  if (picks.length === 0 && kb.length > 0) {
    picks.push({ id: kb[0].id, name: kb[0].name });
  }
  return picks;
}

function deriveDirection(
  slot: { id: "dir-a" | "dir-b" | "dir-c"; tier: DirectionTier },
  entity: CulturalMatchResult | null,
  ground: HeritageGround | null,
  dna: GlobalDesignBrief,
): DesignDirection {
  const spec = TIER_SPEC[slot.tier];
  const crafts = resolveCrafts(slot.tier);
  const motifElement = ground?.motifElement ?? null;

  const wearing_scenes = mergeTokens(
    dna.occasion === "unknown" ? [] : [dna.occasion],
    OCCASION_TOKENS,
    spec.defaultScenes,
    3,
  );
  const emotional_expression = mergeTokens(
    dna.emotion,
    EMOTION_TOKENS,
    spec.defaultEmotions,
    3,
  );

  /* --- why suitable (hedged, template-based) --- */
  const why_suitable: WhyItem[] = [
    { key: `why.tier.${slot.tier}` },
    ...(entity
      ? [
        {
          key: "why.match",
          vars: { entity: entity.name, score: String(entity.match_score) },
        },
      ]
      : [{ key: "why.formLed" }]),
    ...(motifElement
      ? [{ key: "why.motif", vars: { motif: motifElement.name } }]
      : []),
    ...(crafts.length > 0
      ? [{ key: "why.craft", vars: { craft: crafts[0].name } }]
      : []),
  ];

  /* --- uncertainties (honesty layer) --- */
  const uncertainties: WhyItem[] = [];
  if (motifElement && motifElement.presented_as === "visual-subject") {
    uncertainties.push({
      key: "uncertainty.visualOnly",
      vars: { motif: motifElement.name },
    });
  }
  if (!motifElement) {
    uncertainties.push({ key: "uncertainty.noMotif" });
  }
  uncertainties.push({ key: "uncertainty.exploration" });

  /* --- cultural constraints (hard copy/design boundaries) --- */
  const cultural_constraints: WhyItem[] = [];
  if (motifElement) {
    cultural_constraints.push(
      motifElement.presented_as === "documented-meaning"
        ? {
          key: "constraint.documentedMeaning",
          vars: { motif: motifElement.name },
        }
        : { key: "constraint.visualOnly", vars: { motif: motifElement.name } },
    );
  }
  if (ground?.region) {
    cultural_constraints.push({
      key: "constraint.region",
      vars: { region: ground.region },
    });
  }
  if (!entity) {
    cultural_constraints.push({ key: "constraint.formLed" });
  }

  /* --- design interpretation (Layer 2 — labeled, downstream-facing) --- */
  const statements: string[] = [
    `A ${spec.scale}-scale ${dna.product_type} at ${TIER_COMPLEXITY[slot.tier]} complexity in silver, ${spec.finish} finish.`,
    entity
      ? `Grounded in the documented ${entity.name} direction (match ${entity.match_score}/100).`
      : "Form-led: no cultural reference is claimed.",
  ];
  if (motifElement) {
    statements.push(
      `The documented "${motifElement.name}" element is treated as ${motifElement.presented_as === "documented-meaning" ? "its officially documented symbol" : "formal visual vocabulary only"}.`,
    );
  }
  if (crafts.length > 0) {
    statements.push(
      `Surface logic follows ${crafts[0].name} — ${CRAFT_AESTHETICS[crafts[0].name]?.gloss ?? "a documented forging technique"}.`,
    );
  }

  /* --- confidence: match strength blended with evidence quality --- */
  const evidenceScore = ground
    ? (EVIDENCE_WEIGHT[ground.evidenceLevel] ?? 0.5) * 0.6 +
    (ground.sourceIds.length >= 2
      ? 0.4
      : ground.sourceIds.length === 1
        ? 0.28
        : 0)
    : 0;
  const matchComponent = entity ? entity.match_score / 100 : 0.4;
  const confidence = ground
    ? Math.round((matchComponent * 0.45 + evidenceScore * 0.55) * 100) / 100
    : Math.round(dna.confidence * 0.4 * 100) / 100;

  /* --- evidence sources actually cited --- */
  const source_refs: SourceRef[] = (ground?.sourceIds ?? [])
    .map((id) => loadSources().find((s) => s.id === id))
    .filter((s): s is NonNullable<typeof s> => Boolean(s))
    .map(({ id, title, publisher, url }) => ({ id, title, publisher, url }));

  return {
    id: slot.id,
    tier: slot.tier,
    origin_match_id: entity?.id ?? null,
    origin_match_name: entity?.name ?? null,
    origin_match_score: entity?.match_score ?? null,
    heritage_reference: ground
      ? {
        match_id: ground.id,
        name: ground.displayName,
        type: ground.kind,
        region: ground.region,
        meaning_status: ground.meaningStatus,
        source_ids: ground.sourceIds,
        evidence_level: ground.evidenceLevel,
      }
      : null,
    design_keywords: [...spec.keywords],
    form_token: dna.product_type,
    recommended_scale: spec.scale,
    material_finish: spec.finish,
    crafts,
    motif_elements: motifElement ? [motifElement] : [],
    wearing_scenes,
    emotional_expression,
    why_suitable,
    documented_cultural_facts: ground?.facts ?? [],
    source_refs,
    evidence_level: ground?.evidenceLevel ?? "inference",
    meaning_status: ground?.meaningStatus ?? "not_applicable",
    uncertainties,
    cultural_constraints,
    design_interpretation: {
      notice:
        "AI DESIGN INTERPRETATION — system design reasoning, not documented cultural fact.",
      statements,
    },
    confidence,
  };
}

/* -------------------------------------------------------------------------- */
/*  Public engine                                                             */
/* -------------------------------------------------------------------------- */

export interface DesignDirectionsInput {
  designBrief: GlobalDesignBrief;
  /** Stage 2 selection (payload integrity-checked, then re-grounded). */
  selectedMatch?: CulturalMatchResult | null;
  /** Rotation offset for「再看看其他方向」. */
  refresh?: number;
}

export interface DesignDirectionsOutput {
  orientation: OrientationSummary;
  reasoning_chain: ReasoningChain;
  directions: DesignDirection[];
  source_refs: SourceRef[];
}

export function generateDesignDirections(
  input: DesignDirectionsInput,
): DesignDirectionsOutput {
  const dna = input.designBrief;
  const refresh = Math.max(0, Math.min(20, input.refresh ?? 0));

  /* 1 — Re-run the Stage 2 matcher server-side (read-only). */
  let pool = matchCulturalHeritage(dna);

  /* 2 — Payload integrity: a client-supplied match is only trusted for its
     id; every attribute is re-derived from the KB. Mismatch is rejected. */
  if (input.selectedMatch) {
    const match = input.selectedMatch;
    const ground = groundEntityById(match.id);
    if (!ground) {
      throw new TranslationInputError(
        "unknown_heritage_entity",
        `Selected heritage match "${match.id}" does not exist in the knowledge base.`,
      );
    }
    if (match.name !== ground.displayName || match.region !== ground.region) {
      throw new TranslationInputError(
        "inconsistent_match_payload",
        `Heritage match payload for "${match.id}" does not line up with the knowledge base (expected "${ground.displayName}" / region "${ground.region}"). Cultural attributes are re-derived from the knowledge base and cannot be supplied by the client.`,
      );
    }
    /* Keep the Stage 2 choice visible even if the re-run pool drifts. */
    if (!pool.some((m) => m.id === match.id)) {
      pool = [match, ...pool].slice(0, 8);
    }
  }

  /* 3 — Assign one entity per tier: tier affinity, match strength, kind
     diversity, refresh rotation. */
  const grounds = new Map<string, HeritageGround | null>(
    pool.map((m) => [m.id, groundEntityById(m.id)]),
  );
  const usedKinds = new Set<MatchEntityKind>();
  const assigned = new Map<
    "dir-a" | "dir-b" | "dir-c",
    { entity: CulturalMatchResult | null; ground: HeritageGround | null }
  >();

  for (const slot of SLOTS) {
    if (pool.length === 0) {
      assigned.set(slot.id, { entity: null, ground: null });
      continue;
    }
    const ranked = pool
      .map((m, index) => {
        const ornate = entityOrnate(grounds.get(m.id) ?? null);
        const affinity = tierAffinity(ornate, slot.tier);
        const kindPenalty = usedKinds.has(m.type) ? 0.15 : 0;
        return { m, index, score: affinity + m.match_score / 400 - kindPenalty };
      })
      .sort((a, b) => b.score - a.score);
    const offset = refresh % ranked.length;
    const rotated = [
      ...ranked.slice(offset),
      ...ranked.slice(0, offset),
    ];
    const chosen = rotated[0];
    assigned.set(slot.id, {
      entity: chosen.m,
      ground: grounds.get(chosen.m.id) ?? null,
    });
    usedKinds.add(chosen.m.type);
  }

  /* 4 — Derive each direction. */
  const directions = SLOTS.map((slot) => {
    const pick = assigned.get(slot.id)!;
    return deriveDirection(slot, pick.entity, pick.ground, dna);
  });

  /* 5 — SECTION 01 orientation summary (hedged, never absolute). */
  const primaryStyle =
    dna.style.find((s) => s.trim().length > 0) ?? "modern";
  const orientation: OrientationSummary = {
    summary: {
      key: "orientation.summary",
      vars: {
        style: primaryStyle,
        product: dna.product_type,
        count: String(pool.length),
      },
    },
    selected_name: input.selectedMatch?.name ?? null,
    match_count: pool.length,
  };

  /* 6 — SECTION 02 reasoning chain (four explicit layers). */
  const design_signals: WhyItem[] = [];
  design_signals.push({
    key: "signal.product",
    vars: { product: dna.product_type },
  });
  const styleSignals = dna.style
    .map(normalizeToken)
    .filter((s) => s.length > 0)
    .slice(0, 2);
  if (styleSignals.length > 0) {
    design_signals.push({ key: "signal.style", vars: { style: styleSignals[0] } });
  }
  if (styleSignals.length > 1) {
    design_signals.push({ key: "signal.style", vars: { style: styleSignals[1] } });
  }
  if (dna.complexity) {
    design_signals.push({
      key: "signal.complexity",
      vars: { level: dna.complexity },
    });
  }
  if (dna.cultural_visibility) {
    design_signals.push({
      key: "signal.visibility",
      vars: { level: dna.cultural_visibility },
    });
  }
  if (dna.occasion && dna.occasion !== "unknown") {
    design_signals.push({
      key: "signal.scene",
      vars: { scene: normalizeToken(dna.occasion) },
    });
  }

  const reasoning_chain: ReasoningChain = {
    customer_preferences: [
      dna.product_type,
      ...styleSignals,
      ...dna.emotion.map(normalizeToken).slice(0, 2),
      ...(dna.occasion && dna.occasion !== "unknown"
        ? [normalizeToken(dna.occasion)]
        : []),
    ],
    design_signals,
    cultural_directions: pool.slice(0, 3).map((m) => ({
      id: m.id,
      name: m.name,
      type: m.type,
      region: m.region,
      match_score: m.match_score,
    })),
    design_possibilities: SLOTS.map((slot) => {
      const pick = assigned.get(slot.id)!;
      return {
        key: `possibility.${slot.tier}`,
        vars: { entity: pick.entity?.name ?? "" },
      };
    }),
  };

  /* 7 — Merge the sources every direction actually cites. */
  const seen = new Set<string>();
  const source_refs: SourceRef[] = [];
  for (const dir of directions) {
    for (const ref of dir.source_refs) {
      if (!seen.has(ref.id)) {
        seen.add(ref.id);
        source_refs.push(ref);
      }
    }
  }

  return { orientation, reasoning_chain, directions, source_refs };
}

/** Find one generated direction by slot id (route-level brief step). */
export function findDirectionById(
  output: DesignDirectionsOutput,
  directionId: string,
): DesignDirection | null {
  return output.directions.find((d) => d.id === directionId) ?? null;
}
