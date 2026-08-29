"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  type DesignIntentResponse,
  type InterviewAnswers,
  type InterviewQuestionId,
  type UserDesignIntent,
} from "@/lib/design-interview/intent-types";
import {
  QUESTIONS,
  buildUserDesignIntent,
  getFlowQuestionIds,
  invalidateDependents,
  makeInterviewLabels,
  nextQuestionId,
} from "@/lib/design-interview/engine";
import {
  buildStage0Payload,
  persistStage0Payload,
} from "@/lib/design-interview/handoff";
import { useI18n } from "@/components/i18n/I18nProvider";
import { QuestionCard } from "./QuestionCard";
import { IntentSummary } from "./IntentSummary";

interface InterviewFlowProps {
  demoMode: boolean;
}

type Phase =
  | { kind: "interview" }
  | { kind: "synthesizing" }
  | { kind: "summary"; intent: UserDesignIntent; source: "ai" | "rule" };

/**
 * Stage 0 访谈状态机：
 *
 *   interview → (流程问完) → synthesizing → summary → (handoff) Stage 1
 *
 *  - answers     已确认的答案（null = 跳过）
 *  - askedOrder  已问题目序列（支持逐步回退）
 *  - 下一题由 nextQuestionId(answers, asked) 自适应决定
 *  - 回退 = 弹出最后一题 + invalidateDependents 清理下游答案
 *  - API 失败时客户端规则合成兜底，访谈永远可以完成
 */
export function InterviewFlow({ demoMode }: InterviewFlowProps) {
  const router = useRouter();
  const { t } = useI18n();
  const L = useMemo(() => makeInterviewLabels(t), [t]);
  const [answers, setAnswers] = useState<InterviewAnswers>({});
  const [askedOrder, setAskedOrder] = useState<InterviewQuestionId[]>([]);
  const [phase, setPhase] = useState<Phase>({ kind: "interview" });
  const [continuing, setContinuing] = useState(false);

  const askedIds = useMemo(() => new Set(askedOrder), [askedOrder]);

  /** 当前待问题目（interview 阶段） */
  const currentId =
    phase.kind === "interview" ? nextQuestionId(answers, askedIds) : null;

  /** 当前答案下的完整流程（精确进度分母） */
  const flowIds = useMemo(() => getFlowQuestionIds(answers), [answers]);
  const progressTotal = flowIds.length;
  const progressCurrent = currentId
    ? flowIds.indexOf(currentId) + 1
    : progressTotal;
  const progressPct =
    progressTotal > 0
      ? Math.round((progressCurrent / progressTotal) * 100)
      : 0;

  const synthesize = useCallback(
    async (finalAnswers: InterviewAnswers) => {
      setPhase({ kind: "synthesizing" });
      try {
        const res = await fetch("/api/design-intent", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(finalAnswers),
        });
        if (!res.ok) throw new Error(`API ${res.status}`);
        const body = (await res.json()) as DesignIntentResponse;
        setPhase({ kind: "summary", intent: body.intent, source: body.source });
      } catch {
        // 网络 / API 不可用 → 客户端规则兜底
        const intent = buildUserDesignIntent(finalAnswers, L);
        setPhase({ kind: "summary", intent, source: "rule" });
      }
    },
    [L],
  );

  /** 确认答案（单选 / 多选确认；null = 跳过）并推进状态机 */
  const handleAnswer = useCallback(
    (id: InterviewQuestionId, value: string[] | null) => {
      const nextAnswers = { ...answers, [id]: value };
      const nextAsked = askedOrder.includes(id)
        ? askedOrder
        : [...askedOrder, id];
      setAnswers(nextAnswers);
      setAskedOrder(nextAsked);

      const next = nextQuestionId(nextAnswers, new Set(nextAsked));
      if (!next) void synthesize(nextAnswers);
    },
    [answers, askedOrder, synthesize],
  );

  /** 跳过：记录 null（置信度惩罚）并推进 */
  const handleSkip = useCallback(
    (id: InterviewQuestionId) => {
      handleAnswer(id, null);
    },
    [handleAnswer],
  );

  /** 回退一题：清空该题答案并作废受影响的下游答案 */
  const handleBack = useCallback(() => {
    if (askedOrder.length === 0 || phase.kind !== "interview") return;
    const lastId = askedOrder[askedOrder.length - 1];
    const nextAsked = askedOrder.slice(0, -1);
    const withoutLast = { ...answers };
    delete withoutLast[lastId];
    setAnswers(invalidateDependents(withoutLast, lastId));
    setAskedOrder(nextAsked);
  }, [answers, askedOrder, phase.kind]);

  const handleRestart = useCallback(() => {
    setAnswers({});
    setAskedOrder([]);
    setPhase({ kind: "interview" });
    setContinuing(false);
  }, []);

  /** Stage 1 handoff：写入 sessionStorage 后进入 /global-design */
  const handleContinue = useCallback(() => {
    if (phase.kind !== "summary") return;
    setContinuing(true);
    const payload = buildStage0Payload(phase.intent, L);
    persistStage0Payload(payload);
    router.push("/global-design");
  }, [phase, router, L]);

  const question = currentId ? QUESTIONS[currentId] : null;

  return (
    <main className="relative min-h-dvh">
      <div className="mx-auto flex min-h-dvh max-w-3xl flex-col px-6 py-8 sm:px-10 sm:py-12">
        <header className="flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <Link
              href="/"
              className="flex items-baseline gap-3 transition-opacity hover:opacity-80"
            >
              <span className="text-[13px] tracking-[0.32em] text-[var(--color-silver-200)]">
                SILVER
              </span>
              <span className="text-[13px] tracking-[0.32em] text-[var(--color-silver-400)]">
                FUTURE
              </span>
            </Link>
            <div className="flex items-center gap-4">
              {demoMode && (
                <span className="inline-flex items-center gap-2 rounded-full border border-[var(--color-line-strong)] bg-[rgba(231,226,211,0.06)] px-3 py-1 text-[10px] tracking-[0.18em] text-[var(--color-accent)] uppercase">
                  <span
                    aria-hidden
                    className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--color-accent)]"
                  />
                  {t("common.badges.demoMode")}
                </span>
              )}
              <span className="eyebrow hidden sm:inline">
                {t("interview.stageLabel")}
              </span>
            </div>
          </div>

          <div className="hairline" aria-hidden />

          <div className="flex flex-col gap-6 pt-4">
            <span className="text-[11px] tracking-[0.22em] text-[var(--color-silver-400)] uppercase">
              {t("interview.pageEyebrow")}
            </span>
            <h1 className="font-editorial text-4xl leading-[1.1] tracking-[-0.02em] text-[var(--color-ivory)] sm:text-5xl">
              {t("interview.title1")}
              <br />
              <span className="text-[var(--color-silver-400)]">
                {t("interview.title2")}
              </span>
            </h1>
            <p className="max-w-xl text-[14px] leading-relaxed text-[var(--color-silver-300)]">
              {t("interview.intro")}
            </p>
          </div>
        </header>

        {phase.kind !== "summary" && (
          <div className="mt-12 flex items-center gap-4">
            <span className="font-mono text-[11px] tracking-[0.14em] text-[var(--color-silver-400)]">
              {String(Math.min(progressCurrent, progressTotal)).padStart(2, "0")}{" "}
              / {String(progressTotal).padStart(2, "0")}
            </span>
            <div className="h-px flex-1 bg-[rgba(255,255,255,0.1)]">
              <div
                className="h-full bg-[linear-gradient(90deg,var(--color-silver-400),var(--color-silver-200))] transition-[width] duration-500"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        )}

        <div className="flex flex-1 flex-col py-12">
          {phase.kind === "interview" && question && currentId && (
            <QuestionCard
              key={currentId}
              question={question}
              step={progressCurrent}
              answers={answers}
              onAnswer={handleAnswer}
              onSkip={handleSkip}
              onBack={handleBack}
              canBack={askedOrder.length > 0}
            />
          )}

          {phase.kind === "synthesizing" && (
            <div className="animate-fade-in flex flex-1 flex-col items-center justify-center gap-6 py-20">
              <div
                className="h-7 w-7 animate-spin rounded-full border border-[rgba(255,255,255,0.14)] border-t-[var(--color-silver-300)]"
                role="status"
                aria-label={t("interview.synthesizing")}
              />
              <p className="font-editorial text-[15px] tracking-[0.06em] text-[var(--color-silver-400)]">
                {t("interview.synthesizing")}
              </p>
            </div>
          )}

          {phase.kind === "summary" && (
            <IntentSummary
              intent={phase.intent}
              source={phase.source}
              onRestart={handleRestart}
              onContinue={handleContinue}
              continuing={continuing}
            />
          )}
        </div>
      </div>
    </main>
  );
}
