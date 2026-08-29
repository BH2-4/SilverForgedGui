import { NextResponse } from "next/server";
import { z } from "zod";
import Anthropic from "@anthropic-ai/sdk";
import {
  getAiMaxTokens,
  getAiModel,
  getAiTimeoutMs,
  getAnthropicApiKey,
  isDemoMode,
} from "@/lib/env";
import {
  INTENT_SYNTHESIS_SYSTEM_PROMPT,
  OUTPUT_LANGUAGE_NAMES,
  buildUserDesignIntent,
  makeInterviewLabels,
} from "@/lib/design-interview/engine";
import { translate } from "@/lib/i18n/dictionaries";
import { resolveLocale } from "@/lib/i18n/server";
import {
  InterviewAnswersSchema,
  UserDesignIntentSchema,
  containsCulturalClaims,
} from "@/lib/design-interview/intent-types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const RequestBodySchema = z.object({
  answers: InterviewAnswersSchema,
});

const AiContextSchema = z.object({
  user_context: z.string().min(1).max(400),
});

/** Anthropic 返回块 → 纯文本 */
function extractText(blocks: Anthropic.ContentBlock[]): string {
  return blocks
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("\n")
    .trim();
}

/** 宽容提取首个顶层 JSON 对象（与 anthropic provider 同策略） */
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

/**
 * Stage 0 API：POST /api/design-intent
 *
 * 输入：访谈答案（选项 id 数组 / null）。
 * 输出：{ intent: UserDesignIntent, source: "ai" | "rule" }。
 *
 * 合成策略：
 *  1. 规则引擎先确定性生成完整 intent（枚举字段全部闭合，永不失败）。
 *  2. AI 仅润色 user_context 一句话，输出经文化护栏校验——命中文化
 *     断言（民族 / 地区 / 符号 / 象征性断言）即回退规则模板。
 *  3. Demo Mode / AI 失败 → 直接返回规则合成结果，访谈永远可完成。
 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: { code: "invalid_input", message: "请求体不是合法 JSON" } },
      { status: 400 },
    );
  }

  const parsed = RequestBodySchema.safeParse(body);
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];
    const path = firstIssue?.path.join(".") || "<root>";
    return NextResponse.json(
      {
        error: {
          code: "invalid_input",
          message: `answers 格式不正确（${path}: ${firstIssue?.message ?? "未知校验错误"}）`,
        },
      },
      { status: 400 },
    );
  }

  const answers = parsed.data.answers;
  // locale 与页面渲染同一解析规则（cookie → Accept-Language → 默认），
  // 保证规则模板 user_context 的语言与 UI 一致
  const locale = await resolveLocale();
  const L = makeInterviewLabels((key, vars) => translate(locale, key, vars));
  const baseIntent = buildUserDesignIntent(answers, L);

  if (isDemoMode()) {
    return NextResponse.json({ intent: baseIntent, source: "rule" as const });
  }

  const apiKey = getAnthropicApiKey();
  if (!apiKey) {
    return NextResponse.json({ intent: baseIntent, source: "rule" as const });
  }

  // AI 润色 user_context（其余字段由规则引擎闭合，不接受 AI 修改）
  try {
    const client = new Anthropic({
      apiKey,
      timeout: getAiTimeoutMs(),
      maxRetries: 1,
    });

    const response = await client.messages.create({
      model: getAiModel(),
      max_tokens: getAiMaxTokens(),
      system: INTENT_SYNTHESIS_SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: `访谈答案（JSON）：${JSON.stringify(answers)}\n输出语言：${OUTPUT_LANGUAGE_NAMES[locale] ?? "简体中文"}`,
        },
      ],
    });

    const raw = extractText(response.content);
    const jsonSlice = firstJsonObject(raw);
    if (!jsonSlice) throw new Error("响应中未找到 JSON");

    const { user_context } = AiContextSchema.parse(JSON.parse(jsonSlice));

    // 文化护栏：命中即回退规则模板
    const safeContext = containsCulturalClaims(user_context)
      ? baseIntent.user_context
      : user_context;

    const finalIntent = UserDesignIntentSchema.parse({
      ...baseIntent,
      user_context: safeContext,
    });

    return NextResponse.json({
      intent: finalIntent,
      source: "ai" as const,
    });
  } catch {
    // AI 不可用 / 超时 / 输出非法 → 规则兜底
    return NextResponse.json({ intent: baseIntent, source: "rule" as const });
  }
}
