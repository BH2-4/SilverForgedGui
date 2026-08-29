/**
 * Glossary — the semantic bridge between English Design DNA tokens
 * (Stage 1 output: lowercase normalized tokens like "minimal",
 * "nature-inspired", "new-beginning") and the Chinese heritage dataset.
 *
 * HARD RULE (RULE-003 / RULE-005): this layer assigns *visual/aesthetic*
 * affinity only. It never attaches cultural meaning to a motif. Mapping
 * "nature-inspired" → 花草 is a translation of a documented visual subject,
 * not a claim that the motif "means nature".
 *
 * Everything here is a transparent, inspectable table so every score can
 * be explained with "which tokens hit which affinity".
 */

import type { GlobalDesignBrief } from "@/lib/ai/schemas";

/* -------------------------------------------------------------------------- */
/*  Brief-level derived signals                                                */
/* -------------------------------------------------------------------------- */

export interface BriefSignals {
  tokens: string[];
  /** 0 = refined/everyday, 1 = ceremonial/statement. Derived from style,
   *  complexity, size and weight — never from cultural fields. */
  ornate: number;
  /** 0 = subtle, 1 = strong. From cultural_visibility. */
  visibility: number;
  wearability: "low" | "medium" | "high" | "unknown";
}

const ORNATE_STYLE_TOKENS: Record<string, number> = {
  statement: 0.25,
  bold: 0.22,
  dramatic: 0.25,
  maximalist: 0.3,
  festival: 0.2,
  ceremonial: 0.25,
  grand: 0.22,
  ornate: 0.28,
  luxury: 0.12,
  vintage: 0.08,
  street: 0.05,
  bohemian: 0.05,
  minimal: -0.25,
  minimalist: -0.25,
  understated: -0.25,
  quiet: -0.28,
  subtle: -0.15,
  delicate: -0.2,
  refined: -0.12,
  elegant: -0.08,
  everyday: -0.15,
  modern: -0.04,
  sleek: -0.06,
};

export function deriveBriefSignals(brief: GlobalDesignBrief): BriefSignals {
  const tokens = [
    ...brief.style,
    ...brief.emotion,
    ...brief.design_keywords,
    brief.market.toLowerCase(),
    brief.occasion,
    brief.consumer_profile.toLowerCase(),
    brief.cultural_interest.toLowerCase(),
  ].map((t) => t.toLowerCase());

  let ornate = 0.5;
  for (const token of [...brief.style, ...brief.design_keywords]) {
    const shift = ORNATE_STYLE_TOKENS[token];
    if (shift !== undefined) ornate += shift;
  }
  if (brief.complexity === "high") ornate += 0.2;
  if (brief.complexity === "low") ornate -= 0.2;
  if (brief.size_preference === "large") ornate += 0.1;
  if (brief.size_preference === "small") ornate -= 0.15;
  if (brief.weight_preference === "heavy") ornate += 0.15;
  if (brief.weight_preference === "light") ornate -= 0.15;
  if (brief.occasion === "wedding" || brief.occasion === "festival") ornate += 0.12;
  ornate = Math.min(0.95, Math.max(0.05, ornate));

  const visibility =
    brief.cultural_visibility === "strong"
      ? 1
      : brief.cultural_visibility === "balanced"
        ? 0.55
        : brief.cultural_visibility === "subtle"
          ? 0.15
          : 0.5;

  return { tokens, ornate, visibility, wearability: brief.wearability };
}

/* -------------------------------------------------------------------------- */
/*  Motif visual-subject affinity                                              */
/* -------------------------------------------------------------------------- */

export interface SubjectAffinity {
  tokens: string[];
  score: number;
  gloss: string;
}

/**
 * Affinity between brief tokens and a documented visual SUBJECT.
 * Scores are aesthetic affinity, not cultural meaning.
 */
export const VISUAL_SUBJECT_AFFINITY: Record<string, SubjectAffinity[]> = {
  花草: [
    { tokens: ["nature-inspired", "nature", "botanical", "floral", "flora", "flower", "flowers", "organic", "garden", "spring", "soft", "romantic"], score: 1, gloss: "floral visual subject" },
    { tokens: ["minimal", "delicate", "elegant", "refined"], score: 0.6, gloss: "flora stylizable into a subtle motif" },
  ],
  花鸟: [
    { tokens: ["nature-inspired", "nature", "organic", "narrative", "storytelling", "poetic"], score: 1, gloss: "bird-and-flower visual subject" },
    { tokens: ["minimal", "elegant"], score: 0.6, gloss: "bird-and-flora subject, reducible to fine lines" },
  ],
  鸟雀: [
    { tokens: ["nature-inspired", "nature", "bird", "birds", "free", "freedom", "airy", "light", "flight"], score: 0.95, gloss: "bird visual subject" },
    { tokens: ["delicate", "minimal"], score: 0.6, gloss: "bird subject suited to fine silhouettes" },
  ],
  昆虫: [
    { tokens: ["nature-inspired", "nature", "insect", "insects", "whimsical", "playful", "quirky"], score: 0.9, gloss: "insect visual subject" },
  ],
  龙: [
    { tokens: ["dragon", "dragons", "bold", "statement", "dramatic", "mythical", "powerful", "strong", "street"], score: 0.9, gloss: "dragon visual subject" },
  ],
  虎: [
    { tokens: ["tiger", "tigers", "bold", "statement", "powerful", "fierce", "strong", "street"], score: 0.9, gloss: "tiger visual subject" },
  ],
  龙鱼: [
    { tokens: ["dragonfish", "dragon-fish", "fluid", "movement", "water", "organic", "curved", "nature-inspired"], score: 0.9, gloss: "dragon-fish visual subject" },
  ],
  蝴蝶: [
    { tokens: ["butterfly", "butterflies", "transformation", "soft", "romantic", "delicate", "nature-inspired", "nature", "new-beginning"], score: 0.9, gloss: "butterfly visual subject" },
  ],
};

/** Base affinity for motifs whose subject has no token overlap. */
export const MOTIF_BASE_AFFINITY = 0.35;

export function motifAffinity(
  name: string,
  tokens: string[],
): { score: number; gloss: string | null; hits: string[] } {
  const table = VISUAL_SUBJECT_AFFINITY[name];
  if (!table) return { score: MOTIF_BASE_AFFINITY, gloss: null, hits: [] };
  let best: SubjectAffinity | null = null;
  for (const entry of table) {
    if (entry.tokens.some((t) => tokens.includes(t))) {
      if (!best || entry.score > best.score) best = entry;
    }
  }
  if (best) {
    return {
      score: best.score,
      gloss: best.gloss,
      hits: best.tokens.filter((t) => tokens.includes(t)),
    };
  }
  return { score: MOTIF_BASE_AFFINITY, gloss: null, hits: [] };
}

/* -------------------------------------------------------------------------- */
/*  Craft aesthetic affinity                                                   */
/* -------------------------------------------------------------------------- */

export const CRAFT_AESTHETICS: Record<string, { tokens: string[]; score: number; gloss: string }> = {
  "熔炼/铸炼": { tokens: [], score: 0.5, gloss: "foundational smelting stage of the forging process" },
  "捶打/锤錾": { tokens: ["artisanal", "handcrafted", "textured", "organic", "rustic"], score: 0.85, gloss: "hand-hammered surface texture" },
  拉丝: { tokens: ["delicate", "fine", "light", "airy", "minimal", "filigree"], score: 1, gloss: "fine-drawn silver wire" },
  "錾花/錾刻": { tokens: ["textured", "detailed", "sculptural", "engraved", "vintage"], score: 1, gloss: "chased/engraved detail work" },
  压花: { tokens: ["textured", "pattern", "patterned", "tactile"], score: 0.9, gloss: "stamped relief patterning" },
  "编结/编花": { tokens: ["woven", "fluid", "tactile", "chain", "movement", "bohemian"], score: 0.9, gloss: "braided openwork" },
  "焊接/焊花": { tokens: ["structural", "sculptural"], score: 0.6, gloss: "assembled silver-flower construction" },
  "洗涤/洗亮": { tokens: ["polished", "bright", "clean", "minimal"], score: 0.7, gloss: "final polish and finish" },
};

/* -------------------------------------------------------------------------- */
/*  Heritage item profiles                                                     */
/* -------------------------------------------------------------------------- */

/** Ornate spectrum per documented item name (0 refined ↔ 1 ceremonial). */
export const ITEM_ORNATE: Record<string, number> = {
  银衣: 1.0,
  银凤冠: 0.95,
  银角: 0.9,
  银冠: 0.85,
  银花帽: 0.85,
  银头围: 0.8,
  银帽: 0.75,
  银雀: 0.7,
  银头花: 0.7,
  银羽: 0.7,
  银腰带: 0.7,
  背扇: 0.65,
  响铃板: 0.65,
  银梳: 0.55,
  胸锁: 0.6,
  项圈: 0.6,
  银项链: 0.45,
  银簪: 0.4,
  手镯: 0.35,
  耳环: 0.3,
};

/** Everyday-wear base score per documented category. */
export const CATEGORY_EVERYDAY: Record<string, number> = {
  耳饰: 0.95,
  手饰: 0.9,
  颈饰: 0.8,
  胸饰: 0.75,
  颈饰构件: 0.7,
  腰饰: 0.6,
  服饰配件: 0.5,
  头饰: 0.35,
  服饰整体: 0.2,
};

/** Product type → preferred item categories (documented taxonomy). */
export const PRODUCT_CATEGORY_FIT: Record<string, Record<string, number>> = {
  necklace: { 颈饰: 1, "颈饰构件": 0.8, 胸饰: 0.7, 腰饰: 0.3, 头饰: 0.15, 手饰: 0.15, 耳饰: 0.15, "服饰配件": 0.15, "服饰整体": 0.1 },
  earrings: { 耳饰: 1, 颈饰: 0.25, 手饰: 0.2, 胸饰: 0.2, 头饰: 0.2, 腰饰: 0.1, "颈饰构件": 0.2, "服饰配件": 0.1, "服饰整体": 0.1 },
  bracelet: { 手饰: 1, 颈饰: 0.3, 腰饰: 0.25, 胸饰: 0.2, 耳饰: 0.15, 头饰: 0.15, "颈饰构件": 0.2, "服饰配件": 0.15, "服饰整体": 0.1 },
  cuff: { 手饰: 1, 颈饰: 0.3, 腰饰: 0.25, 胸饰: 0.2, 耳饰: 0.15, 头饰: 0.15, "颈饰构件": 0.2, "服饰配件": 0.15, "服饰整体": 0.1 },
  ring: { 手饰: 0.85, 颈饰: 0.25, 胸饰: 0.2, 耳饰: 0.2, 腰饰: 0.15, 头饰: 0.15, "颈饰构件": 0.15, "服饰配件": 0.1, "服饰整体": 0.1 },
  pendant: { 胸饰: 0.9, 颈饰: 0.75, "颈饰构件": 0.6, 腰饰: 0.3, 手饰: 0.2, 耳饰: 0.2, 头饰: 0.15, "服饰配件": 0.15, "服饰整体": 0.1 },
  brooch: { 胸饰: 0.95, 颈饰: 0.6, "颈饰构件": 0.5, 腰饰: 0.3, 头饰: 0.25, 手饰: 0.2, 耳饰: 0.2, "服饰配件": 0.2, "服饰整体": 0.15 },
  hairpiece: { 头饰: 1, "服饰配件": 0.3, 颈饰: 0.2, 耳饰: 0.2, 胸饰: 0.15, 手饰: 0.15, 腰饰: 0.1, "颈饰构件": 0.1, "服饰整体": 0.1 },
  anklet: { 腰饰: 0.3, 颈饰: 0.3, 手饰: 0.25, 胸饰: 0.2, 耳饰: 0.15, 头饰: 0.15, "颈饰构件": 0.2, "服饰配件": 0.15, "服饰整体": 0.1 },
  unknown: { 耳饰: 0.5, 手饰: 0.5, 颈饰: 0.5, 胸饰: 0.5, 头饰: 0.5, 腰饰: 0.5, "颈饰构件": 0.5, "服饰配件": 0.5, "服饰整体": 0.5 },
};

/** Product type → documented terms for regional-style feature matching. */
export const PRODUCT_TERMS: Record<string, string[]> = {
  necklace: ["项圈", "银链", "胸锁"],
  earrings: ["耳环", "耳柱"],
  bracelet: ["手镯", "手圈"],
  cuff: ["手镯", "手圈"],
  ring: [],
  pendant: ["胸锁", "胸宝", "银链"],
  brooch: ["胸锁", "银片"],
  hairpiece: ["银角", "银雀", "银簪", "银梳", "银头围", "银头花", "银羽", "银凤冠", "银花帽", "银冠"],
  anklet: [],
  unknown: [],
};

/* -------------------------------------------------------------------------- */
/*  Region profiles (affinity heuristics, clearly AI-side)                     */
/* -------------------------------------------------------------------------- */

export const KNOWN_REGIONS = ["雷山", "台江", "剑河", "黄平"] as const;
export type KnownRegion = (typeof KNOWN_REGIONS)[number];

/**
 * Ornate spectrum and cultural-visibility affinity per documented region.
 * These are AI-side *affinity heuristics* grounded in what the official
 * data documents (雷山: headpiece system; 台江: widest variety; 剑河:
 * motif-rich with subregional variants; 黄平: flora/fauna on wearable
 * pieces). They are NOT cultural claims and are labeled as heuristics
 * in match reasons.
 */
export const REGION_PROFILE: Record<
  KnownRegion,
  { ornate: number; visibilityAffinity: Record<"low" | "medium" | "high" | "unknown", number>; character: string }
> = {
  雷山: {
    ornate: 0.85,
    visibilityAffinity: { high: 1, medium: 0.6, low: 0.3, unknown: 0.6 },
    character: "a documented ceremonial headpiece tradition",
  },
  台江: {
    ornate: 0.8,
    visibilityAffinity: { high: 0.95, medium: 0.85, low: 0.5, unknown: 0.8 },
    character: "the widest documented variety of silver forms",
  },
  剑河: {
    ornate: 0.55,
    visibilityAffinity: { high: 0.7, medium: 0.85, low: 0.85, unknown: 0.8 },
    character: "motif-rich work with documented subregional variants",
  },
  黄平: {
    ornate: 0.6,
    visibilityAffinity: { high: 0.55, medium: 0.7, low: 0.9, unknown: 0.7 },
    character: "flora-and-fauna motifs on wearable pieces",
  },
};

/** Extract the base region(s) referenced by a dataset region string. */
export function extractRegions(region: string): KnownRegion[] {
  const found: KnownRegion[] = [];
  for (const r of KNOWN_REGIONS) {
    if (region.includes(r)) found.push(r);
  }
  return found;
}

/* -------------------------------------------------------------------------- */
/*  Keyword gloss hits (for keyword_fit dimension)                            */
/* -------------------------------------------------------------------------- */

/** Item-specific keyword affinities beyond the ornate spectrum. */
export const ITEM_KEYWORDS: Record<string, { tokens: string[]; gloss: string }[]> = {
  响铃板: [
    { tokens: ["sound", "rhythm", "playful", "movement", "whimsical"], gloss: "documented sound-producing structure" },
  ],
  银衣: [
    { tokens: ["maximalist", "full-coverage", "dramatic"], gloss: "full silver-coverage garment form" },
  ],
  手镯: [
    { tokens: ["everyday", "classic", "essential"], gloss: "documented everyday wristwear category" },
  ],
  银簪: [
    { tokens: ["minimal", "essential", "everyday"], gloss: "documented refined hairpin form" },
  ],
  银梳: [
    { tokens: ["functional", "everyday"], gloss: "documented functional comb form" },
  ],
};
