import { z } from "zod";

/**
 * Zod schemas for the Global Demand Engine.
 *
 * These are the single source of truth for AI I/O validation. Do not
 * duplicate this shape as free-form TypeScript types — always derive
 * with `z.infer<typeof ...>` (see `types/global-demand.ts`).
 *
 * Design principles:
 *  - Enum fields are closed. AI must pick from the listed values or
 *    fall back to "unknown".
 *  - Free-form fields (market, consumer_profile, design_keywords, etc.)
 *    remain open-ended so downstream stages (Cultural Match, Heritage
 *    Knowledge Base) can layer richer semantics without a breaking change.
 *  - Every field has a permissive default so a partial AI response is
 *    still parseable in Demo Mode / degraded conditions.
 */

const LMH = z.enum(["low", "medium", "high", "unknown"]);
const SIZE = z.enum(["small", "medium", "large", "unknown"]);
const WEIGHT = z.enum(["light", "medium", "heavy", "unknown"]);
const VISIBILITY = z.enum(["subtle", "balanced", "strong", "unknown"]);

/** Suggested product types. Free-form to allow future silver categories. */
const PRODUCT_TYPES = [
  "necklace",
  "earrings",
  "bracelet",
  "ring",
  "brooch",
  "pendant",
  "cuff",
  "anklet",
  "hairpiece",
  "unknown",
] as const;

const OCCASIONS = [
  "everyday",
  "date",
  "festival",
  "wedding",
  "gift",
  "formal",
  "travel",
  "unknown",
] as const;

export const GlobalDesignBriefSchema = z.object({
  market: z
    .string()
    .min(1)
    .describe(
      "Target market inferred from language, references, or explicit input. Use the country's common English name (e.g. 'United States', 'Japan', 'Singapore', 'Europe') or 'unknown'.",
    ),

  consumer_profile: z
    .string()
    .min(1)
    .describe(
      "One-sentence archetype of who the piece is for. Concise, editorial in tone. e.g. 'Young urban professional who values quiet luxury and understated symbolism.'",
    ),

  product_type: z
    .enum(PRODUCT_TYPES)
    .describe("Primary silver category the user is exploring."),

  style: z
    .array(z.string().min(1))
    .max(6)
    .describe(
      "Aesthetic descriptors — normalized lower-case tokens. e.g. ['minimal', 'modern', 'nature-inspired'].",
    ),

  occasion: z
    .enum(OCCASIONS)
    .describe("Primary wear occasion."),

  emotion: z
    .array(z.string().min(1))
    .max(6)
    .describe(
      "Emotional or narrative anchors. Normalized lower-case tokens. e.g. ['new-beginning', 'connection'].",
    ),

  cultural_interest: z
    .string()
    .describe(
      "How curious/receptive the user seems toward Guizhou/Miao heritage — a short phrase, NOT a factual claim about the culture itself. e.g. 'open to subtle cultural motifs' or 'unknown'.",
    ),

  cultural_visibility: VISIBILITY.describe(
    "How visible the cultural elements should be in the final piece.",
  ),

  wearability: LMH.describe(
    "How wearable / everyday-comfortable the piece should be.",
  ),

  complexity: LMH.describe("Design complexity the user is likely to appreciate."),

  size_preference: SIZE.describe("Preferred physical size."),

  weight_preference: WEIGHT.describe("Preferred perceived weight."),

  price_sensitivity: LMH.describe(
    "How price-sensitive the consumer appears based on language and references.",
  ),

  design_keywords: z
    .array(z.string().min(1))
    .max(10)
    .describe(
      "Short, generative keywords that a downstream design AI can use. Lower-case, no punctuation. e.g. ['minimal', 'silver', 'organic-curve'].",
    ),

  avoid: z
    .array(z.string().min(1))
    .max(10)
    .describe(
      "Directions to actively avoid. Lower-case tokens. e.g. ['heavy-ornamentation', 'gemstone-heavy'].",
    ),

  confidence: z
    .number()
    .min(0)
    .max(1)
    .describe(
      "Model's self-assessed confidence in the overall brief. 0 = fully guessing, 1 = fully grounded in explicit user input.",
    ),

  reasoning: z
    .string()
    .min(1)
    .max(600)
    .describe(
      "Concise editorial explanation of how the AI understood the user's intent. 1–3 sentences.",
    ),
});

export type GlobalDesignBrief = z.infer<typeof GlobalDesignBriefSchema>;

/**
 * Emitted when the input is too sparse for a confident brief.
 * The frontend renders `question` above `options` as tappable chips.
 */
export const ClarificationQuestionSchema = z.object({
  needs_clarification: z.literal(true),
  question: z.string().min(4).max(160),
  options: z.array(z.string().min(1).max(60)).min(2).max(6),
  /** Which brief field the answer will unlock — helps downstream logic. */
  targets: z
    .array(
      z.enum([
        "product_type",
        "style",
        "occasion",
        "emotion",
        "cultural_visibility",
        "wearability",
        "size_preference",
        "weight_preference",
        "price_sensitivity",
        "market",
      ]),
    )
    .min(1)
    .max(3),
});

export type ClarificationQuestion = z.infer<typeof ClarificationQuestionSchema>;

export const CompletedBriefSchema = z.object({
  needs_clarification: z.literal(false),
  brief: GlobalDesignBriefSchema,
});

export const GlobalDemandResultSchema = z.discriminatedUnion(
  "needs_clarification",
  [ClarificationQuestionSchema, CompletedBriefSchema],
);

export type GlobalDemandResult = z.infer<typeof GlobalDemandResultSchema>;

/* -------------------------------------------------------------------------- */
/*  Input schemas                                                              */
/* -------------------------------------------------------------------------- */

export const InspirationImageMetaSchema = z.object({
  name: z.string().min(1).max(256),
  type: z.string().min(1).max(64),
  size: z.number().int().nonnegative().max(20 * 1024 * 1024),
});

export const ConversationTurnSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1).max(4000),
});

export const GlobalDemandInputSchema = z.object({
  message: z.string().max(2000).optional().default(""),
  productType: z.string().max(40).optional(),
  styles: z.array(z.string().max(40)).max(10).optional(),
  occasion: z.string().max(40).optional(),
  emotions: z.array(z.string().max(40)).max(10).optional(),
  culturalVisibility: z.string().max(20).optional(),
  image: InspirationImageMetaSchema.optional(),
  history: z.array(ConversationTurnSchema).max(12).optional(),
});

export type GlobalDemandInput = z.infer<typeof GlobalDemandInputSchema>;
export type ConversationTurn = z.infer<typeof ConversationTurnSchema>;
export type InspirationImageMeta = z.infer<typeof InspirationImageMetaSchema>;
