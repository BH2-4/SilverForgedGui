/**
 * STAGE 3 — Cultural Design Translation Engine.
 *
 * Translates (Global Design DNA + a selected Heritage Match) into a
 * structured Design Brief, keeping three layers strictly separated:
 *
 *   1. Documented Cultural Evidence — verbatim knowledge-base strings with
 *      an `origin` pointer for tamper verification (RULE-006).
 *   2. Design Interpretation       — deterministic design reasoning,
 *      always labeled "AI DESIGN INTERPRETATION", never factual.
 *   3. AI Generated Design Proposal — the brief's concrete decisions and
 *      the generation/negative prompts assembled from them.
 *
 * INPUT INTEGRITY: the client-supplied match payload is only used for its
 * `id`. Every cultural attribute (name, region, facts, sources, evidence
 * level) is re-derived server-side from the knowledge base, so a tampered
 * payload cannot inject cultural claims. Payload/KB mismatch is rejected.
 *
 * Stage 1 / Stage 2 engines are NOT modified by this module.
 */

import { getHeritageById, loadSources } from "@/lib/heritage/repository";
import { CRAFT_AESTHETICS } from "@/lib/heritage/glossary";
import type {
  Craft,
  CulturalMatchResult,
  HeritageItem,
  HeritageProject,
  MatchEntityKind,
  Motif,
  RegionalStyle,
  SourceRef,
} from "@/lib/heritage/types";
import type { GlobalDesignBrief } from "@/lib/ai/schemas";
import type {
  DesignBrief,
  DesignDirection,
  DocumentedFact,
  MotifElement,
} from "@/lib/design/schemas";
import { TIER_COMPLEXITY } from "@/lib/design/schemas";
import { buildGenerationPrompt, buildNegativePrompt } from "@/lib/design/prompt";
import { verifyDesignBrief } from "@/lib/design/verification";

/* -------------------------------------------------------------------------- */
/*  Errors                                                                     */
/* -------------------------------------------------------------------------- */

export type TranslationErrorCode =
  | "unknown_heritage_entity"
  | "inconsistent_match_payload";

export class TranslationInputError extends Error {
  readonly code: TranslationErrorCode;
  constructor(code: TranslationErrorCode, message: string) {
    super(message);
    this.name = "TranslationInputError";
    this.code = code;
  }
}

/* -------------------------------------------------------------------------- */
/*  Input sanitization                                                         */
/* -------------------------------------------------------------------------- */

/**
 * Same verb list as the guardrails (keep in sync). A token carrying symbolic
 * language is an unsupported claim from the user, never design input.
 */
const SYMBOLIC_TOKEN =
  /象征|寓意|意味着|代表(?!性)|\bsymboliz\w*|\bsymbolic\b|\bmeaning\b|\bstands?\s+for\b|\brepresents?\b/i;

function sanitizeTokens(tokens: string[]): {
  kept: string[];
  discarded: string[];
} {
  const kept: string[] = [];
  const discarded: string[] = [];
  for (const token of tokens) {
    if (SYMBOLIC_TOKEN.test(token)) discarded.push(token);
    else kept.push(token);
  }
  return { kept, discarded };
}

/* -------------------------------------------------------------------------- */
/*  Knowledge-base ground (server-derived truth for the selected entity)      */
/* -------------------------------------------------------------------------- */

export interface HeritageGround {
  kind: MatchEntityKind;
  id: string;
  /** Display name the Stage 2 engine emits for this entity. */
  displayName: string;
  region: string | null;
  sourceIds: string[];
  evidenceLevel: DocumentedFact["evidence_level"];
  meaningStatus: "documented" | "not_documented" | "not_applicable";
  facts: DocumentedFact[];
  motifElement: MotifElement | null;
  interpretation: string[];
}

function groundMotif(motif: Motif): HeritageGround {
  const facts: DocumentedFact[] = [
    {
      fact: motif.description,
      source_ids: motif.source_ids,
      region: motif.region,
      evidence_level: motif.evidence_level,
      origin: { entity_id: motif.id, field: "description" },
    },
  ];
  if (motif.documented_meaning) {
    facts.push({
      fact: motif.documented_meaning,
      source_ids: motif.source_ids,
      region: motif.region,
      evidence_level: motif.evidence_level,
      origin: { entity_id: motif.id, field: "documented_meaning" },
    });
  }
  const meaningStatus = motif.documented_meaning ? "documented" : "not_documented";
  return {
    kind: "motif",
    id: motif.id,
    displayName: motif.name,
    region: motif.region,
    sourceIds: motif.source_ids,
    evidenceLevel: motif.evidence_level,
    meaningStatus,
    facts,
    motifElement: {
      name: motif.name,
      region: motif.region,
      presented_as: motif.documented_meaning ? "documented-meaning" : "visual-subject",
      documented_meaning: motif.documented_meaning,
      source_ids: motif.source_ids,
      evidence_level: motif.evidence_level,
      origin_entity_id: motif.id,
    },
    interpretation: [],
  };
}

function groundHeritageItem(item: HeritageItem): HeritageGround {
  return {
    kind: "heritage_item",
    id: item.id,
    displayName: item.name,
    region: item.region,
    sourceIds: item.source_ids,
    evidenceLevel: item.evidence_level,
    meaningStatus: "not_applicable",
    facts: [
      {
        fact: item.description,
        source_ids: item.source_ids,
        region: item.region,
        evidence_level: item.evidence_level,
        origin: { entity_id: item.id, field: "description" },
      },
    ],
    motifElement: null,
    interpretation: [],
  };
}

function groundRegionalStyle(style: RegionalStyle): HeritageGround {
  return {
    kind: "regional_style",
    id: style.id,
    displayName: `${style.region}银饰风格`,
    region: style.region,
    sourceIds: style.source_ids,
    evidenceLevel: style.evidence_level,
    meaningStatus: "not_applicable",
    facts: [
      {
        fact: style.features.join("、"),
        source_ids: style.source_ids,
        region: style.region,
        evidence_level: style.evidence_level,
        origin: { entity_id: style.id, field: "features" },
      },
    ],
    motifElement: null,
    interpretation: [],
  };
}

function groundCraft(craft: Craft): HeritageGround {
  return {
    kind: "craft",
    id: craft.id,
    displayName: craft.name,
    region: null,
    sourceIds: craft.source_ids,
    evidenceLevel: craft.evidence_level,
    meaningStatus: "not_applicable",
    facts: [
      {
        fact: craft.description,
        source_ids: craft.source_ids,
        region: null,
        evidence_level: craft.evidence_level,
        origin: { entity_id: craft.id, field: "description" },
      },
    ],
    motifElement: null,
    interpretation: [],
  };
}

function groundProject(project: HeritageProject): HeritageGround {
  return {
    kind: "project",
    id: project.id,
    displayName: project.name,
    region: project.region,
    sourceIds: project.source_ids,
    evidenceLevel: project.evidence_level,
    meaningStatus: "not_applicable",
    facts: [
      {
        fact: project.description,
        source_ids: project.source_ids,
        region: project.region,
        evidence_level: project.evidence_level,
        origin: { entity_id: project.id, field: "description" },
      },
    ],
    motifElement: null,
    interpretation: [],
  };
}

export function groundEntityById(id: string): HeritageGround | null {
  const entity = getHeritageById(id);
  if (!entity) return null;
  const data = entity.data;
  // getHeritageById's declared return type is a non-discriminated union, so
  // we narrow by each entity's unique runtime shape instead of `kind`.
  if ("documented_visual_subject" in data) return groundMotif(data);
  if ("designation" in data) return groundProject(data);
  if ("province" in data) return groundRegionalStyle(data);
  if ("category" in data) return groundHeritageItem(data);
  if ("description" in data) return groundCraft(data);
  return null; // person — not a match entity
}

/* -------------------------------------------------------------------------- */
/*  Deterministic design vocabulary                                            */
/* -------------------------------------------------------------------------- */

const MOTIF_EN: Record<string, string> = {
  花草: "Flora",
  鸟雀: "Birdsong",
  花鸟: "Bird & Flora",
  昆虫: "Insect",
  龙: "Dragon",
  虎: "Tiger",
  龙鱼: "Dragonfish",
  蝴蝶: "Butterfly",
};

const ITEM_EN: Record<string, string> = {
  项圈: "Collar",
  银项圈: "Collar",
  手镯: "Cuff",
  耳环: "Drop",
  胸锁: "Lock",
  银角: "Horn",
  银凤冠: "Phoenix Crown",
  银梳: "Comb",
  银簪: "Hairpin",
  银雀: "Silver Bird",
  银腰带: "Waist Chain",
  背扇: "Carrier",
  响铃板: "Rattle",
  银衣: "Silver Garment",
  银冠: "Crown",
  银花帽: "Flower Cap",
  银头围: "Headband",
  银帽: "Cap",
  银头花: "Head Flower",
  银羽: "Feather",
  银项链: "Chain",
};

const CRAFT_EN: Record<string, string> = {
  拉丝: "Wire-Drawn",
  "錾花/錾刻": "Chased",
  "捶打/锤錾": "Hammered",
  压花: "Stamped",
  "编结/编花": "Woven",
  "焊接/焊花": "Soldered",
  "熔炼/铸炼": "Forged",
  "洗涤/洗亮": "Polished",
};

const REGION_EN: Record<string, string> = {
  雷山: "Leishan",
  台江: "Taijiang",
  剑河: "Jianhe",
  黄平: "Huangping",
};

const FORM_NOUNS: Record<string, string> = {
  necklace: "Necklace",
  earrings: "Earrings",
  bracelet: "Bangle",
  cuff: "Cuff",
  ring: "Ring",
  pendant: "Pendant",
  brooch: "Brooch",
  hairpiece: "Hairpin",
  anklet: "Anklet",
  unknown: "Piece",
};

const FORM_LANGUAGE_BY_PRODUCT: Record<string, string[]> = {
  necklace: [
    "a focal pendant suspended on a fine-gauge silver chain",
    "fluid drape that layers with daily wear",
  ],
  earrings: ["paired drop forms with balanced visual weight", "secure everyday fastening"],
  bracelet: ["a slim silver band with one focal surface", "smooth interior for all-day comfort"],
  cuff: ["an open cuff silhouette with clean terminals", "sculptural yet wearable volume"],
  ring: ["a compact band form with one focal plane", "low-profile setting for daily wear"],
  pendant: ["a compact pendant form on an adjustable silver cord", "one clear focal element"],
  brooch: ["a compact brooch form with a secure clasp", "a single readable motif plane"],
  hairpiece: ["a refined silver hairpin or comb form", "minimal structural decoration"],
  anklet: ["a fine silver chain with a small focal charm", "light, secure closure"],
  unknown: ["a refined silver form with one clear focal element"],
};

const SIZE_TEXT: Record<string, string> = {
  small: "Small — compact scale suited to layering",
  medium: "Medium — balanced everyday scale",
  large: "Large — statement scale",
};

const WEIGHT_TEXT: Record<string, string> = {
  light: "Light — minimal silver mass for all-day wear",
  medium: "Medium — substantial but balanced",
  heavy: "Heavy — deliberate, weight-forward presence",
};

const WEARABILITY_TEXT: Record<string, string> = {
  high: "High — engineered for continuous daily wear",
  medium: "Medium — comfortable for extended wear",
  low: "Low — occasional or ceremonial wear",
};

const COMPLEXITY_TEXT: Record<string, string> = {
  low: "Low — restrained ornament, one focal element",
  medium: "Medium — balanced detail density",
  high: "High — layered, richly worked surfaces",
};

const VISIBILITY_TEXT: Record<string, string> = {
  subtle: "Subtle — cultural presence readable at close range",
  balanced: "Balanced — clearly readable at conversational distance",
  strong: "Strong — deliberately prominent",
};

const FINISH_BY_COMPLEXITY: Record<string, string> = {
  low: "high-polish smooth planes",
  medium: "satin matte with polished edges",
  high: "textured relief with polished highlights",
};

const PALETTE_BY_COMPLEXITY: Record<string, string[]> = {
  low: ["silver-white", "mirror highlights"],
  medium: ["soft silver-grey", "satin sheen"],
  high: ["antiqued silver", "light-catching relief"],
};

const MOTIF_TREATMENT: Record<string, string> = {
  low: "a single restrained line element",
  medium: "a balanced relief with selective detail",
  high: "layered sculptural relief with dimensional depth",
};

export const EVIDENCE_WEIGHT: Record<string, number> = {
  official: 1,
  interview: 0.75,
  museum: 0.85,
  academic: 0.85,
  inference: 0.3,
};

/* -------------------------------------------------------------------------- */
/*  Engine                                                                     */
/* -------------------------------------------------------------------------- */

export interface TranslateDesignInput {
  designBrief: GlobalDesignBrief;
  /**
   * The chosen design direction. Always server-generated
   * (lib/design/directions.ts) — the client only supplies its slot id, so
   * no client-side direction payload is ever trusted here.
   */
  direction: DesignDirection;
}

export interface TranslateDesignOutput {
  designBrief: DesignBrief;
  verification: ReturnType<typeof verifyDesignBrief>;
}

export function translateDesign(input: TranslateDesignInput): TranslateDesignOutput {
  const dna = input.designBrief;

  /* 1 — Sanitize DNA tokens: unsupported symbolic claims never enter design. */
  const style = sanitizeTokens(dna.style);
  const keywords = sanitizeTokens(dna.design_keywords);
  const emotion = sanitizeTokens(dna.emotion);
  const discarded = [...style.discarded, ...keywords.discarded, ...emotion.discarded];
  const safeStyle = style.kept.length > 0 ? style.kept : ["contemporary"];

  /* 2 — Ground the chosen direction's heritage entity in server-side truth.
     The direction comes from the server-side directions engine; its origin
     id is re-derived from the KB here, so the brief never trusts any
     client-supplied cultural attribute. */
  let ground: HeritageGround | null = null;
  if (input.direction.origin_match_id) {
    ground = groundEntityById(input.direction.origin_match_id);
    if (!ground) {
      throw new TranslationInputError(
        "unknown_heritage_entity",
        `Direction origin "${input.direction.origin_match_id}" does not exist in the knowledge base.`,
      );
    }
  }

  /* 3 — Shared spec derivations. The chosen direction's tier overrides the
     DNA complexity/complexity-linked choices: the customer explicitly picked
     this direction, so its design language leads. */
  const complexity = TIER_COMPLEXITY[input.direction.tier];
  const sizePreference = input.direction.recommended_scale;
  const formLanguage = [
    ...(sizePreference === "small"
      ? ["compact proportions"]
      : sizePreference === "large"
        ? ["generous proportions"]
        : []),
    ...(complexity === "low"
      ? ["clean unbroken silhouette"]
      : complexity === "high"
        ? ["layered structural silhouette"]
        : []),
    ...(FORM_LANGUAGE_BY_PRODUCT[dna.product_type] ?? FORM_LANGUAGE_BY_PRODUCT.unknown),
  ];

  const finish = FINISH_BY_COMPLEXITY[complexity];
  const palette = PALETTE_BY_COMPLEXITY[complexity];
  const motifElement = ground?.motifElement ?? null;
  const treatment = MOTIF_TREATMENT[complexity];

  /* 4 — Design interpretation (Layer 2 — labeled reasoning, never fact). */
  const interpretation: string[] = [];
  const baseRegion = ground?.region ?? null;
  const regionNote = baseRegion ? ` from the documented ${baseRegion} tradition` : "";

  interpretation.push(
    `A ${dna.size_preference}-scale ${dna.product_type} in silver${regionNote ? `, translating the selected heritage direction${regionNote} into a contemporary form` : " with no cultural reference"}.`,
  );

  if (ground?.kind === "motif" && motifElement) {
    interpretation.push(
      `Simplify and modernize the documented "${motifElement.name}" visual element — reduce it to ${treatment} while keeping its recognizable character.`,
    );
    interpretation.push(
      `Cultural presence is tuned to "${dna.cultural_visibility}" through scale and relief depth rather than added ornament.`,
    );
    if (motifElement.presented_as === "visual-subject") {
      interpretation.push(
        `The motif functions as formal vocabulary only — the piece asserts no symbolic content beyond what official sources document.`,
      );
    }
  } else if (ground?.kind === "heritage_item") {
    interpretation.push(
      `Modernize the documented ${ground.displayName} form — retain its structural essence while translating it to a contemporary ${dna.product_type} at ${complexity} complexity.`,
    );
    interpretation.push(
      `Ornamental load follows the brief's ${complexity} complexity, not the ceremonial density of the original form.`,
    );
  } else if (ground?.kind === "craft") {
    const gloss = CRAFT_AESTHETICS[ground.displayName]?.gloss ?? "a documented forging technique";
    interpretation.push(
      `Let the documented ${ground.displayName} technique define the surface logic — ${gloss} — applied to a contemporary ${dna.product_type}.`,
    );
  } else if (ground?.kind === "regional_style") {
    interpretation.push(
      `Filter the region's documented silver vocabulary through the brief's ${dna.cultural_visibility} cultural-visibility target, borrowing no element from outside the documented regional record.`,
    );
  } else if (ground?.kind === "project") {
    interpretation.push(
      `The heritage-project record anchors provenance${regionNote}; the form itself follows the DNA's ${safeStyle.slice(0, 3).join(" / ")} direction.`,
    );
  } else {
    interpretation.push(
      `No cultural direction is applied — the design derives entirely from the DNA's formal preferences and must not present itself as culturally referenced.`,
    );
  }

  interpretation.push(
    `Finish strategy — ${finish} — chosen so the cultural reference stays "${dna.cultural_visibility}" at ${complexity} complexity.`,
  );

  /* 5 — Cultural constraints (hard boundaries for design and copy). */
  const constraints: string[] = [];
  if (motifElement && motifElement.presented_as === "visual-subject") {
    constraints.push(
      `"${motifElement.name}" is presented as a documented visual element only. Design, naming, and marketing must not attach symbolic or cultural meaning to it.`,
    );
  }
  if (motifElement && motifElement.presented_as === "documented-meaning") {
    constraints.push(
      `The only permissible symbolic reading of "${motifElement.name}" is the officially documented one; no further meaning may be added.`,
    );
  }
  if (ground?.region) {
    constraints.push(
      `Regional attribution is limited to ${ground.region}; the design must not be described as belonging to any other tradition.`,
    );
  }
  if (!ground) {
    constraints.push(
      `No heritage direction was selected: the design must not claim any cultural reference, and copy must not cite Miao or Guizhou tradition as a design source.`,
    );
  }
  if (discarded.length > 0) {
    constraints.push(
      `User input contained symbolic claims (${discarded.join(", ")}) that no official source documents; they were discarded before design translation and must not resurface in design or copy.`,
    );
  }

  /* 6 — Confidence: DNA confidence blended with evidence quality. */
  const evidenceScore = ground
    ? (EVIDENCE_WEIGHT[ground.evidenceLevel] ?? 0.5) * 0.6 +
    (ground.sourceIds.length >= 2 ? 0.4 : ground.sourceIds.length === 1 ? 0.28 : 0)
    : 0;
  const confidence = ground
    ? Math.round((dna.confidence * 0.5 + evidenceScore * 0.5) * 100) / 100
    : Math.round(dna.confidence * 0.55 * 100) / 100;

  /* 7 — Evidence sources actually cited by this brief. */
  const citedIds = ground ? ground.sourceIds : [];
  const sourceRefs: SourceRef[] = citedIds
    .map((id) => loadSources().find((s) => s.id === id))
    .filter((s): s is NonNullable<typeof s> => Boolean(s))
    .map(({ id, title, publisher, url }) => ({ id, title, publisher, url }));

  /* 8 — Title (deterministic, from structured data only). */
  const formNoun = FORM_NOUNS[dna.product_type] ?? "Piece";
  let coreWord: string;
  if (motifElement) {
    coreWord = MOTIF_EN[motifElement.name] ?? motifElement.name;
  } else if (ground?.kind === "heritage_item") {
    coreWord = ITEM_EN[ground.displayName] ?? "Silver";
  } else if (ground?.kind === "craft") {
    coreWord = CRAFT_EN[ground.displayName] ?? "Forged";
  } else if (ground?.region) {
    const regionKey = Object.keys(REGION_EN).find((r) => ground.region?.includes(r));
    coreWord = regionKey ? REGION_EN[regionKey] : "Heritage";
  } else {
    coreWord = complexity === "high" ? "Sculptural" : "Minimal";
  }
  const designTitle = ground
    ? `${coreWord} ${formNoun} · Guizhou Silver Study`
    : `${coreWord} ${formNoun} · Silver Study`;

  /* 9 — Assemble the brief; prompts are derived from it alone. */
  const draft: DesignBrief = {
    design_title: designTitle,
    market: dna.market,
    consumer_profile: dna.consumer_profile,
    product_type: dna.product_type,
    style_direction: safeStyle,
    form_language: formLanguage,
    motif_elements: motifElement ? [motifElement] : [],
    material: {
      primary: "silver",
      finish,
      notes: ground
        ? "Material scope follows the documented Miao silver-forging tradition (see cited sources)."
        : null,
    },
    color: {
      palette,
      rationale: `Palette follows the ${complexity}-complexity finish so the piece reads as one coherent silver object.`,
    },
    size: SIZE_TEXT[sizePreference] ?? "Medium — balanced everyday scale",
    weight: WEIGHT_TEXT[dna.weight_preference] ?? "Medium — substantial but balanced",
    wearability: WEARABILITY_TEXT[dna.wearability] ?? "Medium — comfortable for extended wear",
    complexity: COMPLEXITY_TEXT[complexity] ?? "Medium — balanced detail density",
    cultural_visibility:
      VISIBILITY_TEXT[dna.cultural_visibility] ??
      "Balanced — clearly readable at conversational distance",
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
    documented_cultural_facts: ground ? ground.facts : [],
    design_interpretation: {
      notice:
        "AI DESIGN INTERPRETATION — system design reasoning, not documented cultural fact.",
      statements: interpretation,
    },
    avoid_elements: dna.avoid,
    cultural_constraints: constraints,
    evidence_sources: sourceRefs,
    confidence,
    generation_prompt: "",
    negative_prompt: "",
    discarded_symbolic_inputs: discarded,

    /* --- Stage 3 direction extension --- */
    selected_direction: input.direction,
    craft: {
      primary: input.direction.crafts[0]?.name ?? "錾花/錾刻",
      alternatives: input.direction.crafts.slice(1).map((c) => c.name),
    },
    wearing_scene: input.direction.wearing_scenes[0] ?? "everyday",
    emotional_intent: input.direction.emotional_expression,
    customer_reason: input.direction.why_suitable,
    uncertainties: input.direction.uncertainties,
  };

  const designBrief: DesignBrief = {
    ...draft,
    generation_prompt: buildGenerationPrompt(draft),
    negative_prompt: buildNegativePrompt(draft),
  };

  return { designBrief, verification: verifyDesignBrief(designBrief) };
}
