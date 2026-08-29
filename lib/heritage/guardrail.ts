import { KNOWN_REGIONS } from "./glossary";
import { loadSources } from "./repository";
import { strongestClaimLevel } from "./evidence";
import { ClaimLevelSchema } from "./types";
import type {
  CulturalMatchResult,
  GuardrailCheck,
  GuardrailResult,
} from "./types";

/**
 * Cultural Guardrail — the fact/integrity layer of Stage 2.
 *
 * It verifies the match output against the six rules defined in
 * `data/.../cultural_rules.json` (which mirror the dataset's own
 * methodology):
 *
 *   RULE-001 Source Required          every cultural fact carries source_ids
 *                                     that resolve to real sources
 *   RULE-002 Regional Attribution     generated text may only attribute an
 *                                     entity to regions in its own data
 *   RULE-003 Documented Meaning       no symbolic claims without
 *                                     documented_meaning
 *   RULE-004 Evidence Level           every match displays an evidence level
 *   RULE-005 AI Inference Separation  AI rationale and official facts live
 *                                     in separate fields
 *   RULE-006 No Unsupported Claim     no evidence-free cultural statements
 *   RULE-007 Claim Level Integrity    claim_level can only be derived from
 *                                     dataset evidence — never raised by
 *                                     AI reasoning; visual_only /
 *                                     interpretive / unknown never become
 *                                     cultural facts
 *
 * "Passed" means the output complies. Honest disclosures (e.g. "meaning
 * not documented") are warnings, not failures — withholding meaning IS
 * the compliant behavior.
 */

/**
 * Verbs that turn a visual subject into a cultural claim.
 * `代表(?!性)` — "代表性" is institutional usage ("representative items"),
 * not a symbolic claim; same for `\brepresents?\b` vs "representative".
 */
const MEANING_VERBS =
  /象征|寓意|意味着|代表(?!性)|\bsymboliz\w*|\bstands?\s+for\b|\brepresents?\b/i;

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
  "RULE-007": { type: "claim_level_integrity", severity: "high" },
};

function check(
  ruleId: string,
  passed: boolean,
  message: string,
): GuardrailCheck {
  const meta = RULE_META[ruleId];
  return {
    rule_id: ruleId,
    rule_type: meta.type,
    severity: meta.severity,
    passed,
    message,
  };
}

/**
 * Regions mentioned in engine-generated text that are NOT part of the
 * entity's own documented region string → misattribution (RULE-002).
 * Only applied to `matched_reasons` — `cultural_evidence` quotes dataset
 * descriptions verbatim and is sourced.
 */
function findUnattributedRegions(text: string, entityRegion: string | null): string[] {
  const offenders: string[] = [];
  for (const region of KNOWN_REGIONS) {
    if (text.includes(region) && !(entityRegion ?? "").includes(region)) {
      offenders.push(region);
    }
  }
  return offenders;
}

export function runCulturalGuardrail(
  matches: CulturalMatchResult[],
): GuardrailResult {
  const sources = new Set(loadSources().map((s) => s.id));
  const checks: GuardrailCheck[] = [];
  const warnings: string[] = [];

  if (matches.length === 0) {
    return {
      passed: false,
      checks: [
        check("RULE-001", false, "No matches were produced — nothing to verify."),
      ],
      warnings: ["The match engine returned no heritage directions."],
    };
  }

  /* ------------------------- RULE-001 Source Required ------------------------- */
  const missingSources = matches.filter(
    (m) => m.source_ids.length === 0 || !m.source_ids.every((id) => sources.has(id)),
  );
  checks.push(
    check(
      "RULE-001",
      missingSources.length === 0,
      missingSources.length === 0
        ? `All ${matches.length} matches carry source_ids that resolve to official sources.`
        : `Matches without resolvable sources: ${missingSources
          .map((m) => m.id)
          .join(", ")}.`,
    ),
  );

  /* ---------------------- RULE-002 Regional Attribution ---------------------- */
  const regionOffenders: string[] = [];
  for (const match of matches) {
    const offenders = findUnattributedRegions(
      match.matched_reasons.join(" "),
      match.region,
    );
    if (offenders.length > 0) {
      regionOffenders.push(`${match.id} → ${offenders.join("/")}`);
    }
  }
  checks.push(
    check(
      "RULE-002",
      regionOffenders.length === 0,
      regionOffenders.length === 0
        ? "Every regional reference in match reasons traces to the entity's own documented region."
        : `Cross-region attributions detected: ${regionOffenders.join("; ")}.`,
    ),
  );

  /* ----------------------- RULE-003 Documented Meaning ----------------------- */
  const meaningOffenders: string[] = [];
  for (const match of matches) {
    // Only engine-generated rationale is policed: `cultural_evidence` is
    // verbatim dataset text, so symbolic language there IS documented
    // (it comes from an official source). Same principle as RULE-002.
    const text = match.matched_reasons.join(" ");
    if (match.meaning_status !== "documented" && MEANING_VERBS.test(text)) {
      meaningOffenders.push(match.id);
    }
    if (match.meaning_status === "not_documented") {
      warnings.push(
        `${match.id} (${match.name}): cultural meaning is not documented in official sources — presented as a visual subject only.`,
      );
    }
  }
  checks.push(
    check(
      "RULE-003",
      meaningOffenders.length === 0,
      meaningOffenders.length === 0
        ? "No symbolic claims without documented meaning. Meaning-free matches are labeled as visual subjects."
        : `Symbolic language without documentation in: ${meaningOffenders.join(", ")}.`,
    ),
  );

  /* ------------------------ RULE-004 Evidence Level ------------------------- */
  const missingLevel = matches.filter(
    (m) => !m.evidence_level || m.evidence_level.length === 0,
  );
  checks.push(
    check(
      "RULE-004",
      missingLevel.length === 0,
      missingLevel.length === 0
        ? `Every match carries an explicit evidence level (${[
          ...new Set(matches.map((m) => m.evidence_level)),
        ].join(", ")}).`
        : `Matches missing evidence level: ${missingLevel.map((m) => m.id).join(", ")}.`,
    ),
  );

  /* ------------------- RULE-005 AI Inference Separation --------------------- */
  const shapeOk = matches.every(
    (m) =>
      Array.isArray(m.cultural_evidence) &&
      m.cultural_evidence.length > 0 &&
      m.meaning_status !== undefined &&
      // AI rationale lives ONLY in matched_reasons, which the UI labels
      // as "why this matched"; facts live in cultural_evidence.
      Array.isArray(m.matched_reasons),
  );
  checks.push(
    check(
      "RULE-005",
      shapeOk,
      shapeOk
        ? "AI match rationale and official cultural facts are kept in separate fields (matched_reasons vs cultural_evidence)."
        : "Match shape violates the fact/inference separation contract.",
    ),
  );

  /* ---------------------- RULE-006 No Unsupported Claim --------------------- */
  const unsupported = matches.filter(
    (m) => m.source_ids.length === 0 || m.cultural_evidence.length === 0,
  );
  checks.push(
    check(
      "RULE-006",
      unsupported.length === 0,
      unsupported.length === 0
        ? "Every cultural statement in the output is traceable to at least one official source."
        : `Statements without traceable evidence: ${unsupported
          .map((m) => m.id)
          .join(", ")}.`,
    ),
  );

  /* ---------------------- RULE-007 Claim Level Integrity -------------------- */
  const claimLevelOffenders: string[] = [];
  for (const match of matches) {
    // (a) claim_level must be a valid ClaimLevel.
    if (!ClaimLevelSchema.safeParse(match.claim_level).success) {
      claimLevelOffenders.push(`${match.id} (invalid claim_level)`);
      continue;
    }
    // (b) claim_level must equal the strongest level re-derived from the
    //     traceable facts — an AI-raised level cannot survive this check.
    const derived = strongestClaimLevel(match.why.cultural_facts);
    if (match.claim_level !== derived) {
      claimLevelOffenders.push(`${match.id} (claimed ${match.claim_level}, facts support ${derived})`);
      continue;
    }
    // (c) every fact must cite a resolvable source or explicitly null —
    //     fabricated source ids are forbidden.
    for (const fact of match.why.cultural_facts) {
      if (fact.sourceId !== null && !sources.has(fact.sourceId)) {
        claimLevelOffenders.push(`${match.id} (fabricated source ${fact.sourceId})`);
      }
    }
    // (d) a motif without documented meaning must not carry a meaning fact.
    if (match.meaning_status === "not_documented") {
      for (const fact of match.why.cultural_facts) {
        if (fact.claim.includes("寓意") || fact.claim.includes("象征")) {
          claimLevelOffenders.push(`${match.id} (meaning claim without documentation)`);
        }
      }
    }
  }
  checks.push(
    check(
      "RULE-007",
      claimLevelOffenders.length === 0,
      claimLevelOffenders.length === 0
        ? "Every claim level is derived from dataset evidence only — no level was raised by AI reasoning, and visual-only records stay visual-only."
        : `Claim-level integrity violations: ${claimLevelOffenders.join("; ")}.`,
    ),
  );

  return {
    passed: checks.every((c) => c.passed),
    checks,
    warnings,
  };
}
