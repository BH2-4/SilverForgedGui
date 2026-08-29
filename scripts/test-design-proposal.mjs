/**
 * Stage 4 — Design Proposal API scenario tests.
 *
 * Runs against a local dev server (http://localhost:3000). Exit code is
 * non-zero if any scenario fails. No framework — plain fetch + assertions.
 *
 * Chain per scenario (mirrors the real UI flow):
 *   cultural-match → design-translation (directions step) →
 *   design-translation (brief step, direction_id) → design-proposal.
 *
 * Usage: node scripts/test-design-proposal.mjs
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

/**
 * Real UI flow: match → directions → pick a direction → brief.
 * `directionPredicate` picks which generated direction to carry forward.
 */
async function briefFor(dnaInput, directionPredicate, selectedMatchId = null) {
  const { status: mStatus, body: mBody } = await post("/api/cultural-match", {
    designBrief: dnaInput,
  });
  if (mStatus !== 200 || !mBody.success) {
    throw new Error(`cultural-match failed (${mStatus})`);
  }
  const selectedMatch = selectedMatchId
    ? mBody.matches.find((m) => m.id === selectedMatchId) ?? null
    : null;

  const { status: dStatus, body: dBody } = await post("/api/design-translation", {
    designBrief: dnaInput,
    selectedMatch,
    step: "directions",
  });
  if (dStatus !== 200 || !dBody.success) {
    throw new Error(`design-translation (directions) failed (${dStatus})`);
  }
  const direction = dBody.directions.find(directionPredicate);
  if (!direction) {
    throw new Error("no generated direction satisfies the scenario predicate");
  }

  const { status: bStatus, body: bBody } = await post("/api/design-translation", {
    designBrief: dnaInput,
    selectedMatch,
    step: "brief",
    direction_id: direction.id,
  });
  if (bStatus !== 200 || !bBody.success) {
    throw new Error(`design-translation (brief) failed (${bStatus})`);
  }
  return { designBrief: bBody.design_brief, direction };
}

/* -----------------------------  Scenarios  ----------------------------- */

async function scenario1MotifProposal() {
  console.log("\n[1] Dragon motif direction → full proposal with traceable cultural cards");
  const input = dna({
    design_keywords: ["dragon", "minimal", "silver"],
    emotion: ["power"],
  });
  const { designBrief, direction } = await briefFor(
    input,
    (d) => d.origin_match_id?.startsWith("MOTIF-"),
    "MOTIF-001",
  );
  assert(direction.origin_match_id === "MOTIF-001", "picked the dragon motif direction");

  const { status, body } = await post("/api/design-proposal", {
    designDna: input,
    designBrief,
  });
  assert(status === 200, "returns 200");
  assert(body.success === true, "returns success");
  assert(body.selected_direction_id === designBrief.selected_direction.id, "selected direction id echoed");
  const p = body.design_proposal;

  // SECTION coverage — all seven sections assembled.
  assert(p.title.core !== null && p.title.tier, "SECTION 01 title (core + tier)");
  assert(p.concept.emotion_tokens.length > 0, "SECTION 01 concept (emotion tokens)");
  assert(p.design_reasoning.length === 5, "SECTION 02 five reasoning steps");
  assert(p.customer_intent.product_type === "necklace", "SECTION 02 customer intent from Stage 0");
  assert(p.form.thickness && p.form.position.key, "SECTION 03 form (thickness + position)");
  assert(p.motif.primary !== null, "SECTION 04 motif carried from the brief");
  assert(p.motif.primary.origin_entity_id === "MOTIF-001", "SECTION 04 motif is the dragon motif");
  assert(p.craft.primary.name && p.craft.primary.source_ids.length > 0, "SECTION 05 craft with sources");
  assert(p.wearability.scenes.length > 0 && p.wearability.reasons.length > 0, "SECTION 06 wearability");
  assert(p.cultural_sources.length > 0, "SECTION 07 cultural source cards");

  // Trust core — every card is traceable to the brief's entity.
  for (const card of p.cultural_sources) {
    assert(card.entity_id === "MOTIF-001", `card entity matches the direction origin (${card.entity_id})`);
    assert(card.source_refs.every((s) => s.id && s.url), "card sources resolvable with urls");
    assert(card.facts.every((f) => f.source_ids.length > 0), "card facts carry source ids");
  }

  // Fact / interpretation separation.
  assert(
    p.design_interpretation.notice.startsWith("AI DESIGN INTERPRETATION"),
    "interpretation carries the AI notice",
  );
  assert(p.guardrail_status.passed === true, "guardrail re-verification passes");
  assert(p.uncertainties.length > 0, "honest unknowns re-exported");
}

async function scenario2DefaultFlowProposal() {
  console.log("\n[2] Default single-step flow → proposal consistent with its own brief");
  const input = dna();
  const { status, body } = await post("/api/design-translation", {
    designBrief: input,
    selectedMatch: null,
  });
  assert(status === 200, "design-translation single-step returns 200");
  const designBrief = body.design_brief;
  const originId = designBrief.selected_direction.origin_match_id;

  const { status: pStatus, body: pBody } = await post("/api/design-proposal", {
    designDna: input,
    designBrief,
  });
  assert(pStatus === 200, "returns 200");
  const p = pBody.design_proposal;

  // The proposal never re-derives culture: whatever the brief carries is
  // re-exported verbatim; whatever the brief lacks is never invented.
  if (originId) {
    assert(p.cultural_sources.length > 0, "brief with an origin → cultural cards present");
    assert(
      p.cultural_sources.every((c) => c.entity_id === originId),
      "cards only reference the brief's origin entity",
    );
    assert(p.title.core !== null, "title core echoes the origin entity");
  } else {
    assert(p.cultural_sources.length === 0, "form-led brief → no cultural cards invented");
    assert(p.title.core === null, "form-led brief → form-led title");
    assert(p.motif.primary === null, "form-led brief → no motif invented");
  }
  assert(p.design_reasoning.length === 5, "reasoning chain always complete");
  assert(p.guardrail_status.passed === true, "guardrail passes");
}

async function scenario3TamperedBrief() {
  console.log("\n[3] Tampered brief → rejected before assembly");
  const input = dna({
    design_keywords: ["dragon", "minimal", "silver"],
    emotion: ["power"],
  });
  const { designBrief } = await briefFor(
    input,
    (d) => d.origin_match_id?.startsWith("MOTIF-"),
    "MOTIF-001",
  );

  // Swap the heritage reference to a non-existent entity — the consistency
  // check must reject the stitched payload with a 4xx, not a server fault.
  const stitched = structuredClone(designBrief);
  if (stitched.heritage_reference) {
    stitched.heritage_reference.match_id = "MOTIF-999";
  }
  const { status, body } = await post("/api/design-proposal", {
    designDna: input,
    designBrief: stitched,
  });
  assert(status >= 400 && status < 500, `tampered brief rejected with 4xx (${status})`);
  assert(body.success === false, "failure is structured, not a crash");
  assert(
    body.code === "inconsistent_brief" || body.code === "guardrail_violation",
    `error code identifies the rejection reason: ${body.code ?? "-"}`,
  );
}

/* -------------------------------  Runner  ------------------------------- */

async function main() {
  console.log(`Testing design-proposal against ${BASE}`);
  await scenario1MotifProposal();
  await scenario2DefaultFlowProposal();
  await scenario3TamperedBrief();
  console.log(`\n${passed} passed, ${failed} failed`);
  process.exit(failed === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error("FATAL:", err.message);
  process.exit(1);
});
