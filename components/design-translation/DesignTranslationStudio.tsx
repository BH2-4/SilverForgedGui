"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { AlertCircle, ArrowLeft, ArrowRight, RotateCcw } from "lucide-react";
import { DnaSummary } from "@/components/cultural-match/DnaSummary";
import { SectionLabel } from "@/components/shared/SectionLabel";
import { useI18n } from "@/components/i18n/I18nProvider";
import { DESIGN_TRANSLATION_STORAGE_KEY, STAGE3_BRIEF_STORAGE_KEY } from "@/lib/constants/storage";
import type { GlobalDesignBrief } from "@/lib/ai/schemas";
import { TranslationHandoffSchema } from "@/lib/design/schemas";
import type { CulturalMatchResult, GuardrailResult } from "@/lib/heritage/types";
import { CulturalDirectionPanel } from "./CulturalDirectionPanel";
import { TranslationSpecs } from "./TranslationSpecs";
import { DesignBriefPanel } from "./DesignBriefPanel";
import { ReadyToCreate } from "./ReadyToCreate";
import { OrientationPanel } from "./OrientationPanel";
import { DirectionsGallery } from "./DirectionsGallery";
import type {
  BriefApiResponse,
  DesignTranslationApiResponse,
  DirectionsApiResponse,
} from "@/types/design-translation";

const TRANSLATION_STAGE_KEYS = [
  "designTranslation.translatingStages.stage0",
  "designTranslation.translatingStages.stage1",
  "designTranslation.translatingStages.stage2",
  "designTranslation.translatingStages.stage3",
  "designTranslation.translatingStages.stage4",
] as const;

type Phase =
  | { kind: "loading" }
  | { kind: "empty" }
  | { kind: "error"; message: string; code?: string }
  | {
    kind: "explore";
    brief: GlobalDesignBrief;
    match: CulturalMatchResult | null;
    body: DirectionsApiResponse;
    refresh: number;
    selectedId: string | null;
    busy: boolean;
    showNotSureHint: boolean;
  }
  | {
    kind: "brief";
    brief: GlobalDesignBrief;
    match: CulturalMatchResult | null;
    body: BriefApiResponse;
    /** Kept so「回到方向选择」restores the exact exploration view. */
    previous: DirectionsApiResponse;
    refresh: number;
    selectedId: string | null;
  };

/** Narrow the union success payloads by their distinct members. */
function isDirectionsBody(
  body: Extract<DesignTranslationApiResponse, { success: true }>,
): body is DirectionsApiResponse {
  return "directions" in body;
}

/**
 * Design Translation studio orchestrator — Stage 3 two-step flow.
 *
 * Reads the Stage 2 → 3 hand-off from sessionStorage, then delegates every
 * design decision to the server-side engine:
 *
 *   explore step — POST { step: "directions" } → SECTION 01/02/03, the
 *   customer picks one direction (or asks for another batch);
 *   brief step   — POST { step: "brief", direction_id } → the final
 *   Design Brief, ready for Stage 4.
 *
 * The client match payload is display-only — the API re-derives all
 * cultural attributes from the knowledge base, and direction objects are
 * generated server-side, so nothing here can inject cultural claims.
 */
export function DesignTranslationStudio() {
  const { t, tApiError } = useI18n();
  const [phase, setPhase] = useState<Phase>({ kind: "loading" });
  const [stage, setStage] = useState(0);

  useEffect(() => {
    if (stage >= TRANSLATION_STAGE_KEYS.length - 1) return;
    const timer = setTimeout(() => setStage((s) => s + 1), 700);
    return () => clearTimeout(timer);
  }, [stage]);

  const post = useCallback(
    async (
      payload: Record<string, unknown>,
    ): Promise<DesignTranslationApiResponse | null> => {
      try {
        const res = await fetch("/api/design-translation", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(payload),
        });
        const body = (await res.json()) as DesignTranslationApiResponse;
        return body;
      } catch (err) {
        setPhase({
          kind: "error",
          message: err instanceof Error ? err.message : t("errors.networkError"),
          code: "network",
        });
        return null;
      }
    },
    [t],
  );

  const runDirections = useCallback(
    async (
      brief: GlobalDesignBrief,
      match: CulturalMatchResult | null,
      guardrail: GuardrailResult | undefined,
      refresh: number,
    ) => {
      setPhase({ kind: "loading" });
      const body = await post({
        designBrief: brief,
        selectedMatch: match,
        ...(guardrail ? { guardrail } : {}),
        step: "directions",
        refresh,
      });
      if (!body || !body.success || !isDirectionsBody(body)) {
        if (body && !body.success) {
          setPhase({ kind: "error", message: body.error, code: body.code });
        }
        return;
      }
      setPhase({
        kind: "explore",
        brief,
        match,
        body,
        refresh,
        selectedId: null,
        busy: false,
        showNotSureHint: false,
      });
    },
    [post],
  );

  const runBrief = useCallback(
    async (
      brief: GlobalDesignBrief,
      match: CulturalMatchResult | null,
      guardrail: GuardrailResult | undefined,
      directionId: string | null,
      previous: DirectionsApiResponse,
      refresh: number,
    ) => {
      setPhase((current) =>
        current.kind === "explore" ? { ...current, busy: true } : current,
      );
      const body = await post({
        designBrief: brief,
        selectedMatch: match,
        ...(guardrail ? { guardrail } : {}),
        step: "brief",
        ...(directionId ? { direction_id: directionId } : {}),
        refresh,
      });
      if (!body || !body.success || isDirectionsBody(body)) {
        if (body && !body.success) {
          setPhase({ kind: "error", message: body.error, code: body.code });
        }
        return;
      }
      /* Stage 3 → Stage 4 hand-off: persist the server-generated brief with
         the chosen direction id, so Stage 4 can pick it up on mount. */
      try {
        sessionStorage.setItem(
          STAGE3_BRIEF_STORAGE_KEY,
          JSON.stringify({
            designDna: brief,
            designBrief: body.design_brief,
            selectedDirectionId: body.selected_direction_id,
            verification: body.verification,
          }),
        );
      } catch {
        /* storage unavailable — Stage 4 will show its empty state */
      }
      setPhase({
        kind: "brief",
        brief,
        match,
        body,
        previous,
        refresh,
        selectedId: directionId,
      });
    },
    [post],
  );

  useEffect(() => {
    let handoff: unknown = null;
    try {
      const raw = sessionStorage.getItem(DESIGN_TRANSLATION_STORAGE_KEY);
      handoff = raw ? JSON.parse(raw) : null;
    } catch {
      handoff = null;
    }

    const parsed = TranslationHandoffSchema.safeParse(handoff);
    if (!parsed.success) {
      setPhase({ kind: "empty" });
      return;
    }
    void runDirections(
      parsed.data.designBrief,
      parsed.data.selectedMatch,
      parsed.data.guardrail,
      0,
    );
  }, [runDirections]);

  /* -------------------------  explore actions  ------------------------- */

  const handleChoose = useCallback(
    (directionId: string) => {
      if (phase.kind !== "explore") return;
      void runBrief(
        phase.brief,
        phase.match,
        undefined,
        directionId,
        phase.body,
        phase.refresh,
      );
    },
    [phase, runBrief],
  );

  const handleRefresh = useCallback(() => {
    if (phase.kind !== "explore") return;
    void runDirections(
      phase.brief,
      phase.match,
      undefined,
      phase.refresh + 1,
    );
  }, [phase, runDirections]);

  const handleNotSure = useCallback(() => {
    if (phase.kind !== "explore") return;
    setPhase({ ...phase, showNotSureHint: true });
  }, [phase]);

  const handleBackToDirections = useCallback(() => {
    if (phase.kind !== "brief") return;
    /* The persisted Stage 3 → 4 brief is no longer confirmed — drop it so
       Stage 4 can never read a direction the customer went back on. */
    try {
      sessionStorage.removeItem(STAGE3_BRIEF_STORAGE_KEY);
    } catch {
      /* storage unavailable — ignore */
    }
    setPhase({
      kind: "explore",
      brief: phase.brief,
      match: phase.match,
      body: phase.previous,
      refresh: phase.refresh,
      selectedId: phase.selectedId,
      busy: false,
      showNotSureHint: false,
    });
  }, [phase]);

  const handleRestart = useCallback(() => {
    try {
      sessionStorage.removeItem(DESIGN_TRANSLATION_STORAGE_KEY);
      sessionStorage.removeItem(STAGE3_BRIEF_STORAGE_KEY);
    } catch {
      /* storage unavailable — ignore */
    }
    setPhase({ kind: "empty" });
  }, []);

  /* ------------------------------  States  ------------------------------ */

  if (phase.kind === "loading") {
    return (
      <div className="animate-fade-in flex flex-col gap-10 py-16">
        <SectionLabel>{t("designTranslation.translatingLabel")}</SectionLabel>
        <ol className="flex flex-col gap-4">
          {TRANSLATION_STAGE_KEYS.map((key, i) => (
            <li key={key} className="flex items-center gap-5">
              <span
                className={`font-sans text-[18px] leading-[1.2] tracking-[-0.005em] sm:text-[20px] ${i <= stage
                  ? "text-[var(--color-ivory)]"
                  : "text-[var(--color-silver-600)]"
                  }`}
              >
                {t(key)}
              </span>
              {i === stage && (
                <span className="ml-auto h-px w-24 shimmer" aria-hidden />
              )}
            </li>
          ))}
        </ol>
      </div>
    );
  }

  if (phase.kind === "empty") {
    return (
      <div className="animate-fade-in flex flex-1 flex-col items-start justify-center gap-8 py-16">
        <SectionLabel>{t("designTranslation.emptyLabel")}</SectionLabel>
        <h2 className="font-sans max-w-2xl text-[28px] leading-[1.1] tracking-[-0.01em] text-[var(--color-ivory)] sm:text-[32px]">
          {t("designTranslation.emptyTitle")}
        </h2>
        <p className="max-w-md text-[14px] leading-relaxed text-[var(--color-silver-400)]">
          {t("designTranslation.emptyBody")}
        </p>
        <Link
          href="/cultural-match"
          className="group inline-flex items-center gap-3 rounded-full border border-[var(--color-line-strong)] bg-[linear-gradient(180deg,var(--color-silver-100),var(--color-silver-300))] px-7 py-3.5 text-[12px] font-medium tracking-[0.14em] text-[var(--color-bg)] uppercase transition-all duration-300 hover:brightness-105 active:scale-[0.97]"
        >
          {t("common.actions.continueToCulturalMatch")}
          <ArrowRight
            className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5"
            strokeWidth={1.5}
          />
        </Link>
      </div>
    );
  }

  if (phase.kind === "error") {
    return (
      <div className="animate-fade-in flex flex-col gap-8 py-16">
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
              {t("designTranslation.errorInterrupted")}
            </div>
            <div>{tApiError(phase.code, phase.message)}</div>
          </div>
        </div>
        <Link
          href="/cultural-match"
          className="inline-flex items-center gap-2 text-[12px] tracking-[0.14em] text-[var(--color-silver-400)] uppercase transition-colors hover:text-[var(--color-ivory)]"
        >
          <RotateCcw className="h-3.5 w-3.5" strokeWidth={1.5} />
          {t("common.actions.backToCulturalMatch")}
        </Link>
      </div>
    );
  }

  /* ---------------------  Explore (SECTION 01–03)  --------------------- */

  if (phase.kind === "explore") {
    return (
      <div className="animate-fade-in flex flex-col gap-16 pb-24">
        {/* Your Global Desire → Your Design DNA */}
        <DnaSummary brief={phase.brief} />

        {/* SECTION 01 — 你的方向 */}
        <OrientationPanel brief={phase.brief} orientation={phase.body.orientation} />

        {/* SECTION 03 — 为你生成的 3 个设计方向 */}
        <DirectionsGallery
          directions={phase.body.directions}
          selectedId={phase.selectedId}
          busy={phase.busy}
          onChoose={handleChoose}
          onRefresh={handleRefresh}
          onNotSure={handleNotSure}
        />

        {phase.showNotSureHint ? (
          <div className="glass-panel flex flex-col gap-4 rounded-[var(--radius-lg)] p-7 text-[13px] leading-relaxed text-[var(--color-silver-400)]">
            {t("designDirections.actions.notSureHint")}
            <Link
              href="/cultural-match"
              className="inline-flex items-center gap-2 text-[12px] tracking-[0.14em] text-[var(--color-silver-300)] uppercase transition-colors hover:text-[var(--color-ivory)]"
            >
              <ArrowLeft className="h-3.5 w-3.5" strokeWidth={1.5} />
              {t("common.actions.backToCulturalMatch")}
            </Link>
          </div>
        ) : null}
      </div>
    );
  }

  /* ---------------------------  Brief (final)  -------------------------- */

  const { body } = phase;

  return (
    <div className="animate-fade-in flex flex-col gap-16 pb-24">
      {/* Your Global Desire → Your Design DNA */}
      <DnaSummary brief={phase.brief} />

      {/* The direction you chose */}
      <section className="flex flex-col gap-4 border-t border-[var(--color-line)] pt-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <span className="text-[11px] tracking-[0.22em] text-[var(--color-silver-500)] uppercase">
            {t("designDirections.briefBarLabel")}
          </span>
          <button
            type="button"
            onClick={handleBackToDirections}
            className="inline-flex items-center gap-2 text-[12px] tracking-[0.14em] text-[var(--color-silver-400)] uppercase transition-colors hover:text-[var(--color-ivory)]"
          >
            <ArrowLeft className="h-3.5 w-3.5" strokeWidth={1.5} />
            {t("designDirections.backToDirections")}
          </button>
        </div>
        <p className="font-sans text-[20px] leading-[1.15] tracking-[-0.01em] text-[var(--color-ivory)]">
          {t(`designDirections.direction.name.${body.design_brief.selected_direction.tier}`)}
          <span className="ml-3 text-[14px] tracking-[0] text-[var(--color-silver-500)]">
            {body.design_brief.selected_direction.origin_match_name ??
              t("designDirections.possibilityNoEntity")}
          </span>
        </p>
      </section>

      {/* Cultural Direction → Heritage Match + Cultural Evidence + Verified Sources */}
      <CulturalDirectionPanel
        match={phase.match}
        brief={body.design_brief}
        sourceRefs={body.source_refs}
      />

      {/* DESIGN TRANSLATION — the spec grid */}
      <TranslationSpecs brief={body.design_brief} />

      {/* DESIGN BRIEF */}
      <DesignBriefPanel brief={body.design_brief} />

      {/* Ready to Create */}
      <ReadyToCreate brief={body.design_brief} onRestart={handleRestart} />
    </div>
  );
}
