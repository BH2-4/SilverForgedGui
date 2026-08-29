import { isDemoMode } from "@/lib/env";
import { demoProvider } from "./demo";
import { createAnthropicProvider } from "./anthropic";
import type { DemandProvider } from "./types";

/**
 * Provider selector.
 *
 * Priority:
 *   1. Demo Mode (explicit `DEMO_MODE=true` OR missing key) → demoProvider.
 *   2. Anthropic provider (real model).
 *
 * Future providers (OpenAI, DeepSeek, Gemini) plug in here without any
 * change to the API route or the UI. Each new adapter must satisfy the
 * `DemandProvider` interface from `./types`.
 */
export function selectProvider(): {
  provider: DemandProvider;
  demoMode: boolean;
} {
  if (isDemoMode()) {
    return { provider: demoProvider, demoMode: true };
  }
  return { provider: createAnthropicProvider(), demoMode: false };
}
