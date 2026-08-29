import type { GuardrailResult } from "@/lib/heritage/types";
import type { ImagePrompt } from "@/lib/design/render-prompt";
import type { ImageProvider } from "@/lib/ai/image-generator";

/**
 * Stage 5 — /api/design-render response contract.
 *
 * Input: the CONFIRMED Stage 4 hand-off (designDna + designBrief +
 * selectedDirectionId + proposal). The proposal is re-verified against the
 * cultural guardrails server-side before any image is rendered, so a
 * tampered sessionStorage payload can never produce an image that carries
 * an upgraded or invented cultural claim.
 *
 * Output: the structured image prompt (every field traceable to the
 * proposal) + the rendered concept image + the guardrail result.
 */

/**
 * Wire shape of the rendered image — snake_case is the API convention here,
 * distinct from lib/ai/image-generator's internal camelCase result type.
 */
export interface RenderedImage {
  data_url: string;
  mime: "image/svg+xml" | "image/png";
  provider: ImageProvider;
  model: string;
  generated_at: string;
}

export type RenderApiResponse = {
  success: true;
  /** The structured prompt — the UI renders this as the "why" panel. */
  image_prompt: ImagePrompt;
  /** The rendered concept image (data URL, provider-reported). */
  image: RenderedImage;
  /** Re-verification of the proposal against RULE-001…007. */
  verification: GuardrailResult;
} | {
  success: false;
  error: string;
  code:
    | "invalid_input"
    | "inconsistent_handoff"
    | "guardrail_violation"
    | "render_failed"
    | "unknown";
};

export type { ImagePrompt };
