import { selectProvider } from "./providers";
import type {
  GlobalDemandInput,
  GlobalDemandResult,
} from "@/lib/ai/schemas";

/**
 * Public server-side entry point for the Global Demand Engine.
 *
 * Everything in `lib/ai/` funnels through this function. Route handlers,
 * server actions, and future stages (Cultural Match) should call this
 * rather than instantiating a provider directly.
 *
 * Contract:
 *  - Never throws for model-level ambiguity — providers return a
 *    ClarificationQuestion inside the discriminated union instead.
 *  - Throws ProviderError for infrastructure failures. The API route
 *    translates those into a typed error envelope.
 *  - Returns { demoMode } so the UI can label responses honestly.
 */
export async function analyzeGlobalDemand(
  input: GlobalDemandInput,
): Promise<{ demoMode: boolean; result: GlobalDemandResult }> {
  const { provider, demoMode } = selectProvider();
  const result = await provider.analyze(input);
  return { demoMode, result };
}
