import { NextResponse } from "next/server";
import { TranslationRequestSchema } from "@/lib/design/schemas";
import { translateDesign, TranslationInputError } from "@/lib/design/translate";
import {
  findDirectionById,
  generateDesignDirections,
} from "@/lib/design/directions";
import { verifyDesignDirection } from "@/lib/design/verification";
import { HeritageDataError } from "@/lib/heritage/repository";
import type { GlobalDesignBrief } from "@/lib/ai/schemas";
import type { DesignTranslationApiResponse } from "@/types/design-translation";

/**
 * POST /api/design-translation
 *
 * Stage 3 — Design Translation Engine. Deterministic, local computation:
 * no AI calls here (AI inference lives in Stage 1), so the route behaves
 * identically in Demo Mode and production.
 *
 * Two-step protocol:
 *
 *   { …designBrief, selectedMatch?, step: "directions", refresh? }
 *       → SECTION 01–03 payload: orientation + reasoning chain + directions
 *
 *   { …designBrief, selectedMatch?, step: "brief", direction_id }
 *       → the final Design Brief for the chosen direction
 *
 * `step` defaults to "brief"; when `direction_id` is omitted the server
 * picks the tier closest to the DNA's complexity, so the previous
 * single-step contract keeps working.
 *
 * INTEGRITY — the client is only ever trusted for ids:
 *   · selectedMatch is re-grounded in the knowledge base (mismatch → 400);
 *   · direction_id selects a server-generated direction — the client never
 *     posts a direction object, so no cultural attribute is client-supplied;
 *   · every generated direction passes the Stage 3 guardrails before it is
 *     returned (verifyDesignDirection); failures never reach the customer.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ErrorCode = NonNullable<
  Extract<DesignTranslationApiResponse, { success: false }>["code"]
>;

function errorResponse(
  message: string,
  code: ErrorCode,
  status: number,
): NextResponse<DesignTranslationApiResponse> {
  return NextResponse.json({ success: false, error: message, code }, { status });
}

/** Default slot when the caller does not pick one: nearest to DNA complexity. */
function defaultDirectionId(dna: GlobalDesignBrief): string {
  if (dna.complexity === "low") return "dir-a";
  if (dna.complexity === "high") return "dir-c";
  return "dir-b";
}

export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return errorResponse("Request body was not valid JSON.", "invalid_input", 400);
  }

  const parsed = TranslationRequestSchema.safeParse(payload);
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];
    const path = firstIssue?.path.join(".") || "<root>";
    return errorResponse(
      `Invalid request at ${path}: ${firstIssue?.message ?? "unknown validation error"}.`,
      "invalid_input",
      400,
    );
  }

  const { designBrief, selectedMatch, step, direction_id, refresh } = parsed.data;

  try {
    /* Directions are always regenerated server-side from the KB — the
       same input yields the same directions, so the brief step can trust
       the slot id alone. */
    const generated = generateDesignDirections({
      designBrief,
      selectedMatch: selectedMatch ?? null,
      refresh,
    });

    /* Guardrail every direction before it can reach the customer. */
    for (const direction of generated.directions) {
      const verification = verifyDesignDirection(direction);
      if (!verification.passed) {
        const failed = verification.checks
          .filter((c) => !c.passed)
          .map((c) => `${c.rule_id}: ${c.message}`)
          .join(" | ");
        return errorResponse(
          `Design direction "${direction.id}" failed the cultural guardrails and was withheld: ${failed}`,
          "guardrail_violation",
          500,
        );
      }
    }

    if (step === "directions") {
      const body: DesignTranslationApiResponse = {
        success: true,
        design_dna: designBrief,
        orientation: generated.orientation,
        reasoning_chain: generated.reasoning_chain,
        directions: generated.directions,
        source_refs: generated.source_refs,
      };
      return NextResponse.json(body, { status: 200 });
    }

    /* --- brief step --- */
    const wantedId = direction_id ?? defaultDirectionId(designBrief);
    const direction = findDirectionById(generated, wantedId);
    if (!direction) {
      return errorResponse(
        `Unknown direction id "${wantedId}". Expected one of ${generated.directions
          .map((d) => d.id)
          .join(", ")}.`,
        "unknown_direction",
        400,
      );
    }

    const { designBrief: brief, verification } = translateDesign({
      designBrief,
      direction,
    });

    const body: DesignTranslationApiResponse = {
      success: true,
      design_dna: designBrief,
      selected_match_id: direction.origin_match_id,
      selected_direction_id: direction.id,
      design_brief: brief,
      verification,
      source_refs: brief.evidence_sources,
    };
    return NextResponse.json(body, { status: 200 });
  } catch (err) {
    if (err instanceof TranslationInputError) {
      return errorResponse(err.message, err.code, 400);
    }
    if (err instanceof HeritageDataError) {
      return errorResponse(err.message, "heritage_data_error", 500);
    }
    return errorResponse(
      err instanceof Error ? err.message : "Design translation failed.",
      "unknown",
      500,
    );
  }
}
