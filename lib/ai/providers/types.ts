import type {
  GlobalDemandInput,
  GlobalDemandResult,
} from "@/lib/ai/schemas";

/**
 * Uniform contract every provider (Demo, Anthropic, and any future
 * OpenAI/Gemini/DeepSeek adapter) must implement.
 *
 * A provider takes a structured user input plus a conversation history
 * (populated by the clarification flow) and returns either a completed
 * GlobalDesignBrief or a ClarificationQuestion — as a single tagged union.
 *
 * Providers MUST NOT throw on model-level ambiguity; they should return
 * a clarification instead. They MAY throw on infrastructure errors
 * (network, auth, timeout) — the API route translates those into a
 * typed error envelope.
 */
export interface DemandProvider {
  readonly id: "demo" | "anthropic" | (string & {});
  analyze(input: GlobalDemandInput): Promise<GlobalDemandResult>;
}

/** Thrown by providers when a hard error should surface to the client. */
export class ProviderError extends Error {
  code: "invalid_input" | "provider_error" | "timeout" | "rate_limited" | "unknown";
  constructor(message: string, code: ProviderError["code"] = "provider_error") {
    super(message);
    this.name = "ProviderError";
    this.code = code;
  }
}
