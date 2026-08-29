import { NextResponse } from "next/server";
import { z } from "zod";
import { ProposalHandoffSchema } from "@/lib/design/schemas";
import { verifyDesignProposal } from "@/lib/design/verification";
import { buildImagePrompt } from "@/lib/design/render-prompt";
import { generateDesignImage } from "@/lib/ai/image-generator";
import type { RenderApiResponse } from "@/types/design-render";

/**
 * POST /api/design-render
 *
 * Stage 5 — Design Render. Turns the CONFIRMED Stage 4 proposal into a
 * structured image prompt and renders one concept image. No stage can be
 * skipped: the route only accepts the full Stage 4 hand-off and re-verifies
 * it before rendering.
 *
 * INTEGRITY — the persisted hand-off is only trusted after re-verification:
 *   · the payload must satisfy ProposalHandoffSchema (400 on bad shape);
 *   · the direction ids must be mutually consistent — a hand-off stitched
 *     from different directions is rejected (400);
 *   · verifyDesignProposal re-runs RULE-001…007 against the live knowledge
 *     base (422 on any violation — no image is ever rendered from a
 *     proposal that fails the cultural guardrails);
 *   · the image prompt is assembled ONLY from the proposal's structured
 *     fields; the route itself introduces no cultural content.
 *
 * The image provider is an adapter (lib/ai/image-generator.ts); V1 runs the
 * deterministic mock renderer so the full stage works without any API key.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const RenderRequestSchema = ProposalHandoffSchema.extend({
  /** Regeneration seed — different seeds vary the mock's decorative layout. */
  seed: z.number().int().min(0).max(2 ** 31 - 1).default(1),
});

type ErrorCode = NonNullable<
  Extract<RenderApiResponse, { success: false }>["code"]
>;

function errorResponse(
  message: string,
  code: ErrorCode,
  status: number,
): NextResponse<RenderApiResponse> {
  return NextResponse.json({ success: false, error: message, code }, { status });
}

export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return errorResponse("Request body was not valid JSON.", "invalid_input", 400);
  }

  const parsed = RenderRequestSchema.safeParse(payload);
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];
    const path = firstIssue?.path.join(".") || "<root>";
    return errorResponse(
      `Invalid request at ${path}: ${firstIssue?.message ?? "unknown validation error"}.`,
      "invalid_input",
      400,
    );
  }

  const { designDna, designBrief, selectedDirectionId, proposal, seed } = parsed.data;

  /* Direction consistency — a hand-off stitched from different directions
     never reaches the renderer. */
  if (
    proposal.design_direction.id !== selectedDirectionId ||
    designBrief.selected_direction.id !== selectedDirectionId
  ) {
    return errorResponse(
      "The hand-off is inconsistent: the proposal, brief and direction id do not match. Re-confirm the direction in Stage 4.",
      "inconsistent_handoff",
      400,
    );
  }

  /* Cultural guardrails re-run against the live knowledge base. */
  const verification = verifyDesignProposal(proposal);
  if (!verification.passed) {
    return errorResponse(
      `The confirmed proposal failed the cultural guardrails: ${verification.checks
        .filter((c) => !c.passed)
        .map((c) => `${c.rule_id}: ${c.message}`)
        .join(" | ")}`,
      "guardrail_violation",
      422,
    );
  }

  try {
    const { prompt } = buildImagePrompt({
      handoff: { designDna, designBrief, selectedDirectionId, proposal },
      seed,
    });

    const image = await generateDesignImage({ prompt, seed });

    const body: RenderApiResponse = {
      success: true,
      image_prompt: prompt,
      image: {
        data_url: image.dataUrl,
        mime: image.mime,
        provider: image.provider,
        model: image.model,
        generated_at: image.generatedAt,
      },
      verification,
    };
    return NextResponse.json(body, { status: 200 });
  } catch (err) {
    return errorResponse(
      err instanceof Error ? err.message : "Design render generation failed.",
      err instanceof Error && /render/i.test(err.message)
        ? "render_failed"
        : "unknown",
      500,
    );
  }
}
