import { z } from "zod";

/**
 * Type layer for the SilverHeritage-GZ knowledge base.
 *
 * Single source of truth for parsing every `data/*.json` file and for the
 * shapes emitted by the Cultural Match Engine. Every entity MUST retain
 * `source_ids` and `evidence_level` — dropping provenance is a data bug,
 * not a convenience trade-off.
 */

/* -------------------------------------------------------------------------- */
/*  Evidence levels (source strength — see docs/schema.md)                     */
/* -------------------------------------------------------------------------- */

export const EvidenceLevelSchema = z.enum([
  "official",
  "interview",
  "museum",
  "academic",
  "inference",
]);

export type EvidenceLevel = z.infer<typeof EvidenceLevelSchema>;

/* -------------------------------------------------------------------------- */
/*  Claim levels (semantic strength of a cultural statement)                   */
/*                                                                             */
/*  Independent of EvidenceLevel (which describes the SOURCE TYPE):            */
/*    official      — directly supported by an authoritative source            */
/*                     (gov / ICH registry / museum)                           */
/*    documented    — recorded in research or published material               */
/*    interpretive  — a design interpretation built on cultural data,         */
/*                     NOT an original cultural fact                           */
/*    visual_only   — visual form confirmed to exist; no fixed cultural        */
/*                     meaning may be attached                                 */
/*    unknown       — cannot be reliably confirmed                             */
/*                                                                             */
/*  HARD RULE: visual_only / interpretive / unknown claims must never be       */
/*  upgraded to cultural fact by AI reasoning (guardrail RULE-007).            */
/* -------------------------------------------------------------------------- */

export const ClaimLevelSchema = z.enum([
  "official",
  "documented",
  "interpretive",
  "visual_only",
  "unknown",
]);

export type ClaimLevel = z.infer<typeof ClaimLevelSchema>;

/* -------------------------------------------------------------------------- */
/*  Cultural evidence — the traceable unit of every cultural fact              */
/* -------------------------------------------------------------------------- */

export const CulturalEvidenceSchema = z.object({
  /** Resolved dataset source id. null = no source (never fabricated). */
  sourceId: z.string().nullable(),
  sourceTitle: z.string().nullable(),
  sourceType: z.string().nullable(),
  /** The cultural statement. Verbatim dataset text — never AI-composed. */
  claim: z.string().min(1),
  claimLevel: ClaimLevelSchema,
  region: z.string().nullable(),
  relatedMotifs: z.array(z.string()),
  /** Source URL (citation). null when sourceId is null. */
  citation: z.string().nullable(),
});

export type CulturalEvidence = z.infer<typeof CulturalEvidenceSchema>;

/* -------------------------------------------------------------------------- */
/*  Region awareness                                                           */
/*                                                                             */
/*  Guizhou Miao silver is NOT a single style. Region info keeps the           */
/*  documented hierarchy; when the county cannot be confirmed the UI must      */
/*  show the honest fallback ("贵州苗族银饰相关视觉语言") instead of forcing   */
/*  an attribution (RULE-002).                                                  */
/* -------------------------------------------------------------------------- */

export const RegionInfoSchema = z.object({
  /** Verbatim dataset region string (e.g. "剑河/黄平"). */
  raw: z.string().nullable(),
  /** Dataset scope (SilverHeritage-GZ manifest), not a per-entity claim. */
  province: z.string().nullable(),
  /** Never present in V1 data — stays null rather than guessed. */
  prefecture: z.string().nullable(),
  county: z.array(z.string()),
  /** Documented township-level variants (革东/南寨/久仰/控拜…) and style
   *  classifications (施洞型/巴拉河型). */
  subregions: z.array(z.string()),
  /** True when no county could be extracted — render the fallback label. */
  unattributed: z.boolean(),
});

export type RegionInfo = z.infer<typeof RegionInfoSchema>;

/* -------------------------------------------------------------------------- */
/*  Match "why" — the three-layer explanation contract                         */
/*                                                                             */
/*  A. Cultural Fact          → cultural_facts (CulturalEvidence, traceable)   */
/*  B. Design Interpretation  → visual_links + preference_links (AI-side,      */
/*                             labeled)                                        */
/*  C. AI Design Suggestion   → design_suggestions (labeled, never factual)    */
/* -------------------------------------------------------------------------- */

export const MatchWhyItemSchema = z.object({
  /** i18n key under culturalMatch.why.* — engine emits key+vars only. */
  key: z.string().min(1),
  vars: z.record(z.string(), z.string()),
});

export const MatchWhySchema = z.object({
  /** Customer preference tokens (from the brief) that drove the match. */
  preference_links: z.array(z.string()),
  /** Design interpretation — aesthetic affinity, explicitly AI-side. */
  visual_links: z.array(MatchWhyItemSchema),
  /** Layer A: structured, source-traceable cultural facts. */
  cultural_facts: z.array(CulturalEvidenceSchema),
  /** Strongest claim level among the facts (never AI-raised). */
  cultural_claim_level: ClaimLevelSchema,
  /** Layer C: AI design suggestions — explicitly labeled, never facts. */
  design_suggestions: z.array(MatchWhyItemSchema),
  /** i18n key stating what the data does NOT support. */
  cultural_boundary: z.string().min(1),
});

export type MatchWhyItem = z.infer<typeof MatchWhyItemSchema>;
export type MatchWhy = z.infer<typeof MatchWhySchema>;

/* -------------------------------------------------------------------------- */
/*  Raw dataset schemas                                                        */
/* -------------------------------------------------------------------------- */

export const SourceSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  publisher: z.string().min(1),
  url: z.string().min(1),
  source_type: z.string().min(1),
  coverage: z.array(z.string()),
  accessed: z.string(),
});

export const HeritageProjectSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  region: z.string().min(1),
  designation: z.string().min(1),
  project_no: z.string(),
  batch: z.string(),
  category: z.string(),
  description: z.string().min(1),
  source_ids: z.array(z.string().min(1)).min(1),
  evidence_level: EvidenceLevelSchema,
});

export const RegionalStyleSchema = z.object({
  id: z.string().min(1),
  region: z.string().min(1),
  province: z.string(),
  features: z.array(z.string().min(1)).min(1),
  style_types: z.array(z.string()).optional(),
  local_nodes: z.array(z.string()).optional(),
  subregions: z.record(z.string(), z.string()).optional(),
  source_ids: z.array(z.string().min(1)).min(1),
  evidence_level: EvidenceLevelSchema,
});

export const HeritageItemSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  category: z.string().min(1),
  region: z.string().min(1),
  description: z.string().min(1),
  source_ids: z.array(z.string().min(1)).min(1),
  evidence_level: EvidenceLevelSchema,
});

export const MotifSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  region: z.string().min(1),
  documented_visual_subject: z.boolean(),
  /** null = official sources document the motif as a visual subject WITHOUT
   *  stating a cultural meaning. This null is load-bearing: the Guardrail
   *  forbids upgrading it into a symbolic claim. */
  documented_meaning: z.string().nullable(),
  description: z.string().min(1),
  source_ids: z.array(z.string().min(1)).min(1),
  evidence_level: EvidenceLevelSchema,
});

export const CraftSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string().min(1),
  source_ids: z.array(z.string().min(1)).min(1),
  evidence_level: EvidenceLevelSchema,
});

export const PersonSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  region: z.string().min(1),
  role: z.string().min(1),
  facts: z.array(z.string().min(1)),
  source_ids: z.array(z.string().min(1)).min(1),
  evidence_level: EvidenceLevelSchema,
});

export const CulturalRuleSchema = z.object({
  id: z.string().min(1),
  type: z.string().min(1),
  severity: z.enum(["high", "medium", "low"]),
  rule: z.string().min(1),
  rationale: z.string().optional(),
  source_ids: z.array(z.string().min(1)).min(1),
});

export type Source = z.infer<typeof SourceSchema>;
export type HeritageProject = z.infer<typeof HeritageProjectSchema>;
export type RegionalStyle = z.infer<typeof RegionalStyleSchema>;
export type HeritageItem = z.infer<typeof HeritageItemSchema>;
export type Motif = z.infer<typeof MotifSchema>;
export type Craft = z.infer<typeof CraftSchema>;
export type Person = z.infer<typeof PersonSchema>;
export type CulturalRule = z.infer<typeof CulturalRuleSchema>;

/* -------------------------------------------------------------------------- */
/*  Cultural Match Engine                                                      */
/* -------------------------------------------------------------------------- */

/** Entity kinds eligible to become a "heritage direction". */
export const MATCH_ENTITY_KINDS = [
  "motif",
  "heritage_item",
  "regional_style",
  "craft",
  "project",
] as const;

export type MatchEntityKind = (typeof MATCH_ENTITY_KINDS)[number];

/**
 * Transparent scoring model. Weights are fixed, published to the client,
 * and every component score is 0–1 before weighting. Sum = 100.
 */
export const MATCH_WEIGHTS = {
  visual_style_fit: 25,
  product_fit: 15,
  wearability_fit: 15,
  regional_fit: 20,
  keyword_fit: 10,
  evidence_confidence: 15,
} as const;

export type ScoreDimension = keyof typeof MATCH_WEIGHTS;

export type ScoreBreakdown = Record<ScoreDimension, number>;

/** How much (0–1) of a weight each dimension earned, for the UI bars. */
export type ScoreBreakdownWeighted = Record<ScoreDimension, number>;

export interface CulturalMatchResult {
  id: string;
  name: string;
  type: MatchEntityKind;
  region: string | null;
  /** 0–100, integer. Σ(weight × component). */
  match_score: number;
  score_breakdown: ScoreBreakdown;
  /** Weighted points per dimension (e.g. visual_style_fit: 21.5 / 25). */
  score_breakdown_weighted: ScoreBreakdownWeighted;
  /** Why this matched — scoring rationale in plain language. */
  matched_reasons: string[];
  /** Factual, source-backed statements. Never contains AI interpretation. */
  cultural_evidence: string[];
  /** Documented meaning, or null when sources record none. */
  cultural_meaning: string | null;
  meaning_status: "documented" | "not_documented" | "not_applicable";
  source_ids: string[];
  evidence_level: EvidenceLevel;
  /**
   * Structured region hierarchy (Stage 2 knowledge-base enhancement).
   * `unattributed: true` → the UI must render the honest fallback
   * ("贵州苗族银饰相关视觉语言") instead of forcing a county (RULE-002).
   */
  region_info: RegionInfo;
  /**
   * The three-layer "why this matched" contract: preference links (B),
   * traceable cultural facts (A) and labeled AI design suggestions (C).
   * Supersedes the flat matched_reasons narrative; that field is retained
   * for Stage-3 payload compatibility.
   */
  why: MatchWhy;
  /** Strongest claim level supported by the dataset — never AI-raised. */
  claim_level: ClaimLevel;
}

/** Guardrail outcome — see lib/heritage/guardrail.ts. */
export interface GuardrailCheck {
  rule_id: string;
  rule_type: string;
  severity: "high" | "medium" | "low";
  passed: boolean;
  message: string;
}

export interface GuardrailResult {
  passed: boolean;
  checks: GuardrailCheck[];
  /** Honest disclosures (e.g. "meaning not documented") — not failures. */
  warnings: string[];
}

/** Compact source reference for API consumers. */
export interface SourceRef {
  id: string;
  title: string;
  publisher: string;
  url: string;
}
