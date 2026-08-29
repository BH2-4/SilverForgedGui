import type {
  DesignBrief,
  DesignDirection,
  DesignInterpretation,
  DocumentedFact,
  HeritageReference,
  MotifElement,
  OrientationSummary,
  ReasoningChain,
} from "@/lib/design/schemas";
import type { GlobalDesignBrief } from "@/lib/ai/schemas";
import type { GuardrailResult, SourceRef } from "@/lib/heritage/types";

/**
 * Stage 3 — /api/design-translation response contract.
 *
 * Two-step protocol:
 *   step "directions" → DirectionsApiResponse  (exploration: 2–3 directions)
 *   step "brief"      → BriefApiResponse       (the chosen direction → brief)
 *
 * Success carries the full structured payload (with provenance) so the
 * client never has to re-derive anything. Failures are discriminated on
 * `success: false` with a machine-readable `code`.
 */

export type DirectionsApiResponse = {
  success: true;
  /** Echo of the validated Stage 1 DNA the directions are based on. */
  design_dna: GlobalDesignBrief;
  /** SECTION 01 — hedged orientation summary. */
  orientation: OrientationSummary;
  /** SECTION 02 — customer preference → design signal → cultural direction. */
  reasoning_chain: ReasoningChain;
  /** SECTION 03 — the generated design directions (2–3, differentiated). */
  directions: DesignDirection[];
  source_refs: SourceRef[];
};

export type BriefApiResponse = {
  success: true;
  design_dna: GlobalDesignBrief;
  /** Id of the heritage entity used, or null when none was selected. */
  selected_match_id: string | null;
  /** The direction slot the customer chose ("dir-a" | "dir-b" | "dir-c"). */
  selected_direction_id: string;
  design_brief: DesignBrief;
  verification: GuardrailResult;
  source_refs: SourceRef[];
};

export type DesignTranslationApiResponse =
  | DirectionsApiResponse
  | BriefApiResponse
  | {
      success: false;
      error: string;
      code:
        | "invalid_input"
        | "unknown_heritage_entity"
        | "inconsistent_match_payload"
        | "unknown_direction"
        | "guardrail_violation"
        | "heritage_data_error"
        | "unknown";
    };

export type { DesignBrief, DesignDirection, DesignInterpretation, DocumentedFact, HeritageReference, MotifElement, OrientationSummary, ReasoningChain };
