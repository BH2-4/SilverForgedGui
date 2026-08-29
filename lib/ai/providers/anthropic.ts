import Anthropic from "@anthropic-ai/sdk";
import { GLOBAL_DEMAND_SYSTEM_PROMPT } from "@/lib/ai/prompts/global-demand";
import {
  GlobalDemandResultSchema,
  type GlobalDemandInput,
  type GlobalDemandResult,
} from "@/lib/ai/schemas";
import {
  getAiMaxTokens,
  getAiModel,
  getAiTimeoutMs,
  getAnthropicApiKey,
} from "@/lib/env";
import { ProviderError, type DemandProvider } from "./types";

/**
 * Anthropic-backed provider.
 *
 * Contract:
 *  - Server-side only. The API key is read via env accessors and never
 *    exposed to the client bundle.
 *  - The system prompt lives in `lib/ai/prompts/global-demand.ts`. This
 *    file only orchestrates the call and validates the response.
 *  - Response MUST be a single JSON object matching GlobalDemandResultSchema.
 *    Anything else is a ProviderError.
 *
 * Model: `AI_MODEL` env var (default `claude-opus-4-7`). Model-specific
 * knobs (adaptive thinking, effort, no `budget_tokens`, no prefill) match
 * the Claude 4.6+ family surface.
 */

function toClaudeMessages(input: GlobalDemandInput) {
  const messages: Array<{ role: "user" | "assistant"; content: string }> = [];

  // Anthropic requires the first message to be `user`. The consumer's story
  // and structured preferences are the anchor for the whole exchange, so
  // they lead. Clarification turns (which begin with an `assistant` question)
  // are appended afterwards so the conversation reads:
  //   user  → initial story + prefs
  //   assistant → clarification Q1
  //   user  → answer 1
  //   ...
  const structured: string[] = [];
  if (input.productType) structured.push(`Product: ${input.productType}`);
  if (input.styles && input.styles.length > 0)
    structured.push(`Style: ${input.styles.join(", ")}`);
  if (input.occasion) structured.push(`Occasion: ${input.occasion}`);
  if (input.emotions && input.emotions.length > 0)
    structured.push(`Emotion: ${input.emotions.join(", ")}`);
  if (input.culturalVisibility)
    structured.push(`Cultural visibility: ${input.culturalVisibility}`);
  if (input.image)
    structured.push(
      `Inspiration image attached (metadata only, not the pixels): ${input.image.name} (${input.image.type})`,
    );

  const parts: string[] = [];
  if ((input.message ?? "").trim().length > 0) {
    parts.push(`Consumer story:\n${input.message!.trim()}`);
  }
  if (structured.length > 0) {
    parts.push(`Structured preferences:\n- ${structured.join("\n- ")}`);
  }
  if (parts.length === 0) {
    parts.push(
      "The consumer has not provided a story or preferences yet. If the earlier conversation contains enough signal, produce the brief; otherwise ask one focused clarification question.",
    );
  }

  messages.push({ role: "user", content: parts.join("\n\n") });

  for (const turn of input.history ?? []) {
    messages.push({ role: turn.role, content: turn.content });
  }
  return messages;
}

function extractText(blocks: Anthropic.ContentBlock[]): string {
  return blocks
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("\n")
    .trim();
}

/** Tolerantly extract the first top-level JSON object from a string. */
function firstJsonObject(text: string): string | null {
  const start = text.indexOf("{");
  if (start === -1) return null;
  let depth = 0;
  let inString = false;
  let escape = false;
  for (let i = start; i < text.length; i++) {
    const ch = text[i];
    if (inString) {
      if (escape) escape = false;
      else if (ch === "\\") escape = true;
      else if (ch === '"') inString = false;
      continue;
    }
    if (ch === '"') inString = true;
    else if (ch === "{") depth += 1;
    else if (ch === "}") {
      depth -= 1;
      if (depth === 0) return text.slice(start, i + 1);
    }
  }
  return null;
}

export function createAnthropicProvider(): DemandProvider {
  const apiKey = getAnthropicApiKey();
  if (!apiKey) {
    throw new ProviderError(
      "ANTHROPIC_API_KEY is not configured.",
      "provider_error",
    );
  }

  // The Anthropic SDK defaults to `maxRetries: 2`, which multiplies the
  // wall-clock time by up to 3× on flaky networks. This route already
  // surfaces retryable failures (`rate_limited` / `timeout`) through a
  // typed error envelope, so we cap retries to 1 to keep worst-case UX
  // predictable while still forgiving a single transient connection blip.
  const client = new Anthropic({
    apiKey,
    timeout: getAiTimeoutMs(),
    maxRetries: 1,
  });

  return {
    id: "anthropic",
    async analyze(input: GlobalDemandInput): Promise<GlobalDemandResult> {
      const model = getAiModel();
      const maxTokens = getAiMaxTokens();

      let response: Anthropic.Message;
      try {
        response = await client.messages.create({
          model,
          max_tokens: maxTokens,
          system: [
            {
              type: "text",
              text: GLOBAL_DEMAND_SYSTEM_PROMPT,
              cache_control: { type: "ephemeral" },
            },
          ],
          thinking: { type: "adaptive" },
          output_config: { effort: "medium" },
          messages: toClaudeMessages(input),
        });
      } catch (err) {
        if (err instanceof Anthropic.APIConnectionTimeoutError) {
          throw new ProviderError("Anthropic request timed out.", "timeout");
        }
        if (err instanceof Anthropic.RateLimitError) {
          throw new ProviderError(
            "Anthropic rate limit exceeded. Try again shortly.",
            "rate_limited",
          );
        }
        if (err instanceof Anthropic.AuthenticationError) {
          throw new ProviderError(
            "Anthropic authentication failed.",
            "provider_error",
          );
        }
        if (err instanceof Anthropic.APIError) {
          throw new ProviderError(
            `Anthropic error ${err.status ?? ""}: ${err.message}`.trim(),
            "provider_error",
          );
        }
        throw new ProviderError(
          err instanceof Error ? err.message : "Unknown provider error.",
          "unknown",
        );
      }

      if (response.stop_reason === "refusal") {
        throw new ProviderError(
          "The model declined to answer this request.",
          "provider_error",
        );
      }

      const raw = extractText(response.content);
      const jsonSlice = firstJsonObject(raw);
      if (!jsonSlice) {
        throw new ProviderError(
          "Model response did not contain a JSON object.",
          "provider_error",
        );
      }

      let parsed: unknown;
      try {
        parsed = JSON.parse(jsonSlice);
      } catch {
        throw new ProviderError(
          "Model response was not valid JSON.",
          "provider_error",
        );
      }

      const result = GlobalDemandResultSchema.safeParse(parsed);
      if (!result.success) {
        throw new ProviderError(
          `Model response failed schema validation: ${result.error.issues
            .slice(0, 3)
            .map((i) => `${i.path.join(".") || "<root>"}: ${i.message}`)
            .join("; ")}`,
          "provider_error",
        );
      }

      return result.data;
    },
  };
}
