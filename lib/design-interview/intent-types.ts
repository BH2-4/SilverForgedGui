import { z } from "zod";

/**
 * Stage 0 — Guided Design Interview 类型定义。
 *
 * 核心约束：
 *  - Stage 0 只负责理解「用户偏好」，输出结构化 UserDesignIntent。
 *  - 绝对不允许生成任何文化事实、民族文化含义、象征意义或未经来源
 *    验证的文化解释。枚举与词条中不包含任何文化符号（龙、蝴蝶、
 *    台江/剑河/雷山等），文化匹配完全交由 Stage 2 的溯源知识库完成。
 *  - 封闭枚举与 Stage 1（Global Demand Engine）的 GlobalDesignBrief /
 *    GlobalDemandInput 枚举对齐，保证 handoff 映射是纯类型安全的
 *    （见 lib/design-interview/handoff.ts）。
 */

/* ─── 封闭枚举（与 Stage 1 对齐） ─────────────────────────────── */

export const OCCASIONS = [
    "everyday",
    "date",
    "festival",
    "gift",
    "formal",
    "travel",
    "unknown",
] as const;

export const PRODUCT_TYPES = [
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

export const VISIBILITY_LEVELS = [
    "subtle",
    "balanced",
    "strong",
    "unknown",
] as const;

export const WEARABILITY_LEVELS = [
    "low",
    "medium",
    "high",
    "unknown",
] as const;

export const SIZES = ["small", "medium", "large", "unknown"] as const;
export const WEIGHTS = ["light", "medium", "heavy", "unknown"] as const;

/* ─── 偏好词条（消费者语言 → 规范 token） ────────────────────── */

export const STYLE_TOKENS = [
    "minimal",
    "modern",
    "nature",
    "vintage",
    "bold",
    "luxury",
] as const;

export const EMOTION_TOKENS = [
    "calm",
    "freedom",
    "strength",
    "tenderness",
    "mystery",
    "new-beginning",
] as const;

export const MATERIAL_TOKENS = [
    "polished",
    "matte",
    "oxidized",
    "mixed",
] as const;

export const FORM_TOKENS = [
    "geometric",
    "organic",
    "fluid",
    "symmetric",
    "sculptural",
] as const;

export type Occasion = (typeof OCCASIONS)[number];
export type ProductType = (typeof PRODUCT_TYPES)[number];
export type VisibilityLevel = (typeof VISIBILITY_LEVELS)[number];
export type WearabilityLevel = (typeof WEARABILITY_LEVELS)[number];
export type SizeLevel = (typeof SIZES)[number];
export type WeightLevel = (typeof WEIGHTS)[number];
export type StyleToken = (typeof STYLE_TOKENS)[number];
export type EmotionToken = (typeof EMOTION_TOKENS)[number];
export type MaterialToken = (typeof MATERIAL_TOKENS)[number];
export type FormToken = (typeof FORM_TOKENS)[number];

/* ─── UserDesignIntent Schema ────────────────────────────────── */

export const UserDesignIntentSchema = z.object({
    /** 主要佩戴场景 */
    occasion: z.enum(OCCASIONS),
    /** 产品品类（用户不确定时为 unknown，交由后续阶段收敛） */
    product_type: z.enum(PRODUCT_TYPES),
    /** 审美风格偏好（规范 token，≤2） */
    style: z.array(z.enum(STYLE_TOKENS)).max(2),
    /** 情绪方向（规范 token，≤2） */
    emotional_direction: z.array(z.enum(EMOTION_TOKENS)).max(2),
    /** 视觉存在感（映射 Stage 1 culturalVisibility） */
    visual_presence: z.enum(VISIBILITY_LEVELS),
    /** 佩戴舒适度 / 日常可戴性（由场景与存在感推导） */
    wearability: z.enum(WEARABILITY_LEVELS),
    /** 偏好体量 */
    scale: z.enum(SIZES),
    /** 偏好分量 */
    weight: z.enum(WEIGHTS),
    /** 银材质质感偏好（≤2） */
    material_preference: z.array(z.enum(MATERIAL_TOKENS)).max(2),
    /** 形态语言偏好（仅当用户不确定品类时询问） */
    form_preference: z.array(z.enum(FORM_TOKENS)).max(2),
    /** 一句话用户偏好画像（仅描述用户，禁止任何文化内容） */
    user_context: z.string().min(1).max(200),
    /** 综合置信度 0–1（由字段级置信度加权平均） */
    confidence: z.number().min(0).max(1),
});

export type UserDesignIntent = z.infer<typeof UserDesignIntentSchema>;

/* ─── 访谈答案协议（API 边界） ───────────────────────────────── */

/** 访谈题目 ID，即 UserDesignIntent 的来源字段 */
export type InterviewQuestionId =
    | "occasion"
    | "product_type"
    | "form_preference"
    | "style"
    | "emotional_direction"
    | "visual_presence"
    | "scale"
    | "weight"
    | "material_preference";

/**
 * 答案 = 选题 id 数组；null 表示「跳过 / 不确定」。
 * （单选题恰好 1 项；多选题 ≤ maxSelect 项。）
 */
export type InterviewAnswers = Partial<
    Record<InterviewQuestionId, string[] | null>
>;

export const InterviewAnswersSchema = z.record(
    z.string().max(40),
    z.union([z.array(z.string().max(40)).max(3), z.null()]),
);

/** API 响应：intent + 合成来源（ai = AI 润色 user_context / rule = 纯规则） */
export type DesignIntentResponse = {
    intent: UserDesignIntent;
    source: "ai" | "rule";
};

/* ─── 文化护栏：Stage 0 全链路禁用文化断言 ───────────────────── */

/**
 * Stage 0 任何生成文本（AI 的 user_context、handoff message）都不得
 * 包含文化符号、民族、地区或象征性断言。命中即降级为规则模板。
 */
const CULTURAL_CLAIM_PATTERNS: RegExp[] = [
    // 民族与地区
    /苗(?!条)/,
    /民族/,
    /少数族群/,
    /贵州/,
    /黔东/,
    /台江/,
    /剑河/,
    /雷山/,
    /西江/,
    /凯里/,
    // 文化符号与纹样
    /龙/,
    /蝴蝶/,
    /图腾/,
    /银角/,
    /银冠/,
    /银衣/,
    /牛角/,
    /纹样/,
    /miao/i,
    /dragon/i,
    /butterfly/i,
    /totem/i,
    /guizhou/i,
    /ethnic/i,
    /minorit(y|ies)/i,
    /motif/i,
    // 象征性断言
    /象征/,
    /寓意/,
    /代表.{0,6}(文化|传统|民族)/,
    /symboliz/i,
];

/** 检测文本是否含未经溯源的文化断言（用于 AI 输出后置校验） */
export function containsCulturalClaims(text: string): boolean {
    return CULTURAL_CLAIM_PATTERNS.some((pattern) => pattern.test(text));
}

/*
 * 展示文案（题目、选项、词条、规则模板）全部位于 messages/*.json 的
 * interview 段——见 lib/design-interview/engine.ts 的 makeInterviewLabels。
 */
