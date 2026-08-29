"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertCircle, ArrowRight, RotateCcw } from "lucide-react";
import { GlobalDesignBriefSchema } from "@/lib/ai/schemas";
import type { GlobalDesignBrief } from "@/lib/ai/schemas";
import { SectionLabel } from "@/components/shared/SectionLabel";
import { useI18n } from "@/components/i18n/I18nProvider";
import {
  DESIGN_BRIEF_STORAGE_KEY,
  DESIGN_TRANSLATION_STORAGE_KEY,
} from "@/lib/constants/storage";
import { DnaSummary } from "./DnaSummary";
import { HeritageDirectionCard } from "./HeritageDirectionCard";
import type { CulturalMatchApiResponse } from "@/types/cultural-match";

const MATCH_STAGE_KEYS = [
  "culturalMatch.matchingStages.stage0",
  "culturalMatch.matchingStages.stage1",
  "culturalMatch.matchingStages.stage2",
  "culturalMatch.matchingStages.stage3",
] as const;

type Phase =
  | { kind: "loading" }
  | { kind: "empty" }
  | { kind: "error"; message: string; code?: string }
  | {
    kind: "ready";
    brief: GlobalDesignBrief;
    body: Extract<CulturalMatchApiResponse, { success: true }>;
  };

/**
 * Cultural Match studio orchestrator.
 *
 * The Stage-1 brief travels via sessionStorage (no DB / no accounts in
 * V1 scope). The engine itself is deterministic and server-side; this
 * component only orchestrates fetch + render.
 */
export function CulturalMatchStudio() {
  const router = useRouter();
  const { t, tApiError } = useI18n();
  const [phase, setPhase] = useState<Phase>({ kind: "loading" });
  const [stage, setStage] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  /** Selection provenance: user pick vs. Top-1 recommended default. */
  const [selectionSource, setSelectionSource] = useState<"user" | "recommended">("recommended");

  useEffect(() => {
    if (stage >= MATCH_STAGE_KEYS.length - 1) return;
    const timer = setTimeout(() => setStage((s) => s + 1), 700);
    return () => clearTimeout(timer);
  }, [stage]);

  const runMatch = useCallback(
    async (brief: GlobalDesignBrief) => {
      try {
        const res = await fetch("/api/cultural-match", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ designBrief: brief }),
        });
        const body = (await res.json()) as CulturalMatchApiResponse;
        if (!body.success) {
          setPhase({ kind: "error", message: body.error, code: body.code });
          return;
        }
        setPhase({ kind: "ready", brief, body });
        setSelectedId(body.matches[0]?.id ?? null);
        setSelectionSource("recommended");
      } catch (err) {
        setPhase({
          kind: "error",
          message: err instanceof Error ? err.message : t("errors.networkError"),
          code: "network",
        });
      }
    },
    [t],
  );

  useEffect(() => {
    let brief: unknown = null;
    try {
      const raw = sessionStorage.getItem(DESIGN_BRIEF_STORAGE_KEY);
      brief = raw ? JSON.parse(raw) : null;
    } catch {
      brief = null;
    }

    const parsed = GlobalDesignBriefSchema.safeParse(brief);
    if (!parsed.success) {
      setPhase({ kind: "empty" });
      return;
    }
    void runMatch(parsed.data);
  }, [runMatch]);

  const handleRestart = useCallback(() => {
    try {
      sessionStorage.removeItem(DESIGN_BRIEF_STORAGE_KEY);
      sessionStorage.removeItem(DESIGN_TRANSLATION_STORAGE_KEY);
    } catch {
      /* storage unavailable — ignore */
    }
    setPhase({ kind: "empty" });
  }, []);

  /**
   * Stage 2 → Stage 3 hand-off: persist the DNA + the selected match + the
   * Stage 2 guardrail, then navigate. The match payload is only trusted for
   * its id — Stage 3 re-derives every cultural attribute server-side.
   */
  const handleContinueToTranslation = useCallback(() => {
    if (phase.kind !== "ready") return;
    const selectedMatch = phase.body.matches.find(
      (m) => m.id === selectedId,
    );
    if (!selectedMatch) return;
    try {
      sessionStorage.setItem(
        DESIGN_TRANSLATION_STORAGE_KEY,
        JSON.stringify({
          designBrief: phase.brief,
          selectedMatch,
          guardrail: phase.body.guardrail,
          selectionSource,
        }),
      );
    } catch {
      /* storage unavailable — the target page will show its empty state */
    }
    router.push("/design-translation");
  }, [phase, selectedId, selectionSource, router]);

  /* ------------------------------  States  ------------------------------ */

  if (phase.kind === "loading") {
    return (
      <div className="animate-fade-in flex flex-col gap-10 py-16">
        <SectionLabel>{t("culturalMatch.matchingLabel")}</SectionLabel>
        <ol className="flex flex-col gap-4">
          {MATCH_STAGE_KEYS.map((key, i) => (
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
        <SectionLabel>{t("culturalMatch.emptyLabel")}</SectionLabel>
        <h2 className="font-sans max-w-2xl text-[28px] leading-[1.1] tracking-[-0.01em] text-[var(--color-ivory)] sm:text-[32px]">
          {t("culturalMatch.emptyTitle")}
        </h2>
        <p className="max-w-md text-[14px] leading-relaxed text-[var(--color-silver-400)]">
          {t("culturalMatch.emptyBody")}
        </p>
        <Link
          href="/global-design"
          className="group inline-flex items-center gap-3 rounded-full border border-[var(--color-line-strong)] bg-[linear-gradient(180deg,var(--color-silver-100),var(--color-silver-300))] px-7 py-3.5 text-[12px] font-medium tracking-[0.14em] text-[var(--color-bg)] uppercase transition-all duration-300 hover:brightness-105 active:scale-[0.97]"
        >
          {t("common.actions.enterStudio")}
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
              {t("culturalMatch.errorInterrupted")}
            </div>
            <div>{tApiError(phase.code, phase.message)}</div>
          </div>
        </div>
        <Link
          href="/global-design"
          className="inline-flex items-center gap-2 text-[12px] tracking-[0.14em] text-[var(--color-silver-400)] uppercase transition-colors hover:text-[var(--color-ivory)]"
        >
          <RotateCcw className="h-3.5 w-3.5" strokeWidth={1.5} />
          {t("common.actions.backToStudio")}
        </Link>
      </div>
    );
  }

  /* -------------------------------  Ready  ------------------------------- */

  const { body } = phase;
  const selectedMatch = body.matches.find((m) => m.id === selectedId) ?? null;

  return (
    <div className="animate-fade-in flex flex-col gap-16 pb-24">
      <DnaSummary brief={phase.brief} />

      <section className="flex flex-col gap-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <SectionLabel>{t("culturalMatch.heritageDirectionsLabel")}</SectionLabel>
          <span className="text-[11px] tracking-[0.22em] text-[var(--color-silver-600)] uppercase">
            {t("culturalMatch.topOfRanked", {
              pool: body.pool_total,
              total: body.matches.length,
            })}
          </span>
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          {body.matches.map((match, i) => (
            <HeritageDirectionCard
              key={match.id}
              match={match}
              sourceRefs={body.source_refs}
              rank={i + 1}
              selection={{
                selected: selectedId === match.id,
                onSelect: () => {
                  setSelectedId(match.id);
                  setSelectionSource("user");
                },
              }}
            />
          ))}
        </div>
      </section>

      {/* Continue to Stage 3 — Design Translation */}
      <section className="flex flex-col gap-8 border-t border-[var(--color-line)] pt-12">
        {/* 相遇时刻 —— 你的故事 × 你带走的文化 */}
        <div className="match-bridge" aria-hidden>
          <span className="match-bridge-line" style={{ "--bridge-dir": "left" } as React.CSSProperties} />
          <span className="match-bridge-node" />
          <span className="match-bridge-line" />
        </div>
        <div className="flex flex-col gap-4">
          <SectionLabel>{t("culturalMatch.whatComesNextLabel")}</SectionLabel>
          <h3 className="font-sans text-[24px] leading-[1.15] tracking-[-0.01em] text-[var(--color-ivory)] sm:text-[28px]">
            {t("culturalMatch.whatComesNextTitle")}
          </h3>
          <p className="max-w-2xl text-[14px] leading-relaxed text-[var(--color-silver-300)]">
            {selectedMatch
              ? t("culturalMatch.whatComesNextBodySelected", {
                name: selectedMatch.name,
              })
              : t("culturalMatch.whatComesNextBodyNone")}
          </p>
          {selectedMatch && (
            <span className="w-fit rounded-full border border-[var(--color-line)] px-2.5 py-0.5 text-[10px] tracking-[0.16em] text-[var(--color-silver-400)] uppercase">
              {selectionSource === "user"
                ? t("culturalMatch.selectionSource.user")
                : t("culturalMatch.selectionSource.recommended")}
            </span>
          )}
        </div>
        <div className="flex flex-col gap-4 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            onClick={handleRestart}
            className="inline-flex items-center gap-2 text-[12px] tracking-[0.14em] text-[var(--color-silver-400)] uppercase transition-colors hover:text-[var(--color-ivory)]"
          >
            <RotateCcw className="h-3.5 w-3.5" strokeWidth={1.5} />
            {t("common.actions.startOver")}
          </button>
          <button
            type="button"
            disabled={!selectedMatch}
            onClick={handleContinueToTranslation}
            data-variant={selectedMatch ? "solid" : undefined}
            className="journey-cta"
          >
            {t("common.actions.continueToDesignTranslation")}
            <ArrowRight
              className="h-4 w-4"
              strokeWidth={1.5}
            />
          </button>
        </div>
        <div className="text-[11px] tracking-[0.22em] text-[var(--color-silver-600)] uppercase">
          {t("culturalMatch.stage3Available")}
        </div>
      </section>
    </div>
  );
}
