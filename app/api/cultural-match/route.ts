import { NextResponse } from "next/server";
import { z } from "zod";
import { GlobalDesignBriefSchema } from "@/lib/ai/schemas";
import { HeritageDataError } from "@/lib/heritage/repository";
import { runCulturalGuardrail } from "@/lib/heritage/guardrail";
import { matchCulturalHeritage } from "@/lib/heritage/match";
import { getSourceById, loadMotifs } from "@/lib/heritage/repository";
import type { SourceRef } from "@/lib/heritage/types";
import type { CulturalMatchApiResponse } from "@/types/cultural-match";

/**
 * POST /api/cultural-match
 *
 * Stage 2 — Cultural Match Engine. Deterministic, local computation:
 * no AI calls happen here (AI inference lives in Stage 1), so this route
 * works identically in Demo Mode and production.
 *
 * Request body:  { designBrief: GlobalDesignBrief }
 * Response:      CulturalMatchApiResponse (discriminated on `success`).
 *
 * Guardrail failures are returned as data (the UI renders them); only
 * transport/validation problems become HTTP errors.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const RequestBodySchema = z.object({
  designBrief: GlobalDesignBriefSchema,
});

function errorResponse(
  message: string,
  code: NonNullable<
    Extract<CulturalMatchApiResponse, { success: false }>["code"]
  >,
  status: number,
): NextResponse<CulturalMatchApiResponse> {
  return NextResponse.json({ success: false, error: message, code }, { status });
}

export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return errorResponse(
      "Request body was not valid JSON.",
      "invalid_input",
      400,
    );
  }

  const parsed = RequestBodySchema.safeParse(payload);
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];
    const path = firstIssue?.path.join(".") || "<root>";
    return errorResponse(
      `Invalid designBrief at ${path}: ${firstIssue?.message ?? "unknown validation error"}.`,
      "invalid_input",
      400,
    );
  }

  const brief = parsed.data.designBrief;

  let matches;
  try {
    matches = matchCulturalHeritage(brief);
  } catch (err) {
    if (err instanceof HeritageDataError) {
      return errorResponse(err.message, "heritage_data_error", 500);
    }
    return errorResponse(
      err instanceof Error ? err.message : "Match engine failed.",
      "unknown",
      500,
    );
  }

  const guardrail = runCulturalGuardrail(matches);

  // Resolve every referenced source once, preserving dataset order.
  const sourceIds = [...new Set(matches.flatMap((m) => m.source_ids))];
  const sourceRefs: SourceRef[] = [];
  for (const id of sourceIds) {
    const source = getSourceById(id);
    if (source) {
      sourceRefs.push({
        id: source.id,
        title: source.title,
        publisher: source.publisher,
        url: source.url,
      });
    }
  }

  const body: CulturalMatchApiResponse = {
    success: true,
    design_dna: brief,
    pool_total: loadMotifs().length,
    matches,
    guardrail,
    source_refs: sourceRefs,
  };
  return NextResponse.json(body, { status: 200 });
}
