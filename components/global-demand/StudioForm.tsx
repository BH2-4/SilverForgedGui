"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, ArrowRight } from "lucide-react";
import { DESIGN_BRIEF_STORAGE_KEY } from "@/lib/constants/storage";
import { readStage1Prefill } from "@/lib/design-interview/handoff";
import { useI18n } from "@/components/i18n/I18nProvider";
import { NaturalLanguageInput } from "./NaturalLanguageInput";
import {
  StructuredPreferences,
  type StructuredPreferencesValue,
} from "./StructuredPreferences";
import { InspirationUpload, type InspirationImage } from "./InspirationUpload";
import { ProcessingState } from "./ProcessingState";
import { ClarificationDialog } from "./ClarificationDialog";
import { DesignBriefResult } from "./DesignBriefResult";
import type {
  ClarificationQuestion,
  ConversationTurn,
  GlobalDemandInput,
  GlobalDesignBrief,
} from "@/lib/ai/schemas";
import type { GlobalDemandApiResponse } from "@/types/global-demand";

interface StudioFormProps {
  demoMode: boolean;
}

type Phase =
  | { kind: "idle" }
  | { kind: "processing" }
  | { kind: "clarification"; question: ClarificationQuestion }
  | { kind: "result"; brief: GlobalDesignBrief }
  | {
    kind: "error";
    message: string;
    /** API error code — mapped to a localized message at render time. */
    code?: string;
  };

const EMPTY_PREFS: StructuredPreferencesValue = {
  product: null,
  styles: [],
  occasion: null,
  emotions: [],
  culturalVisibility: null,
};

/**
 * State-machine orchestrator for the Global Demand Engine.
 *
 * Phases:
 *   idle          → user editing inputs
 *   processing    → POST /api/global-demand/analyze in flight
 *   clarification → API returned a ClarificationQuestion; wait for chip choice
 *   result        → API returned a completed brief; render DesignBriefResult
 *   error         → surfaced API error, retryable
 *
 * `history` accumulates the user's clarification answers so the model
 * (or Demo heuristic) can compound signal across turns without a DB.
 */
export function StudioForm({ demoMode }: StudioFormProps) {
  const router = useRouter();
  const { t, tApiError } = useI18n();
  const [story, setStory] = useState("");
  const [prefs, setPrefs] = useState<StructuredPreferencesValue>(EMPTY_PREFS);
  const [image, setImage] = useState<InspirationImage | null>(null);
  const [history, setHistory] = useState<ConversationTurn[]>([]);
  const [phase, setPhase] = useState<Phase>({ kind: "idle" });

  /**
   * Stage 0 hand-off：挂载后一次性读取引导式访谈的 UserDesignIntent
   * 预填（read-once：readStage1Prefill 成功后即消费 storage 键）。
   * 仅当表单仍为空时应用，保证不覆盖用户已有输入；useEffect 时机
   * 也避免了 SSR 阶段访问 sessionStorage 导致的 hydration 不一致。
   */
  useEffect(() => {
    const prefill = readStage1Prefill();
    if (!prefill) return;
    setStory((prev) => (prev.trim().length === 0 ? prefill.message : prev));
    setPrefs((prev) => {
      const untouched =
        prev.product === null &&
        prev.styles.length === 0 &&
        prev.occasion === null &&
        prev.emotions.length === 0 &&
        prev.culturalVisibility === null;
      return untouched
        ? {
          product: prefill.productType ?? null,
          styles: prefill.styles,
          occasion: prefill.occasion ?? null,
          emotions: prefill.emotions,
          culturalVisibility: prefill.culturalVisibility ?? null,
        }
        : prev;
    });
  }, []);

  const hasInput = useMemo(() => {
    return (
      story.trim().length > 0 ||
      prefs.product !== null ||
      prefs.styles.length > 0 ||
      prefs.occasion !== null ||
      prefs.emotions.length > 0 ||
      prefs.culturalVisibility !== null ||
      image !== null
    );
  }, [story, prefs, image]);

  const buildPayload = useCallback(
    (extraHistory: ConversationTurn[]): GlobalDemandInput => ({
      message: story,
      productType: prefs.product ?? undefined,
      styles: prefs.styles,
      occasion: prefs.occasion ?? undefined,
      emotions: prefs.emotions,
      culturalVisibility: prefs.culturalVisibility ?? undefined,
      image: image
        ? { name: image.name, type: image.type, size: image.size }
        : undefined,
      // Actual pixels — the vision analysis reads the image itself.
      imageData: image ? image.dataUrl : undefined,
      history: extraHistory.length > 0 ? extraHistory : undefined,
    }),
    [story, prefs, image],
  );

  const runAnalyze = useCallback(
    async (nextHistory: ConversationTurn[]) => {
      setPhase({ kind: "processing" });
      try {
        const res = await fetch("/api/global-demand/analyze", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(buildPayload(nextHistory)),
        });
        const body = (await res.json()) as GlobalDemandApiResponse;
        if (!body.success) {
          setPhase({ kind: "error", message: body.error, code: body.code });
          return;
        }
        if (body.data.needs_clarification) {
          setPhase({ kind: "clarification", question: body.data });
          return;
        }
        setPhase({ kind: "result", brief: body.data.brief });
      } catch (err) {
        setPhase({
          kind: "error",
          message:
            err instanceof Error
              ? err.message
              : t("errors.networkError"),
          code: "network",
        });
      }
    },
    [buildPayload, t],
  );

  const handleSubmit = useCallback(() => {
    if (!hasInput) return;
    setHistory([]);
    void runAnalyze([]);
  }, [hasInput, runAnalyze]);

  const handleClarificationAnswer = useCallback(
    (answer: string) => {
      if (phase.kind !== "clarification") return;
      const nextHistory: ConversationTurn[] = [
        ...history,
        { role: "assistant", content: phase.question.question },
        { role: "user", content: answer },
      ];
      setHistory(nextHistory);
      void runAnalyze(nextHistory);
    },
    [history, phase, runAnalyze],
  );

  const handleReset = useCallback(() => {
    setStory("");
    setPrefs(EMPTY_PREFS);
    setImage(null);
    setHistory([]);
    setPhase({ kind: "idle" });
  }, []);

  const handleContinueToStage2 = useCallback(() => {
    if (phase.kind !== "result") return;
    try {
      sessionStorage.setItem(
        DESIGN_BRIEF_STORAGE_KEY,
        JSON.stringify(phase.brief),
      );
    } catch {
      /* storage unavailable — the match page falls back to its empty state */
    }
    router.push("/cultural-match");
  }, [phase, router]);

  /* ------------------------  Render by phase  ------------------------ */

  if (phase.kind === "processing") {
    return <ProcessingState done={false} />;
  }

  if (phase.kind === "clarification") {
    return (
      <ClarificationDialog
        question={phase.question}
        onAnswer={handleClarificationAnswer}
      />
    );
  }

  if (phase.kind === "result") {
    return (
      <DesignBriefResult
        brief={phase.brief}
        onReset={handleReset}
        onContinue={handleContinueToStage2}
      />
    );
  }

  return (
    <div className="flex flex-col gap-16 pb-24">
      <NaturalLanguageInput value={story} onChange={setStory} />

      <div className="grid grid-cols-1 gap-14 lg:grid-cols-[1fr_360px] lg:gap-10">
        <StructuredPreferences value={prefs} onChange={setPrefs} />
        <InspirationUpload value={image} onChange={setImage} />
      </div>

      {phase.kind === "error" && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-[var(--radius-md)] border border-red-500/30 bg-red-500/[0.06] p-5 text-[13px] text-red-200/90"
        >
          <AlertCircle
            className="mt-0.5 h-4 w-4 shrink-0 text-red-300/80"
            strokeWidth={1.5}
          />
          <div className="flex-1">
            <div className="mb-1 text-[12px] tracking-[0.14em] text-red-300/70 uppercase">
              {t("errors.analysisInterrupted")}
            </div>
            <div>{tApiError(phase.code, phase.message)}</div>
          </div>
        </div>
      )}

      <div className="flex flex-col items-start gap-6 border-t border-[var(--color-line)] pt-10 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!hasInput}
          data-variant="solid"
          className="journey-cta"
        >
          {t("common.actions.understandMyStory")}
          <ArrowRight className="h-4 w-4" strokeWidth={1.5} />
        </button>
      </div>
    </div>
  );
}
