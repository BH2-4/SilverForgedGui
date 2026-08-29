import {
  type EmotionToken,
  type FormToken,
  type InterviewAnswers,
  type InterviewQuestionId,
  type MaterialToken,
  type Occasion,
  type ProductType,
  type SizeLevel,
  type StyleToken,
  type UserDesignIntent,
  type VisibilityLevel,
  type WearabilityLevel,
  type WeightLevel,
} from "./intent-types";

/**
 * Stage 0 访谈引擎：题库结构 + 自适应状态机 + 规则合成。
 *
 * 设计原则（源自 Research-Triage 引导式访谈的产品思路，业务模型重写）：
 *  - 每次只问一个核心问题，视觉化卡片、短选项，零专业知识门槛。
 *  - 下一题由已答内容动态决定（确定性规则分支，而非自由文本问卷）。
 *  - 任意题目可跳过；跳过 → 字段 unknown，置信度下降。
 *  - 全程不出现任何文化符号 / 民族分类 / 地区名称。
 *  - 约 5–8 题完成：品类已知 7–8 题，品类待探索 7 题（体量题自适应省略）。
 *
 * 文案与结构分离：本文件只含题目结构（id / 模式 / 选项 id），
 * 展示文案全部来自 messages/*.json 的 interview 段（i18n 单一事实源）。
 */

/* ─── 题库（仅结构） ─────────────────────────────────────────── */

export type InterviewOption = {
  /** 选项 id（同时是 UserDesignIntent 的 token / "unsure" 探索标记） */
  id: string;
};

export type InterviewQuestion = {
  id: InterviewQuestionId;
  mode: "single" | "multiple";
  maxSelect?: number;
  /** 含「帮我探索」类选项（不算跳过，但置信度较低） */
  hasExploreOption?: boolean;
  options: InterviewOption[];
};

export const QUESTIONS: Record<InterviewQuestionId, InterviewQuestion> = {
  occasion: {
    id: "occasion",
    mode: "single",
    options: [
      { id: "everyday" },
      { id: "date" },
      { id: "festival" },
      { id: "gift" },
      { id: "formal" },
      { id: "travel" },
    ],
  },
  product_type: {
    id: "product_type",
    mode: "single",
    hasExploreOption: true,
    options: [
      { id: "necklace" },
      { id: "earrings" },
      { id: "bracelet" },
      { id: "ring" },
      { id: "brooch" },
      { id: "unsure" },
    ],
  },
  form_preference: {
    id: "form_preference",
    mode: "single",
    hasExploreOption: true,
    options: [
      { id: "geometric" },
      { id: "organic" },
      { id: "fluid" },
      { id: "symmetric" },
      { id: "sculptural" },
    ],
  },
  style: {
    id: "style",
    mode: "multiple",
    maxSelect: 2,
    options: [
      { id: "minimal" },
      { id: "modern" },
      { id: "nature" },
      { id: "vintage" },
      { id: "bold" },
      { id: "luxury" },
    ],
  },
  emotional_direction: {
    id: "emotional_direction",
    mode: "multiple",
    maxSelect: 2,
    options: [
      { id: "calm" },
      { id: "freedom" },
      { id: "strength" },
      { id: "tenderness" },
      { id: "mystery" },
      { id: "new-beginning" },
    ],
  },
  visual_presence: {
    id: "visual_presence",
    mode: "single",
    options: [{ id: "subtle" }, { id: "balanced" }, { id: "strong" }],
  },
  scale: {
    id: "scale",
    mode: "single",
    options: [{ id: "small" }, { id: "medium" }, { id: "large" }],
  },
  weight: {
    id: "weight",
    mode: "single",
    options: [{ id: "light" }, { id: "medium" }, { id: "heavy" }],
  },
  material_preference: {
    id: "material_preference",
    mode: "single",
    options: [
      { id: "polished" },
      { id: "matte" },
      { id: "oxidized" },
      { id: "mixed" },
    ],
  },
};

/* ─── 自适应流程（确定性规则分支） ───────────────────────────── */

type FlowStep = {
  id: InterviewQuestionId;
  /** 是否进入流程（仅依赖流程中更早的题目，保证剩余流程可完全确定） */
  when: (answers: InterviewAnswers) => boolean;
};

/** 产品品类是否已确定（非 unsure / 非跳过） */
function productKnown(answers: InterviewAnswers): boolean {
  const picked = answers.product_type?.[0];
  return !!picked && picked !== "unsure";
}

const FLOW: FlowStep[] = [
  { id: "occasion", when: () => true },
  { id: "product_type", when: () => true },
  // 品类待探索 → 追问形态语言，并跳过体量题（抽象品类的体量认知负担过高）
  { id: "form_preference", when: (a) => !productKnown(a) },
  { id: "style", when: () => true },
  { id: "emotional_direction", when: () => true },
  { id: "visual_presence", when: () => true },
  { id: "scale", when: (a) => productKnown(a) },
  // 小体量 + 低调 → 分量可可靠推断为轻，省去一题
  {
    id: "weight",
    when: (a) => productKnown(a) && a.scale?.[0] !== "small",
  },
  { id: "material_preference", when: () => true },
];

/** 条件依赖图：改动某题答案后需要作废的下游题目 */
const DEPENDENTS: Partial<
  Record<InterviewQuestionId, InterviewQuestionId[]>
> = {
  product_type: ["form_preference", "scale", "weight"],
  scale: ["weight"],
};

/**
 * 自适应下一题：返回下一道应问的题目；null 表示访谈完成。
 * askedIds 中已答 / 已跳过的题目不再重复。
 */
export function nextQuestionId(
  answers: InterviewAnswers,
  askedIds: ReadonlySet<InterviewQuestionId>,
): InterviewQuestionId | null {
  for (const step of FLOW) {
    if (askedIds.has(step.id)) continue;
    if (step.when(answers)) return step.id;
  }
  return null;
}

/** 当前答案下的完整流程（用于精确进度 X / N） */
export function getFlowQuestionIds(
  answers: InterviewAnswers,
): InterviewQuestionId[] {
  return FLOW.filter((step) => step.when(answers)).map((step) => step.id);
}

/**
 * 回答（或修改）某题后作废受影响的下游答案。
 * 例：把品类从「还没想好」改成「项链」→ 清空 form_preference /
 * scale / weight，流程自动重新收敛。
 */
export function invalidateDependents(
  answers: InterviewAnswers,
  changedId: InterviewQuestionId,
): InterviewAnswers {
  const next = { ...answers };
  const clear = (id: InterviewQuestionId) => {
    if (id in next) delete next[id];
    const deps = DEPENDENTS[id];
    if (deps) deps.forEach(clear);
  };
  const deps = DEPENDENTS[changedId];
  deps?.forEach(clear);
  return next;
}

/* ─── i18n 标签源（文案注入，单一事实源在 messages/*.json） ──── */

export type TranslateFn = (
  key: string,
  vars?: Record<string, string | number>,
) => string;

export interface InterviewLabels {
  /** interview.* 文案模板 */
  t: TranslateFn;
  /** interview.values.<category>.<token> 词条；缺失时回退 token 本身 */
  v: (category: string, token: string) => string;
}

/** 用任意 translate 函数构造标签源（客户端 useI18n / 服务端 translate 均可） */
export function makeInterviewLabels(t: TranslateFn): InterviewLabels {
  return {
    t,
    v: (category, token) => {
      const key = `interview.values.${category}.${token}`;
      const label = t(key);
      return label === key ? token : label;
    },
  };
}

/* ─── 规则合成 UserDesignIntent ──────────────────────────────── */

function pick<T extends string>(answer: string[] | null | undefined): T | null {
  const first = answer?.[0];
  return first ? (first as T) : null;
}

function pickMany<T extends string>(
  answer: string[] | null | undefined,
): T[] {
  return (answer ?? []) as T[];
}

/** 由场景 + 存在感推导佩戴舒适度（Stage 1 wearability 对齐） */
export function inferWearability(
  occasion: Occasion,
  visualPresence: VisibilityLevel,
): WearabilityLevel {
  if (occasion === "unknown") return "unknown";
  if (occasion === "everyday") return "high";
  if (occasion === "festival" && visualPresence === "strong") return "low";
  if (occasion === "formal" && visualPresence === "strong") return "low";
  return "medium";
}

function joinLabels(
  tokens: string[],
  labelOf: (token: string) => string,
  separator: string,
): string {
  return tokens.map(labelOf).join(separator);
}

/** 规则模板 user_context（AI 不可用 / 校验失败时的兜底，文案经 i18n 注入） */
export function buildRuleUserContext(
  intent: Omit<UserDesignIntent, "user_context" | "confidence">,
  L: InterviewLabels,
): string {
  const sep = L.t("interview.ruleContext.separator");
  const parts: string[] = [];

  if (intent.product_type === "unknown") {
    parts.push(L.t("interview.ruleContext.productUnknown"));
  } else {
    parts.push(
      L.t("interview.ruleContext.productKnown", {
        occasion: L.v("occasion", intent.occasion),
        product: L.v("product", intent.product_type),
      }),
    );
  }
  if (intent.style.length > 0) {
    parts.push(
      L.t("interview.ruleContext.style", {
        styles: joinLabels(intent.style, (s) => L.v("style", s), sep),
      }),
    );
  }
  if (intent.emotional_direction.length > 0) {
    parts.push(
      L.t("interview.ruleContext.emotion", {
        emotions: joinLabels(
          intent.emotional_direction,
          (e) => L.v("emotion", e),
          sep,
        ),
      }),
    );
  }
  if (intent.visual_presence !== "unknown") {
    parts.push(
      L.t("interview.ruleContext.visibility", {
        visibility: L.v("visibility", intent.visual_presence),
      }),
    );
  }
  if (intent.scale !== "unknown" && intent.weight !== "unknown") {
    parts.push(
      L.t("interview.ruleContext.scaleWeight", {
        scale: L.v("size", intent.scale),
        weight: L.v("weight", intent.weight),
      }),
    );
  } else if (intent.scale !== "unknown") {
    parts.push(
      L.t("interview.ruleContext.scaleOnly", {
        scale: L.v("size", intent.scale),
      }),
    );
  } else if (intent.form_preference.length > 0) {
    parts.push(
      L.t("interview.ruleContext.form", {
        forms: joinLabels(intent.form_preference, (f) => L.v("form", f), sep),
      }),
    );
  }
  if (intent.material_preference.length > 0) {
    parts.push(
      L.t("interview.ruleContext.material", {
        materials: joinLabels(
          intent.material_preference,
          (m) => L.v("material", m),
          sep,
        ),
      }),
    );
  }
  if (intent.wearability === "high") {
    parts.push(L.t("interview.ruleContext.wearabilityHigh"));
  }
  if (parts.length === 0) return L.t("interview.ruleContext.fallback");
  return `${parts.join(sep)}。`;
}

/**
 * 字段级置信度：
 *  - 明确单选 1.0 / 多选 0.9 / 探索选项 0.35
 *  - 推导字段 0.7（wearability、weight 由 scale 推导）
 *  - 跳过或未问 0.25
 */
function fieldConfidence(
  answer: string[] | null | undefined,
  question: InterviewQuestion,
): number {
  if (answer === null) return 0.25; // 明确跳过
  if (!answer || answer.length === 0) return 0.25; // 未问 / 未答
  if (answer[0] === "unsure") return 0.35;
  return question.mode === "multiple" ? 0.9 : 1.0;
}

/**
 * 确定性合成：答案 → UserDesignIntent（枚举字段闭合，永不失败）。
 * L 仅用于 user_context 的文案（规则模板走 i18n）。
 */
export function buildUserDesignIntent(
  answers: InterviewAnswers,
  L: InterviewLabels,
): UserDesignIntent {
  const occasion = pick<Occasion>(answers.occasion) ?? "unknown";
  const productPick = pick(answers.product_type);
  const product_type: ProductType =
    !productPick || productPick === "unsure"
      ? "unknown"
      : (productPick as ProductType);
  const style = pickMany<StyleToken>(answers.style);
  const emotional_direction = pickMany<EmotionToken>(
    answers.emotional_direction,
  );
  const visual_presence =
    pick<VisibilityLevel>(answers.visual_presence) ?? "unknown";

  const wearability = inferWearability(occasion, visual_presence);

  const scale = pick<SizeLevel>(answers.scale) ?? "unknown";
  // 自适应推导：小体量 → 轻；品类未知 / 未问体量 → unknown
  const weight: WeightLevel =
    pick<WeightLevel>(answers.weight) ??
    (scale === "small" ? "light" : "unknown");

  const material_preference = pickMany<MaterialToken>(
    answers.material_preference,
  );
  const form_preference = pickMany<FormToken>(answers.form_preference);

  const base = {
    occasion,
    product_type,
    style,
    emotional_direction,
    visual_presence,
    wearability,
    scale,
    weight,
    material_preference,
    form_preference,
  };

  // 置信度：字段级加权（wearability / 推导 weight 按推导值 0.7 计）
  const confidences: number[] = [
    fieldConfidence(answers.occasion, QUESTIONS.occasion),
    fieldConfidence(answers.product_type, QUESTIONS.product_type),
    fieldConfidence(answers.style, QUESTIONS.style),
    fieldConfidence(
      answers.emotional_direction,
      QUESTIONS.emotional_direction,
    ),
    fieldConfidence(answers.visual_presence, QUESTIONS.visual_presence),
    fieldConfidence(
      answers.material_preference,
      QUESTIONS.material_preference,
    ),
  ];
  confidences.push(
    scale === "unknown" ? 0.25 : fieldConfidence(answers.scale, QUESTIONS.scale),
  );
  confidences.push(
    answers.weight
      ? fieldConfidence(answers.weight, QUESTIONS.weight)
      : weight === "light"
        ? 0.7
        : 0.25,
  );
  confidences.push(wearability === "unknown" ? 0.25 : 0.7);
  if (form_preference.length > 0 || answers.form_preference !== undefined) {
    confidences.push(
      fieldConfidence(answers.form_preference, QUESTIONS.form_preference),
    );
  }

  const confidence =
    Math.round(
      (confidences.reduce((sum, c) => sum + c, 0) / confidences.length) *
      100,
    ) / 100;

  return {
    ...base,
    user_context: buildRuleUserContext(base, L),
    confidence,
  };
}

/* ─── AI user_context 合成提示词（严格文化护栏） ─────────────── */

export const INTENT_SYNTHESIS_SYSTEM_PROMPT = `你是 Silver Forged Gui 银饰定制平台 Stage 0「引导式设计访谈」的意图合成器。

你会收到一位普通消费者的访谈答案（JSON，字段为品类/场景/风格/情绪/存在感/体量/质感等偏好选择），以及指定的输出语言。

你的唯一任务：将答案合成为一句自然、克制、有编辑感的句子（user_context），描述这位用户的设计偏好画像。

严格规则：
1. 只描述用户偏好本身（场合、品类、风格、情绪、存在感、体量、质感），不得出现任何文化符号、民族名称、地区名称、纹样名称。
2. 禁止提及：龙、蝴蝶、苗、图腾、贵州、台江、剑河、雷山、银角、银冠、牛角、纹样等任何文化相关词。
3. 禁止解释任何符号的象征意义或文化含义。
4. 禁止编造答案中没有的偏好。
5. 使用指定的输出语言，长度约 40–120 字（或等效），一至两句，以句号结尾。
6. 只输出 JSON 对象：{"user_context": "..."}，不要输出任何其他文本。`;

/** locale → AI 输出语言名（注入用户消息） */
export const OUTPUT_LANGUAGE_NAMES: Record<string, string> = {
  "zh-CN": "简体中文",
  en: "English",
  ja: "日本語",
  fr: "Français",
};
