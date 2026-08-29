/**
 * STAGE 3 — Verification (Guardrail continuation).
 *
 * The Stage 2 guardrail polices the MATCH layer; this module polices the
 * DESIGN BRIEF layer with the same rule ids so failures stay comparable
 * across the pipeline:
 *
 *   RULE-001 source_required        — every documented fact cites sources
 *                                      that exist in sources.json.
 *   RULE-002 regional_attribution   — facts and interpretation only ever
 *                                      name the heritage entity's own region.
 *   RULE-003 motif_meaning          — interpretation/prompt never claims
 *                                      symbolic meaning that is not documented.
 *   RULE-004 evidence_level         — every traceable field carries its
 *                                      evidence level.
 *   RULE-005 design_transformation  — interpretation is structurally marked
 *                                      and never contains fact strings.
 *   RULE-006 no_unsupported_claim   — every fact string is byte-identical to
 *                                      its knowledge-base field of origin.
 *
 * Facts are verified through their `origin` pointer: the verifier recomputes
 * the authoritative string from the dataset and compares, so the brief cannot
 * carry an edited or invented "fact" even if it looks plausible.
 */

import { getHeritageById, loadSources } from "@/lib/heritage/repository";
import { KNOWN_REGIONS } from "@/lib/heritage/glossary";
import { claimLevelFromEvidence } from "@/lib/heritage/evidence";
import type { GuardrailResult } from "@/lib/heritage/types";
import type {
  DesignBrief,
  DesignDirection,
  DesignInterpretation,
  DesignProposal,
  DocumentedFact,
  HeritageReference,
  MotifElement,
} from "@/lib/design/schemas";

/**
 * The cultural layer every Stage 3 output (brief AND direction) carries.
 * Both verified kinds share this shape, so the same rules apply whether
 * the customer is looking at a direction card or the final brief.
 */
interface CulturalLayer {
  documented_cultural_facts: DocumentedFact[];
  heritage_reference: HeritageReference | null;
  motif_elements: MotifElement[];
  design_interpretation: DesignInterpretation;
  generation_prompt: string;
  discarded_symbolic_inputs: string[];
}

/**
 * Verbs that turn a visual subject into a cultural claim.
 * KEEP IN SYNC with Stage 2 (lib/heritage/guardrail.ts) MEANING_VERBS.
 * `代表(?!性)` — "代表性" is institutional usage ("representative items"),
 * not a symbolic claim; same for `\brepresents?\b` vs "representative".
 */
const MEANING_VERBS =
  /象征|寓意|意味着|代表(?!性)|\bsymboliz\w*|\bstands?\s+for\b|\brepresents?\b/i;

/** Same rule types and severities as Stage 2 — failures read uniformly. */
const RULE_META: Record<
  string,
  { type: string; severity: "high" | "medium" | "low" }
> = {
  "RULE-001": { type: "source_required", severity: "high" },
  "RULE-002": { type: "regional_attribution", severity: "high" },
  "RULE-003": { type: "motif_meaning", severity: "high" },
  "RULE-004": { type: "evidence_level", severity: "medium" },
  "RULE-005": { type: "design_transformation", severity: "medium" },
  "RULE-006": { type: "no_unsupported_claim", severity: "high" },
};

function check(ruleId: string, passed: boolean, message: string) {
  const meta = RULE_META[ruleId];
  return {
    rule_id: ruleId,
    rule_type: meta.type,
    severity: meta.severity,
    passed,
    message,
  };
}

type EntityData = NonNullable<ReturnType<typeof getHeritageById>>["data"];

/** Recompute the authoritative string a fact must equal, per its origin. */
function authoritativeString(
  data: EntityData,
  field: "description" | "documented_meaning" | "features",
): string | null {
  switch (field) {
    case "description":
      return "description" in data ? data.description : null;
    case "documented_meaning":
      return "documented_meaning" in data ? data.documented_meaning : null;
    case "features":
      return "features" in data ? data.features.join("、") : null;
  }
}

/** Regions named in a text that the entity's own region does not cover. */
function findUnattributedRegions(
  text: string,
  entityRegion: string | null,
): string[] {
  return KNOWN_REGIONS.filter(
    (region) => text.includes(region) && !(entityRegion ?? "").includes(region),
  );
}

export function verifyDesignBrief(brief: DesignBrief): GuardrailResult {
  return verifyCulturalLayer(brief);
}

/**
 * RULE-000-ex (extension): the direction layer is also policed, so a bad
 * direction is withheld before it can ever reach the customer (see route).
 */
export function verifyDesignDirection(direction: DesignDirection): GuardrailResult {
  return verifyCulturalLayer({
    documented_cultural_facts: direction.documented_cultural_facts,
    heritage_reference: direction.heritage_reference,
    motif_elements: direction.motif_elements,
    design_interpretation: direction.design_interpretation,
    generation_prompt: "",
    discarded_symbolic_inputs: [],
  });
}

function verifyCulturalLayer(brief: CulturalLayer): GuardrailResult {
  const checks: GuardrailResult["checks"] = [];
  const warnings: string[] = [];

  const sources = loadSources();
  const sourceIds = new Set(sources.map((s) => s.id));

  /* ----------------------------- RULE-001 ----------------------------- */
  const missingSources = new Set<string>();
  for (const fact of brief.documented_cultural_facts) {
    for (const id of fact.source_ids) {
      if (!sourceIds.has(id)) missingSources.add(id);
    }
  }
  for (const ref of [brief.heritage_reference, ...brief.motif_elements]) {
    if (!ref) continue;
    for (const id of ref.source_ids) {
      if (!sourceIds.has(id)) missingSources.add(id);
    }
  }
  checks.push(
    check(
      "RULE-001",
      missingSources.size === 0,
      missingSources.size === 0
        ? "All documented facts and references cite sources present in the knowledge base."
        : `Facts cite unknown source ids: ${[...missingSources].join(", ")}.`,
    ),
  );

  /* ----------------------------- RULE-002 ----------------------------- */
  const ownRegion = brief.heritage_reference?.region ?? null;
  const regionOffenders: string[] = [];
  for (const fact of brief.documented_cultural_facts) {
    const entity = getHeritageById(fact.origin.entity_id);
    const entityRegion = entity
      ? ("region" in entity.data ? entity.data.region : null)
      : null;
    const foreign = findUnattributedRegions(fact.region ?? "", entityRegion);
    if (foreign.length > 0) {
      regionOffenders.push(`fact "${fact.fact.slice(0, 24)}" → ${foreign.join("/")}`);
    }
  }
  const interpretationText = brief.design_interpretation.statements.join(" ");
  const foreignInInterpretation = findUnattributedRegions(
    interpretationText,
    ownRegion,
  );
  if (foreignInInterpretation.length > 0) {
    regionOffenders.push(
      `interpretation → ${foreignInInterpretation.join("/")}`,
    );
  }
  checks.push(
    check(
      "RULE-002",
      regionOffenders.length === 0,
      regionOffenders.length === 0
        ? "Regional attribution is confined to the documented region of the selected heritage entity."
        : `Regional attribution drift detected: ${regionOffenders.join("; ")}.`,
    ),
  );

  /* ----------------------------- RULE-003 ----------------------------- */
  const meaningDocumented =
    brief.heritage_reference?.meaning_status === "documented";
  const claimTexts = [
    ...brief.design_interpretation.statements,
    ...brief.motif_elements
      .filter((m) => m.presented_as === "visual-subject")
      .map((m) => `the motif ${m.name} is presented as a visual subject`),
  ];
  if (!meaningDocumented) {
    claimTexts.push(brief.generation_prompt);
  }
  const claimOffenders = claimTexts.filter((t) => MEANING_VERBS.test(t));
  checks.push(
    check(
      "RULE-003",
      claimOffenders.length === 0,
      claimOffenders.length === 0
        ? "No symbolic-meaning language appears outside documented facts."
        : `Symbolic claims detected in non-documented text: ${claimOffenders.join(" | ")}.`,
    ),
  );

  /* ----------------------------- RULE-004 ----------------------------- */
  const levelOffenders: string[] = [];
  const traceable: Array<{
    level: DocumentedFact["evidence_level"] | undefined;
    label: string;
    expected: string | undefined;
  }> = [
      ...brief.documented_cultural_facts.map((f) => ({
        level: f.evidence_level,
        label: `fact "${f.fact.slice(0, 24)}"`,
        expected: getHeritageById(f.origin.entity_id)?.data.evidence_level,
      })),
      ...(brief.heritage_reference
        ? [
          {
            level: brief.heritage_reference.evidence_level,
            label: "heritage reference",
            expected: getHeritageById(brief.heritage_reference.match_id)?.data
              .evidence_level,
          },
        ]
        : []),
      ...brief.motif_elements.map((m) => ({
        level: m.evidence_level,
        label: `motif ${m.name}`,
        expected: getHeritageById(m.origin_entity_id)?.data.evidence_level,
      })),
    ];
  for (const item of traceable) {
    if (!item.level || item.level !== item.expected) {
      levelOffenders.push(item.label);
    }
  }
  checks.push(
    check(
      "RULE-004",
      levelOffenders.length === 0,
      levelOffenders.length === 0
        ? "Every traceable field carries the knowledge-base evidence level."
        : `Evidence level missing or inconsistent for: ${levelOffenders.join("; ")}.`,
    ),
  );

  /* ----------------------------- RULE-005 ----------------------------- */
  const separationOk =
    brief.design_interpretation.notice.startsWith("AI DESIGN INTERPRETATION") &&
    !brief.documented_cultural_facts.some((fact) =>
      brief.design_interpretation.statements.some((s) => s.includes(fact.fact)),
    );
  checks.push(
    check(
      "RULE-005",
      separationOk,
      separationOk
        ? "Design interpretation is explicitly labeled and fact-free."
        : "Interpretation layer is missing its notice or contains verbatim fact strings.",
    ),
  );

  /* ----------------------------- RULE-006 ----------------------------- */
  const unsupported: string[] = [];
  for (const fact of brief.documented_cultural_facts) {
    const entity = getHeritageById(fact.origin.entity_id);
    const expected = entity
      ? authoritativeString(entity.data, fact.origin.field)
      : null;
    if (expected === null || expected !== fact.fact) {
      unsupported.push(fact.origin.entity_id);
    }
  }
  checks.push(
    check(
      "RULE-006",
      unsupported.length === 0,
      unsupported.length === 0
        ? "Every documented fact is byte-identical to its knowledge-base field of origin."
        : `Facts not matching the knowledge base: ${[...new Set(unsupported)].join(", ")}.`,
    ),
  );

  /* ------------------------------ warnings ----------------------------- */
  if (brief.discarded_symbolic_inputs.length > 0) {
    warnings.push(
      `Input tokens carrying unsupported symbolic claims were discarded and never reached the design: ${brief.discarded_symbolic_inputs.join(", ")}.`,
    );
  }
  if (!brief.heritage_reference) {
    warnings.push(
      "No heritage direction was selected — the brief makes no cultural claims.",
    );
  }
  const softFailing = checks.filter((c) => !c.passed && c.severity !== "high");
  for (const failed of softFailing) {
    warnings.push(`${failed.rule_id}: ${failed.message}`);
  }

  return {
    passed: checks.every((c) => c.passed),
    checks,
    warnings,
  };
}

/* -------------------------------------------------------------------------- */
/*  STAGE 4 — proposal verification                                            */
/* -------------------------------------------------------------------------- */

/**
 * RULE-007 claim_level_integrity — the proposal's trust core (SECTION 07):
 *   · every cultural source card's claim_level is DERIVED from its evidence
 *     level + source count (claimLevelFromEvidence), never asserted freely;
 *   · `visual_reference` classification is exactly the case "motif whose
 *     symbolic meaning is not documented" — anything else is
 *     `official_record`;
 *   · fabricating a source id on a card is a failure.
 * Same rule id as the Stage 2 matcher guardrail so failures read uniformly.
 */
RULE_META["RULE-007"] = { type: "claim_level_integrity", severity: "high" };

/**
 * Verifies the customer-facing Design Proposal (Stage 4). The proposal
 * re-exports the (already verified) brief content, so this pass polices the
 * NEW surfaces only: the cultural source cards, the craft citations, the
 * motif classification and the re-exported interpretation layer.
 */
export function verifyDesignProposal(proposal: DesignProposal): GuardrailResult {
  const checks: GuardrailResult["checks"] = [];
  const warnings: string[] = [];

  const sources = loadSources();
  const sourceIds = new Set(sources.map((s) => s.id));
  const cards = proposal.cultural_sources;

  /* ----------------------------- RULE-001 ----------------------------- */
  const missingSources = new Set<string>();
  for (const card of cards) {
    for (const fact of card.facts) {
      for (const id of fact.source_ids) {
        if (!sourceIds.has(id)) missingSources.add(id);
      }
    }
    for (const ref of card.source_refs) {
      if (!sourceIds.has(ref.id)) missingSources.add(ref.id);
    }
  }
  for (const craft of [proposal.craft.primary, ...proposal.craft.alternatives]) {
    for (const id of craft.source_ids) {
      if (!sourceIds.has(id)) missingSources.add(id);
    }
  }
  checks.push(
    check(
      "RULE-001",
      missingSources.size === 0,
      missingSources.size === 0
        ? "Every cultural source card and craft citation references sources present in the knowledge base."
        : `Proposal cites unknown source ids: ${[...missingSources].join(", ")}.`,
    ),
  );

  /* ----------------------------- RULE-002 ----------------------------- */
  const regionOffenders: string[] = [];
  for (const card of cards) {
    const entity = getHeritageById(card.entity_id);
    const entityRegion = entity
      ? "region" in entity.data
        ? entity.data.region
        : null
      : null;
    for (const fact of card.facts) {
      const foreign = findUnattributedRegions(fact.region ?? "", entityRegion);
      if (foreign.length > 0) {
        regionOffenders.push(
          `${card.entity_id} fact "${fact.fact.slice(0, 24)}" → ${foreign.join("/")}`,
        );
      }
    }
    if (card.region && entity && !(entityRegion ?? "").includes(card.region)) {
      regionOffenders.push(`${card.entity_id} card region drift`);
    }
  }
  checks.push(
    check(
      "RULE-002",
      regionOffenders.length === 0,
      regionOffenders.length === 0
        ? "All proposal facts and source cards stay within the documented region of their entity."
        : `Regional attribution drift detected: ${regionOffenders.join("; ")}.`,
    ),
  );

  /* ----------------------------- RULE-003 ----------------------------- */
  const motifCard = cards.find((c) => c.entity_kind === "motif");
  const motif = proposal.motif.primary;
  const motifConsistency =
    (motif === null && motifCard === undefined) ||
    (motif !== null && motifCard !== undefined && motifCard.entity_id === motif.origin_entity_id);
  const meaningOk =
    motif === null ||
    motif.documented_meaning === null ||
    motif.presented_as === "documented-meaning";
  const claimOffenders: string[] = [];
  if (!motifConsistency) {
    claimOffenders.push("motif element and source cards disagree");
  }
  if (!meaningOk) {
    claimOffenders.push(`motif ${motif?.name} presents a meaning while marked visual-subject`);
  }
  if (
    motifCard &&
    motifCard.meaning_status === "not_documented" &&
    motifCard.classification !== "visual_reference"
  ) {
    claimOffenders.push(`${motifCard.entity_id} is visual-only but not classified visual_reference`);
  }
  for (const statement of proposal.design_interpretation.statements) {
    if (MEANING_VERBS.test(statement)) {
      claimOffenders.push(`interpretation claims meaning: "${statement.slice(0, 32)}"`);
    }
  }
  checks.push(
    check(
      "RULE-003",
      claimOffenders.length === 0,
      claimOffenders.length === 0
        ? "No symbolic meaning is claimed anywhere outside documented facts."
        : `Symbolic claims detected: ${claimOffenders.join(" | ")}.`,
    ),
  );

  /* ----------------------------- RULE-004 ----------------------------- */
  const levelOffenders: string[] = [];
  for (const card of cards) {
    const expected = getHeritageById(card.entity_id)?.data.evidence_level;
    if (!card.evidence_level || card.evidence_level !== expected) {
      levelOffenders.push(`source card ${card.entity_id}`);
    }
  }
  for (const craft of [proposal.craft.primary, ...proposal.craft.alternatives]) {
    const expected = getHeritageById(craft.id)?.data.evidence_level;
    if (!craft.evidence_level || craft.evidence_level !== expected) {
      levelOffenders.push(`craft ${craft.id}`);
    }
  }
  if (motif) {
    const expected = getHeritageById(motif.origin_entity_id)?.data.evidence_level;
    if (!motif.evidence_level || motif.evidence_level !== expected) {
      levelOffenders.push(`motif ${motif.name}`);
    }
  }
  checks.push(
    check(
      "RULE-004",
      levelOffenders.length === 0,
      levelOffenders.length === 0
        ? "Every source card and craft citation carries the knowledge-base evidence level."
        : `Evidence level missing or inconsistent for: ${levelOffenders.join("; ")}.`,
    ),
  );

  /* ----------------------------- RULE-005 ----------------------------- */
  const allFactStrings = cards.flatMap((c) => c.facts.map((f) => f.fact));
  const separationOk =
    proposal.design_interpretation.notice.startsWith("AI DESIGN INTERPRETATION") &&
    !allFactStrings.some((fact) =>
      proposal.design_interpretation.statements.some((s) => s.includes(fact)),
    );
  checks.push(
    check(
      "RULE-005",
      separationOk,
      separationOk
        ? "Design interpretation is explicitly labeled and fact-free."
        : "Interpretation layer is missing its notice or contains verbatim fact strings.",
    ),
  );

  /* ----------------------------- RULE-006 ----------------------------- */
  const unsupported: string[] = [];
  for (const card of cards) {
    for (const fact of card.facts) {
      const entity = getHeritageById(fact.origin.entity_id);
      const expected = entity
        ? authoritativeString(entity.data, fact.origin.field)
        : null;
      if (expected === null || expected !== fact.fact) {
        unsupported.push(`${card.entity_id}:${fact.origin.entity_id}`);
      }
    }
  }
  checks.push(
    check(
      "RULE-006",
      unsupported.length === 0,
      unsupported.length === 0
        ? "Every fact on every source card is byte-identical to its knowledge-base field of origin."
        : `Facts not matching the knowledge base: ${[...new Set(unsupported)].join(", ")}.`,
    ),
  );

  /* ----------------------------- RULE-007 ----------------------------- */
  const claimLevelOffenders: string[] = [];
  for (const card of cards) {
    const derived = claimLevelFromEvidence(card.evidence_level, card.source_refs.length);
    if (card.claim_level !== derived) {
      claimLevelOffenders.push(
        `${card.entity_id} (claimed ${card.claim_level}, evidence supports ${derived})`,
      );
    }
    const expectedClassification =
      card.entity_kind === "motif" && card.meaning_status === "not_documented"
        ? "visual_reference"
        : "official_record";
    if (card.classification !== expectedClassification) {
      claimLevelOffenders.push(
        `${card.entity_id} (classified ${card.classification}, should be ${expectedClassification})`,
      );
    }
    for (const fact of card.facts) {
      for (const id of fact.source_ids) {
        if (!sourceIds.has(id)) {
          claimLevelOffenders.push(`${card.entity_id} (fabricated source ${id})`);
        }
      }
    }
  }
  checks.push(
    check(
      "RULE-007",
      claimLevelOffenders.length === 0,
      claimLevelOffenders.length === 0
        ? "Claim levels and classifications are derived from evidence, never asserted."
        : `Claim level integrity violated: ${claimLevelOffenders.join("; ")}.`,
    ),
  );

  /* ------------------------------ warnings ----------------------------- */
  if (cards.length === 0) {
    warnings.push(
      "The proposal cites no cultural sources — it makes no cultural claims.",
    );
  }

  return {
    passed: checks.every((c) => c.passed),
    checks,
    warnings,
  };
}
