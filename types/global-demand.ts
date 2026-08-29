/**
 * Public types for the Global Demand Engine.
 *
 * These are the canonical shapes crossing the API boundary. They are
 * derived from Zod schemas so that runtime validation and static types
 * cannot drift apart.
 *
 * NOTE: Nothing in this file should reference AI provider libraries —
 * downstream stages (Cultural Match, Heritage Knowledge Base) should
 * only ever depend on these types.
 */

export type {
  GlobalDesignBrief,
  ClarificationQuestion,
  GlobalDemandResult,
  GlobalDemandInput,
  ConversationTurn,
  InspirationImageMeta,
} from "@/lib/ai/schemas";

/** API response envelope. Discriminated on `success`. */
export type GlobalDemandApiResponse =
  | {
      success: true;
      demoMode: boolean;
      data: import("@/lib/ai/schemas").GlobalDemandResult;
    }
  | {
      success: false;
      error: string;
      code?:
        | "invalid_input"
        | "provider_error"
        | "timeout"
        | "rate_limited"
        | "unknown";
    };
