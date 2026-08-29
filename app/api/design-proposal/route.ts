import { NextResponse } from "next/server";
import { ProposalRequestSchema } from "@/lib/design/schemas";
import { buildDesignProposal, ProposalInputError } from "@/lib/design/proposal";
import { HeritageDataError } from "@/lib/heritage/repository";
import type { ProposalApiResponse } from "@/types/design-proposal";

/**
 * POST /api/design-proposal
 *
 * Stage 4 — Custom Design Proposal. Deterministic, local computation: no
 * AI calls here, so the route behaves identically in Demo Mode and
 * production.
 *
 * Input: the Stage 3 hand-off payload { designDna, designBrief }.
 * Output: the customer-facing Design Proposal (7 sections + actions).
 *
 * INTEGRITY — the brief is only trusted at id level:
 *   · verifyDesignBrief / verifyDesignDirection re-run against the live
 *     knowledge base (facts are byte-compared to their KB field of origin);
 *   · the brief's direction/heritage/craft/motif fields must be mutually
 *     consistent (a stitched-together payload is rejected);
 *   · every cultural source card is re-resolved from the KB by entity id;
 *   · the assembled proposal itself must pass verifyDesignProposal
 *     (RULE-001…007) before it is returned — failures never reach the
 *     customer.
 *
 * VISUAL GENERATION IS INTENTIONALLY OUT OF SCOPE. This stage produces the
 * structured proposal only; image generation is the next stage and only
 * unlocked after the customer confirms the direction here.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ErrorCode = NonNullable<
  Extract<ProposalApiResponse, { success: false }>["code"]
>;

function errorResponse(
  message: string,
  code: ErrorCode,
  status: number,
): NextResponse<ProposalApiResponse> {
  return NextResponse.json({ success: false, error: message, code }, { status });
}

export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return errorResponse("Request body was not valid JSON.", "invalid_input", 400);
  }

  const parsed = ProposalRequestSchema.safeParse(payload);
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];
    const path = firstIssue?.path.join(".") || "<root>";
    return errorResponse(
      `Invalid request at ${path}: ${firstIssue?.message ?? "unknown validation error"}.`,
      "invalid_input",
      400,
    );
  }

  try {
    const { proposal, verification } = buildDesignProposal(parsed.data);

    const body: ProposalApiResponse = {
      success: true,
      design_dna: parsed.data.designDna,
      selected_direction_id: parsed.data.designBrief.selected_direction.id,
      design_proposal: proposal,
      verification,
    };
    return NextResponse.json(body, { status: 200 });
  } catch (err) {
    if (err instanceof ProposalInputError) {
      /* Every ProposalInputError code describes untrusted client data
         (bad shape, stitched brief, unknown entity, guardrail violation) —
         a 4xx, never a server fault. */
      const status =
        err.code === "guardrail_violation" ? 422 : 400;
      return errorResponse(err.message, err.code, status);
    }
    if (err instanceof HeritageDataError) {
      return errorResponse(err.message, "heritage_data_error", 500);
    }
    return errorResponse(
      err instanceof Error ? err.message : "Design proposal generation failed.",
      "unknown",
      500,
    );
  }
}
