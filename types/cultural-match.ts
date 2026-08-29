/**
 * Public types for the Cultural Match Engine (Stage 2).
 *
 * The API boundary mirrors Stage 1's conventions: a discriminated
 * `success` envelope, Zod-derived payload types, and no provider
 * internals leaking to the client.
 */

export type {
  CulturalMatchResult,
  GuardrailCheck,
  GuardrailResult,
  MatchEntityKind,
  ScoreBreakdown,
  ScoreBreakdownWeighted,
  SourceRef,
} from "@/lib/heritage/types";

export type { GlobalDesignBrief } from "@/lib/ai/schemas";

export type CulturalMatchApiResponse =
  | {
      success: true;
      /** The Stage-1 brief this match was computed from (AI inference —
       *  kept separate from heritage facts per RULE-005). */
      design_dna: import("@/lib/ai/schemas").GlobalDesignBrief;
      matches: import("@/lib/heritage/types").CulturalMatchResult[];
      guardrail: import("@/lib/heritage/types").GuardrailResult;
      /** Resolved references for every source_id used by the matches. */
      source_refs: import("@/lib/heritage/types").SourceRef[];
    }
  | {
      success: false;
      error: string;
      code: "invalid_input" | "heritage_data_error" | "unknown";
    };
