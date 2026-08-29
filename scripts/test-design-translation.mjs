/**
 * Stage 3 — Design Translation API scenario tests.
 *
 * Runs against a local dev server (http://localhost:3000). Exit code is
 * non-zero if any scenario fails. No framework — plain fetch + assertions.
 *
 * Usage: node scripts/test-design-translation.mjs
 */

const BASE = process.env.TEST_BASE_URL ?? "http://localhost:3000";

/* ------------------------------  Helpers  ------------------------------ */

let passed = 0;
let failed = 0;

function assert(cond, label) {
  if (cond) {
    passed += 1;
    console.log(`  ✓ ${label}`);
  } else {
    failed += 1;
    console.error(`  ✕ ${label}`);
  }
}

async function post(path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  return { status: res.status, body: await res.json() };
}

function dna(overrides = {}) {
  return {
    market: "United States",
    consumer_profile: "Young urban professional who values quiet luxury.",
    product_type: "necklace",
    style: ["minimal", "modern"],
    occasion: "everyday",
    emotion: ["calm"],
    cultural_interest: "open to subtle cultural motifs",
    cultural_visibility: "subtle",
    wearability: "high",
    complexity: "low",
    size_preference: "small",
    weight_preference: "light",
    price_sensitivity: "medium",
    design_keywords: ["minimal", "silver"],
    avoid: ["heavy-ornamentation"],
    confidence: 0.8,
    reasoning: "User asked for a minimal everyday silver necklace.",
    ...overrides,
  };
}

async function matchFor(brief, predicate) {
  const { status, body } = await post("/api/cultural-match", { designBrief: brief });
  if (status !== 200 || !body.success) {
    throw new Error(`cultural-match failed (${status}): ${body?.error ?? "unknown"}`);
  }
  const match = body.matches.find(predicate);
  if (!match) {
    throw new Error("no cultural match satisfies the scenario predicate");
  }
  return match;
}

/**
 * The real Stage 3 flow (mirrors DesignTranslationStudio): directions step
 * → the customer picks a direction → brief step with direction_id.
 * `selectedMatch` seeds the pool; the picked DIRECTION decides the brief.
 */
async function twoStepBrief(brief, match, directionPredicate) {
  const { status: dStatus, body: dBody } = await post("/api/design-translation", {
    designBrief: brief,
    selectedMatch: match,
    step: "directions",
  });
  if (dStatus !== 200 || !dBody.success) {
    throw new Error(`directions step failed (${dStatus})`);
  }
  const direction = dBody.directions.find(directionPredicate);
  if (!direction) {
    throw new Error("no generated direction satisfies the scenario predicate");
  }
  const { status: bStatus, body: bBody } = await post("/api/design-translation", {
    designBrief: brief,
    selectedMatch: match,
    step: "brief",
    direction_id: direction.id,
  });
  if (bStatus !== 200 || !bBody.success) {
    throw new Error(`brief step failed (${bStatus})`);
  }
  return { direction, body: bBody, b: bBody.design_brief };
}

/* -----------------------------  Scenarios  ----------------------------- */

async function scenario1MinimalNature() {
  console.log("\n[1] Minimal + Nature → translation grounded in a motif");
  const brief = dna({
    style: ["minimal", "nature-inspired"],
    emotion: ["calm", "organic"],
    design_keywords: ["minimal", "nature", "lightweight"],
  });
  const match = await matchFor(brief, (m) => m.type === "motif");
  const { body, b } = await twoStepBrief(
    brief,
    match,
    (d) => d.origin_match_id?.startsWith("MOTIF-"),
  );
  assert(b.heritage_reference?.match_id === b.selected_direction.origin_match_id, "heritage_reference follows the picked direction");
  assert(b.motif_elements.length > 0, "has motif element");
  assert(
    b.motif_elements.every((m) => m.source_ids.length > 0 && m.evidence_level),
    "motif elements carry source_ids + evidence_level",
  );
  assert(
    b.documented_cultural_facts.every((f) => f.source_ids.length > 0),
    "every documented fact carries source ids",
  );
  assert(
    b.design_interpretation.notice.startsWith("AI DESIGN INTERPRETATION"),
    "interpretation carries the AI DESIGN INTERPRETATION notice",
  );
  assert(b.generation_prompt.length > 0 && b.negative_prompt.length > 0, "prompts are generated");
  assert(body.verification.passed === true, "guardrail passes");
  assert(
    body.source_refs.every((s) => s.id && s.url),
    "source refs resolved with ids and urls",
  );
}

async function scenario2FestivalOrnate() {
  console.log("\n[2] Festival + Ornate → heritage item / project direction");
  const brief = dna({
    style: ["ornate", "traditional", "statement"],
    occasion: "festival",
    cultural_visibility: "strong",
    complexity: "high",
    wearability: "medium",
    design_keywords: ["festival", "ornate", "ceremonial"],
    emotion: ["celebration", "pride"],
  });
  const match = await matchFor(
    brief,
    (m) => m.type === "heritage_item" || m.type === "project",
  );
  const { b } = await twoStepBrief(
    brief,
    match,
    (d) =>
      d.origin_match_id?.startsWith("ITEM-") || d.origin_match_id?.startsWith("PROJ-"),
  );
  assert(b.heritage_reference?.match_id === b.selected_direction.origin_match_id, "heritage_reference follows the picked direction");
  // Complexity is derived from the picked direction's tier, not the raw DNA.
  const tierComplexity = {
    quiet: "Low",
    balanced: "Medium",
    statement: "High",
  }[b.selected_direction.tier];
  assert(b.complexity.startsWith(tierComplexity), `complexity follows the direction's tier (${tierComplexity})`);
  assert(b.cultural_visibility.startsWith("Strong"), "cultural visibility translated to strong");
  assert(b.motif_elements.length === 0, "non-motif entity → no motif elements invented");
  assert(
    b.documented_cultural_facts.length > 0,
    "heritage item description quoted as documented fact",
  );
}

async function scenario3DragonKeyword() {
  console.log("\n[3] Dragon keyword → documented dragon motif, no invented symbolism");
  const brief = dna({
    design_keywords: ["dragon", "minimal", "silver"],
    emotion: ["power"],
  });
  const match = await matchFor(brief, (m) => m.type === "motif" && m.name.includes("龙"));
  assert(!!match, "cultural match found a dragon motif");
  const { b } = await twoStepBrief(brief, match, (d) => d.origin_match_id === match.id);
  assert(b.motif_elements[0]?.name === match.name, "motif element uses the documented name");
  assert(
    b.motif_elements[0]?.documented_meaning === null,
    "dragon motif's documented_meaning stays null (dataset has none)",
  );
  assert(
    b.motif_elements[0]?.presented_as === "visual-subject",
    "dragon presented as visual subject only",
  );
  assert(
    !/symboliz|represents/i.test(b.generation_prompt) || /no symbolic meaning is claimed/i.test(b.generation_prompt),
    "prompt never claims undocumented symbolism",
  );
}

async function scenario4NoMatch() {
  console.log("\n[4] Single-step legacy call (no direction_id) → server picks a direction, brief stays traceable");
  const brief = dna();
  const { status, body } = await post("/api/design-translation", {
    designBrief: brief,
    selectedMatch: null,
  });
  assert(status === 200, "returns 200");
  const b = body.design_brief;
  const originId = b.selected_direction.origin_match_id;
  // The engine assigns an entity from its own re-run match pool; whatever
  // it assigns must be carried through consistently, never re-derived.
  if (originId) {
    assert(b.heritage_reference?.match_id === originId, "heritage_reference follows the auto-picked direction");
    assert(
      b.documented_cultural_facts.every((f) => f.origin.entity_id === originId),
      "facts trace back to the auto-picked entity only",
    );
  } else {
    // Form-led: only when the pool is genuinely empty.
    assert(b.heritage_reference === null, "heritage_reference is null");
    assert(b.documented_cultural_facts.length === 0, "no documented facts invented");
    assert(b.evidence_sources.length === 0, "no evidence sources fabricated");
  }
  assert(
    b.motif_elements.every((m) => m.origin_entity_id === (b.heritage_reference?.match_id ?? m.origin_entity_id)),
    "no motifs beyond the brief's own origin",
  );
  assert(body.verification.passed === true, "guardrail passes");
}

async function scenario5NoDocumentedMeaning() {
  console.log("\n[5] Motif without documented meaning → meaning status honest");
  const brief = dna({ design_keywords: ["butterfly", "nature"] });
  const match = await matchFor(
    brief,
    (m) => m.type === "motif" && m.meaning_status === "not_documented",
  );
  assert(!!match, "found a motif with meaning_status not_documented");
  const { b } = await twoStepBrief(brief, match, (d) => d.origin_match_id === match.id);
  assert(b.heritage_reference?.meaning_status === "not_documented", "meaning_status propagated");
  assert(
    b.cultural_constraints.some(
      (c) =>
        /presented as a documented visual element only/i.test(c) ||
        /must not attach symbolic or cultural meaning/i.test(c),
    ),
    "constraint states the meaning is not documented",
  );
  assert(
    b.documented_cultural_facts.every((f) => f.origin.entity_id === match.id),
    "facts trace back to the selected entity",
  );
}

async function scenario6MissingSource() {
  console.log("\n[6] Match payload missing sources → rejected 400");
  const brief = dna();
  const match = await matchFor(brief, () => true);
  const tampered = { ...match, source_ids: [] };
  const { status, body } = await post("/api/design-translation", {
    designBrief: brief,
    selectedMatch: tampered,
  });
  assert(status === 400, "returns 400");
  assert(body.code === "invalid_input", "code = invalid_input");
  assert(body.success === false, "body marked failure");
}

async function scenario7MaliciousSymbolism() {
  console.log("\n[7] User demands invented symbolism → sanitized, never leaked");
  const brief = dna({
    design_keywords: ["dragon", "dragon symbolizes imperial power", "minimal"],
    emotion: ["the motif protects the wearer"],
  });
  const match = await matchFor(brief, (m) => m.type === "motif" && m.name.includes("龙"));
  const { status, body } = await post("/api/design-translation", {
    designBrief: brief,
    selectedMatch: match,
  });
  assert(status === 200, "returns 200");
  const b = body.design_brief;
  assert(
    b.discarded_symbolic_inputs.some((t) => /imperial|protects/i.test(t)),
    "symbolic claims discarded and surfaced",
  );
  const combined = [
    b.generation_prompt,
    ...b.design_interpretation.statements,
  ].join(" ");
  assert(
    !/imperial power|protects the wearer/i.test(combined),
    "invented symbolism never reaches prompt or interpretation",
  );
  assert(body.verification.passed === true, "guardrail passes");
}

async function scenario8EmptyDna() {
  console.log("\n[8] Empty Design DNA → rejected 400");
  const { status, body } = await post("/api/design-translation", {
    designBrief: dna({ style: [], emotion: [], design_keywords: [] }),
    selectedMatch: null,
  });
  assert(status === 400, "returns 400");
  assert(body.code === "invalid_input", "code = invalid_input");
}

async function scenario9UnknownEntity() {
  console.log("\n[9] Bonus: unknown heritage entity → 400");
  const brief = dna();
  const match = await matchFor(brief, () => true);
  const { status, body } = await post("/api/design-translation", {
    designBrief: brief,
    selectedMatch: { ...match, id: "motif-fake-999" },
  });
  assert(status === 400, "returns 400");
  assert(body.code === "unknown_heritage_entity", "code = unknown_heritage_entity");
}

async function scenario10TamperedPayload() {
  console.log("\n[10] Bonus: tampered match payload → 400");
  const brief = dna();
  const match = await matchFor(brief, () => true);
  const { status, body } = await post("/api/design-translation", {
    designBrief: brief,
    selectedMatch: { ...match, name: "伪造纹样 Fake Motif" },
  });
  assert(status === 400, "returns 400");
  assert(body.code === "inconsistent_match_payload", "code = inconsistent_match_payload");
}

/* --------------------------------  Run  -------------------------------- */

const scenarios = [
  scenario1MinimalNature,
  scenario2FestivalOrnate,
  scenario3DragonKeyword,
  scenario4NoMatch,
  scenario5NoDocumentedMeaning,
  scenario6MissingSource,
  scenario7MaliciousSymbolism,
  scenario8EmptyDna,
  scenario9UnknownEntity,
  scenario10TamperedPayload,
];

console.log(`Testing Design Translation against ${BASE}`);

for (const scenario of scenarios) {
  try {
    await scenario();
  } catch (err) {
    failed += 1;
    console.error(`  ✕ scenario crashed: ${err.message}`);
  }
}

console.log(`\nResult: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
