import { z } from "zod";
import {
  type ProductType,
  type UserDesignIntent,
  containsCulturalClaims,
} from "./intent-types";
import { type InterviewLabels, buildRuleUserContext } from "./engine";
import { STAGE0_INTENT_STORAGE_KEY } from "@/lib/constants/storage";
import {
  CULTURAL_VISIBILITY_OPTIONS,
  EMOTION_OPTIONS,
  OCCASION_OPTIONS,
  PRODUCT_OPTIONS,
  STYLE_OPTIONS,
  type CulturalVisibilityOption,
  type EmotionOption,
  type OccasionOption,
  type ProductOption,
  type StyleOption,
} from "@/lib/constants/preferences";

/**
 * Stage 0 → Stage 1 (Global Demand Engine) handoff。
 *
 * Stage 0 输出的 UserDesignIntent 被映射成 Stage 1 的输入信号：
 *   message（story 预填）+ productType / styles / occasion / emotions /
 *   culturalVisibility（结构化偏好芯片预填）。
 *
 * 传递通道：sessionStorage（Stage 0 与 Stage 1 同域部署，读取时即消费，
 * 保证预填只发生一次）。
 *
 * 文化护栏：intent.user_context 若命中文化断言，回退到规则模板，
 * 保证进入 Stage 1 的文本永远不包含未经溯源的文化内容。
 */

/** Stage 1 StudioForm 的预填子集（值对齐 GlobalDemandInput / 偏好芯片枚举） */
export type Stage1Prefill = {
  message: string;
  productType?: ProductOption;
  styles: StyleOption[];
  occasion?: OccasionOption;
  emotions: EmotionOption[];
  culturalVisibility?: CulturalVisibilityOption;
};

export type Stage0IntentPayload = {
  intent: UserDesignIntent;
  prefill: Stage1Prefill;
  createdAt: string;
};

/* ─── intent token → Stage 1 芯片值（仅映射两端枚举交集） ─────── */

const PRODUCT_CHIP: Partial<Record<ProductType, ProductOption>> = {
  necklace: "Necklace",
  earrings: "Earrings",
  bracelet: "Bracelet",
  ring: "Ring",
  brooch: "Brooch",
};

const OCCASION_CHIP: Partial<
  Record<UserDesignIntent["occasion"], OccasionOption>
> = {
  everyday: "Everyday",
  date: "Date",
  festival: "Festival",
  gift: "Gift",
};

const STYLE_CHIP: Partial<
  Record<UserDesignIntent["style"][number], StyleOption>
> = {
  minimal: "Minimal",
  modern: "Modern",
  vintage: "Vintage",
  luxury: "Luxury",
};

const EMOTION_CHIP: Partial<
  Record<UserDesignIntent["emotional_direction"][number], EmotionOption>
> = {
  freedom: "Freedom",
  "new-beginning": "New Beginning",
};

const VISIBILITY_CHIP: Partial<
  Record<UserDesignIntent["visual_presence"], CulturalVisibilityOption>
> = {
  subtle: "Subtle",
  balanced: "Balanced",
  strong: "Strong",
};

function mapPrefill(intent: UserDesignIntent): Stage1Prefill {
  const productKnown = intent.product_type !== "unknown";
  const occasionKnown = intent.occasion !== "unknown";

  return {
    message: intent.user_context,
    productType: productKnown
      ? (PRODUCT_CHIP[intent.product_type] ?? undefined)
      : undefined,
    styles: intent.style
      .map((token) => STYLE_CHIP[token])
      .filter((chip): chip is StyleOption => chip !== undefined),
    occasion: occasionKnown
      ? (OCCASION_CHIP[intent.occasion] ?? undefined)
      : undefined,
    emotions: intent.emotional_direction
      .map((token) => EMOTION_CHIP[token])
      .filter((chip): chip is EmotionOption => chip !== undefined),
    culturalVisibility:
      intent.visual_presence !== "unknown"
        ? (VISIBILITY_CHIP[intent.visual_presence] ?? undefined)
        : undefined,
  };
}

/**
 * 生成进入 Stage 1 的 payload（含护栏清洗）。
 * user_context 命中文化断言 → 回退规则模板（经 L 本地化），仅描述用户偏好。
 */
export function buildStage0Payload(
  intent: UserDesignIntent,
  L: InterviewLabels,
): Stage0IntentPayload {
  const safeIntent: UserDesignIntent = containsCulturalClaims(
    intent.user_context,
  )
    ? { ...intent, user_context: buildRuleUserContext(intent, L) }
    : intent;

  return {
    intent: safeIntent,
    prefill: mapPrefill(safeIntent),
    createdAt: new Date().toISOString(),
  };
}

/** 写入 sessionStorage（失败静默，如隐私模式） */
export function persistStage0Payload(payload: Stage0IntentPayload): void {
  try {
    sessionStorage.setItem(
      STAGE0_INTENT_STORAGE_KEY,
      JSON.stringify(payload),
    );
  } catch {
    // storage 不可用时访谈摘要仍保留在 Stage 0 页面，用户可手动继续
  }
}

const Stage1PrefillSchema = z.object({
  message: z.string().max(2000).default(""),
  productType: z.enum(PRODUCT_OPTIONS).optional(),
  styles: z.array(z.enum(STYLE_OPTIONS)).max(6).optional(),
  occasion: z.enum(OCCASION_OPTIONS).optional(),
  emotions: z.array(z.enum(EMOTION_OPTIONS)).max(6).optional(),
  culturalVisibility: z.enum(CULTURAL_VISIBILITY_OPTIONS).optional(),
});

const Stage0PayloadSchema = z.object({
  prefill: Stage1PrefillSchema,
});

/**
 * 读取（并消费）Stage 0 预填数据。供 Stage 1 StudioForm 挂载时调用：
 *  - payload 缺失 / 损坏 → null（Stage 1 保持空表单）
 *  - 读取成功后立即移除 storage 键，保证预填一次性生效
 */
export function readStage1Prefill(): Stage1Prefill | null {
  try {
    const raw = sessionStorage.getItem(STAGE0_INTENT_STORAGE_KEY);
    if (!raw) return null;
    sessionStorage.removeItem(STAGE0_INTENT_STORAGE_KEY);

    const parsed = Stage0PayloadSchema.safeParse(JSON.parse(raw));
    if (!parsed.success) return null;

    const p = parsed.data.prefill;
    return {
      message: p.message,
      productType: p.productType,
      styles: p.styles ?? [],
      occasion: p.occasion,
      emotions: p.emotions ?? [],
      culturalVisibility: p.culturalVisibility,
    };
  } catch {
    return null;
  }
}
