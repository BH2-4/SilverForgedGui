/**
 * Session hand-off between pipeline stages (V1 — no DB / no accounts).
 *
 * Stage 1 (Global Demand Engine) persists the completed Design Brief
 * under DESIGN_BRIEF_STORAGE_KEY; Stage 2 (Cultural Match) reads it on
 * mount. Stage 2 persists its result (brief + selected match + guardrail)
 * under DESIGN_TRANSLATION_STORAGE_KEY for Stage 3 (Design Translation).
 * sessionStorage keeps the hand-offs tab-scoped and transient.
 */
export const DESIGN_BRIEF_STORAGE_KEY = "silver-future:design-brief";

/**
 * Stage 0 → Stage 1 hand-off. The guided design interview persists its
 * UserDesignIntent + Stage 1 prefill here; StudioForm reads (and consumes)
 * it on mount. Read-once semantics keep the prefill a one-shot affordance.
 */
export const STAGE0_INTENT_STORAGE_KEY = "silver-future:stage0-intent";

/**
 * Stage 2 → Stage 3 hand-off. The match payload here is only trusted for
 * its `id` — the translation API re-derives every cultural attribute from
 * the knowledge base server-side.
 */
export const DESIGN_TRANSLATION_STORAGE_KEY = "silver-future:design-translation";

/**
 * Stage 3 → Stage 4 hand-off. Persisted as soon as the customer confirms a
 * direction and the final Design Brief comes back: { designDna, designBrief,
 * selectedDirectionId, verification }. Stage 4 (design proposal) reads it
 * on mount; the brief itself is server-generated and re-verified server-side,
 * so the payload needs no re-derivation — only id-level trust applies.
 */
export const STAGE3_BRIEF_STORAGE_KEY = "silver-future:stage3-brief";

/**
 * Stage 4 → Stage 5 hand-off. Persisted when the customer clicks
 * 「确认这个方向」: the confirmed Design Proposal (+ the DNA it derives from).
 * The final visual design / generation stage reads it on mount and is the
 * ONLY stage allowed to render imagery — by then the customer has already
 * discovered what they actually want.
 */
export const STAGE4_PROPOSAL_STORAGE_KEY = "silver-future:stage4-proposal";

/**
 * Stage 5 → 定制 hand-off. Persisted when the customer clicks
 * 「喜欢这个设计，进入定制」: the confirmed Stage 4 hand-off + the image
 * prompt the concept render was generated from. The future customization /
 * checkout stage reads it on mount.
 */
export const STAGE5_RENDER_STORAGE_KEY = "silver-future:stage5-render";
