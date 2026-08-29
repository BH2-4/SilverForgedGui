import { NextResponse } from "next/server";
import { z } from "zod";
import { analyzeGlobalDemand } from "@/lib/ai/client";
import { GlobalDemandInputSchema } from "@/lib/ai/schemas";
import { ProviderError } from "@/lib/ai/providers/types";
import type { GlobalDemandApiResponse } from "@/types/global-demand";

/**
 * POST /api/global-demand/analyze
 *
 * Single entry point for the Global Demand Engine. Server-side only —
 * never call Anthropic from the client.
 *
 * Request body: GlobalDemandInputSchema (see lib/ai/schemas.ts).
 * Response: GlobalDemandApiResponse (discriminated on `success`).
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function errorResponse(
  message: string,
  code: NonNullable<
    Extract<GlobalDemandApiResponse, { success: false }>["code"]
  >,
  status: number,
): NextResponse<GlobalDemandApiResponse> {
  return NextResponse.json({ success: false, error: message, code }, { status });
}

export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return errorResponse("Request body was not valid JSON.", "invalid_input", 400);
  }

  const parsed = GlobalDemandInputSchema.safeParse(payload);
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];
    const path = firstIssue?.path.join(".") || "<root>";
    return errorResponse(
      `Invalid input at ${path}: ${firstIssue?.message ?? "unknown validation error"}.`,
      "invalid_input",
      400,
    );
  }

  const input = parsed.data;
  const hasSignal =
    (input.message ?? "").trim().length > 0 ||
    !!input.productType ||
    (input.styles?.length ?? 0) > 0 ||
    !!input.occasion ||
    (input.emotions?.length ?? 0) > 0 ||
    !!input.culturalVisibility ||
    !!input.image ||
    (input.history?.length ?? 0) > 0;

  if (!hasSignal) {
    return errorResponse(
      "Please share a story or select at least one preference before continuing.",
      "invalid_input",
      400,
    );
  }

  try {
    const { demoMode, result } = await analyzeGlobalDemand(input);
    const body: GlobalDemandApiResponse = {
      success: true,
      demoMode,
      data: result,
    };
    return NextResponse.json(body, { status: 200 });
  } catch (err) {
    if (err instanceof ProviderError) {
      const status =
        err.code === "timeout"
          ? 504
          : err.code === "rate_limited"
            ? 429
            : err.code === "invalid_input"
              ? 400
              : 502;
      return errorResponse(err.message, err.code, status);
    }
    if (err instanceof z.ZodError) {
      return errorResponse(
        "Model response failed validation.",
        "provider_error",
        502,
      );
    }
    return errorResponse(
      err instanceof Error ? err.message : "Unknown error.",
      "unknown",
      500,
    );
  }
}
