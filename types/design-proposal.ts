import type { DesignProposal } from "@/lib/design/schemas";
import type { GlobalDesignBrief } from "@/lib/ai/schemas";
import type { GuardrailResult } from "@/lib/heritage/types";

/**
 * Stage 4 — /api/design-proposal response contract.
 *
 * Single-step protocol: the Stage 3 brief (+ the DNA it was derived from)
 * → the customer-facing Design Proposal. The brief is re-verified against
 * the knowledge base before anything is assembled, so the payload from
 * sessionStorage is never trusted structurally — only its ids are used.
 */

export type ProposalApiResponse = {
  success: true;
  /** Echo of the validated Stage 1 DNA the proposal is ultimately based on. */
  design_dna: GlobalDesignBrief;
  /** The id of the direction the customer confirmed in Stage 3. */
  selected_direction_id: string;
  design_proposal: DesignProposal;
  verification: GuardrailResult;
} | {
  success: false;
  error: string;
  code:
    | "invalid_input"
    | "unknown_heritage_entity"
    | "inconsistent_brief"
    | "guardrail_violation"
    | "heritage_data_error"
    | "unknown";
};

export type { DesignProposal };
