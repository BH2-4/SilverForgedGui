"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Heart,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import { SectionLabel } from "@/components/shared/SectionLabel";
import { useI18n } from "@/components/i18n/I18nProvider";
import {
  STAGE4_PROPOSAL_STORAGE_KEY,
  STAGE5_RENDER_STORAGE_KEY,
} from "@/lib/constants/storage";
import {
  ProposalHandoffSchema,
  type ProposalHandoff,
} from "@/lib/design/schemas";
import type { ImagePrompt } from "@/lib/design/render-prompt";
import type { RenderApiResponse } from "@/types/design-render";
import { PARTICLE_MODE_EVENT } from "@/components/visual/ParticleField";
import { MotionReveal } from "@/components/visual/MotionReveal";
import {
  RenderCulture,
  RenderImage,
  RenderInterpretation,
  RenderWhy,
} from "./RenderSections";

/* -------------------------------------------------------------------------- */
/*  Local state machine                                                        */
/* -------------------------------------------------------------------------- */

/**
 * Stage 5 phases — exactly the four states the spec asks for
 * (idle → generating → success → error) plus:
 *   · `empty`     — no Stage 4 hand-off in sessionStorage (fail-closed);
 *   · `confirmed` — the customer clicked「我喜欢这个设计」and the render was
 *                   frozen for the downstream customization / independent
 *                   site funnel.
 * "idle" is only a boot state — after a successful mount with a valid hand-off
 * we transition straight to "generating". Regeneration cycles success → generating → success.
 */
type SuccessBody = Extract<RenderApiResponse, { success: true }>;

type Phase =
  | { kind: "empty" }
  | { kind: "generating"; handoff: ProposalHandoff; seed: number }
  | {
    kind: "success";
    handoff: ProposalHandoff;
    seed: number;
    render: SuccessBody;
    confirmed: boolean;
  }
  | { kind: "error"; handoff: ProposalHandoff; seed: number; message: string; code?: string };

const GENERATING_STAGE_KEYS = [
  "designRender.generatingStages.stage0",
  "designRender.generatingStages.stage1",
  "designRender.generatingStages.stage2",
  "designRender.generatingStages.stage3",
] as const;

/* -------------------------------------------------------------------------- */
/*  Studio component                                                           */
/* -------------------------------------------------------------------------- */

/**
 * Stage 5 orchestrator.
 *
 * Reads the Stage 4 hand-off (proposal + brief + DNA + selected direction id)
 * from sessionStorage, calls POST /api/design-render (which re-verifies the
 * proposal against RULE-001…007 and only then renders through the image
 * provider adapter), and renders the returned concept image alongside the
 * structured prompt.
 *
 * Cultural safety is enforced entirely upstream: the client NEVER assembles
 * the prompt itself, NEVER edits it, and NEVER lets the user rewrite it.
 * 「重新生成」only varies the seed — the DesignProposal and every cultural
 * boundary stay identical.
 */
export function RenderStudio() {
  const { t, tApiError } = useI18n();
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>({ kind: "empty" });
  const [generatingStage, setGeneratingStage] = useState(0);

  /* Idle rotation for the generating animation — visual only, never a real
     progress %. Reset when we leave the generating phase. */
  useEffect(() => {
    if (phase.kind !== "generating") {
      setGeneratingStage(0);
      return;
    }
    const timer = window.setInterval(() => {
      setGeneratingStage((s) => (s + 1) % GENERATING_STAGE_KEYS.length);
    }, 900);
    return () => window.clearInterval(timer);
  }, [phase.kind]);

  /* Stage 6 · Round 2+4 — broadcast the current phase to the global
     particle layer via a one-way CustomEvent. Zero business coupling:
     the visual layer subscribes; if it isn't mounted, nothing changes.
     Confirmed success → "confirmed" (locked/held), plain success is idle,
     error dispatches the "error" mode for a subtle nervous jitter. */
  useEffect(() => {
    if (typeof window === "undefined") return;
    let particleMode: "idle" | "generating" | "error" | "confirmed" = "idle";
    if (phase.kind === "generating") particleMode = "generating";
    else if (phase.kind === "error") particleMode = "error";
    else if (phase.kind === "success" && phase.confirmed) particleMode = "confirmed";
    window.dispatchEvent(
      new CustomEvent(PARTICLE_MODE_EVENT, { detail: { mode: particleMode } }),
    );
  }, [phase]);

  /* On unmount, restore the ambient idle so the next route boots clean. */
  useEffect(() => {
    return () => {
      if (typeof window === "undefined") return;
      window.dispatchEvent(
        new CustomEvent(PARTICLE_MODE_EVENT, { detail: { mode: "idle" } }),
      );
    };
  }, []);

  /* --------------------------------------------------------------------- */
  /*  API call — the ONLY place the /api/design-render endpoint is invoked  */
  /* --------------------------------------------------------------------- */

  const runRender = useCallback(
    async (handoff: ProposalHandoff, seed: number) => {
      setPhase({ kind: "generating", handoff, seed });
      try {
        const res = await fetch("/api/design-render", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ ...handoff, seed }),
        });
        const body = (await res.json()) as RenderApiResponse;
        if (!body.success) {
          setPhase({
            kind: "error",
            handoff,
            seed,
            message: body.error,
            code: body.code,
          });
          return;
        }
        setPhase({ kind: "success", handoff, seed, render: body, confirmed: false });
      } catch (err) {
        setPhase({
          kind: "error",
          handoff,
          seed,
          message: err instanceof Error ? err.message : t("errors.networkError"),
          code: "network",
        });
      }
    },
    [t],
  );

  /* --------------------------------------------------------------------- */
  /*  Mount — read Stage 4 hand-off + honor a previously confirmed render   */
  /* --------------------------------------------------------------------- */

  useEffect(() => {
    /* Never trust the hand-off structurally. The API re-verifies against the
       live knowledge base; we only use the schema here to reject junk before
       spending an API round-trip. */
    let confirmedRaw: unknown = null;
    let handoffRaw: unknown = null;
    try {
      const rc = sessionStorage.getItem(STAGE5_RENDER_STORAGE_KEY);
      confirmedRaw = rc ? JSON.parse(rc) : null;
      const rh = sessionStorage.getItem(STAGE4_PROPOSAL_STORAGE_KEY);
      handoffRaw = rh ? JSON.parse(rh) : null;
    } catch {
      confirmedRaw = null;
      handoffRaw = null;
    }

    const handoffParsed = ProposalHandoffSchema.safeParse(handoffRaw);
    if (!handoffParsed.success) {
      setPhase({ kind: "empty" });
      return;
    }
    const handoff = handoffParsed.data;

    /* If the customer already confirmed a render this session AND its
       proposal id matches the current hand-off's proposal id, resume it. */
    if (
      confirmedRaw !== null &&
      typeof confirmedRaw === "object" &&
      "render" in confirmedRaw &&
      "seed" in confirmedRaw
    ) {
      const container = confirmedRaw as {
        render?: SuccessBody;
        seed?: number;
        confirmed?: boolean;
      };
      if (
        container.render?.success === true &&
        container.render.image_prompt.proposal_id === handoff.proposal.id &&
        typeof container.seed === "number"
      ) {
        setPhase({
          kind: "success",
          handoff,
          seed: container.seed,
          render: container.render,
          confirmed: container.confirmed === true,
        });
        return;
      }
    }

    void runRender(handoff, 1);
  }, [runRender]);

  /* --------------------------------------------------------------------- */
  /*  Action handlers                                                        */
  /* --------------------------------------------------------------------- */

  /** Regenerate — same proposal, same brief, same DNA, new seed only. */
  const handleRegenerate = useCallback(() => {
    if (phase.kind === "success" || phase.kind === "error") {
      void runRender(phase.handoff, phase.seed + 1);
    }
  }, [phase, runRender]);

  const handleBackToProposal = useCallback(() => {
    /* Never clear Stage 4 hand-off — the proposal must survive re-entry. */
    router.push("/design-proposal");
  }, [router]);

  const handleConfirm = useCallback(() => {
    if (phase.kind !== "success") return;
    /* Stage 5 → 定制 hand-off: everything downstream needs to quote the piece
       later without re-running the pipeline. Store proposal + brief + DNA
       + selected direction + rendered image + prompt + seed. */
    try {
      sessionStorage.setItem(
        STAGE5_RENDER_STORAGE_KEY,
        JSON.stringify({
          designDna: phase.handoff.designDna,
          designBrief: phase.handoff.designBrief,
          selectedDirectionId: phase.handoff.selectedDirectionId,
          proposal: phase.handoff.proposal,
          seed: phase.seed,
          design_confirmed: true,
          render: phase.render,
        }),
      );
    } catch {
      /* Storage unavailable — the in-memory confirm still registers */
    }
    setPhase({ ...phase, confirmed: true });
  }, [phase]);

  /* --------------------------------------------------------------------- */
  /*  Empty state — Stage 4 not completed                                    */
  /* --------------------------------------------------------------------- */

  if (phase.kind === "empty") {
    return (
      <div className="animate-fade-in flex flex-1 flex-col items-start justify-center gap-8 py-16">
        <SectionLabel>{t("designRender.emptyLabel")}</SectionLabel>
        <h2 className="font-editorial max-w-2xl text-4xl leading-[1.1] tracking-[-0.01em] text-[var(--color-ivory)] sm:text-5xl">
          {t("designRender.emptyTitle")}
        </h2>
        <p className="max-w-md text-[14px] leading-relaxed text-[var(--color-silver-400)]">
          {t("designRender.emptyBody")}
        </p>
        <Link
          href="/design-proposal"
          className="group inline-flex items-center gap-3 rounded-full border border-[var(--color-line-strong)] bg-[linear-gradient(180deg,var(--color-silver-100),var(--color-silver-300))] px-7 py-3.5 text-[12px] font-medium tracking-[0.14em] text-[var(--color-bg)] uppercase transition-all duration-300 hover:brightness-105 active:scale-[0.97]"
        >
          {t("designRender.emptyCta")}
          <ArrowRight
            className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5"
            strokeWidth={1.5}
          />
        </Link>
      </div>
    );
  }

  /* --------------------------------------------------------------------- */
  /*  Generating state — no fake progress %, just rotating status lines     */
  /* --------------------------------------------------------------------- */

  if (phase.kind === "generating") {
    return (
      <div className="animate-fade-in flex flex-col gap-10 py-16">
        <SectionLabel>{t("designRender.generatingLabel")}</SectionLabel>
        <h2 className="font-editorial max-w-2xl text-3xl leading-[1.15] tracking-[-0.01em] text-[var(--color-ivory)] sm:text-4xl">
          {t("designRender.generatingTitle")}
        </h2>
        <p className="max-w-xl text-[14px] leading-relaxed text-[var(--color-silver-400)]">
          {t("designRender.generatingBody")}
        </p>
        <ol className="flex flex-col gap-4">
          {GENERATING_STAGE_KEYS.map((key, i) => (
            <li key={key} className="flex items-center gap-5">
              <span
                className={`font-editorial text-[20px] leading-[1.2] tracking-[-0.005em] sm:text-[22px] ${i <= generatingStage
                  ? "text-[var(--color-ivory)]"
                  : "text-[var(--color-silver-600)]"
                  }`}
              >
                {t(key)}
              </span>
              {i === generatingStage && (
                <span className="ml-auto h-px w-24 shimmer" aria-hidden />
              )}
            </li>
          ))}
        </ol>
        <p className="text-[11px] leading-relaxed text-[var(--color-silver-600)]">
          {t("designRender.generatingNote")}
        </p>
      </div>
    );
  }

  /* --------------------------------------------------------------------- */
  /*  Error state — user can retry or go back                                */
  /* --------------------------------------------------------------------- */

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
            <div className="mb-1 text-[11px] tracking-[0.14em] text-red-300/70 uppercase">
              {t("designRender.errorInterrupted")}
            </div>
            <div>{t("designRender.errorBody")}</div>
            <div className="mt-2 text-[11px] leading-relaxed text-red-200/60">
              {tApiError(phase.code, phase.message)}
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={handleRegenerate}
            className="group inline-flex items-center gap-3 rounded-full border border-[var(--color-line-strong)] bg-[rgba(231,226,211,0.06)] px-6 py-3 text-[12px] font-medium tracking-[0.14em] text-[var(--color-ivory)] uppercase transition-colors hover:border-[var(--color-accent)]"
          >
            <RotateCcw className="h-4 w-4" strokeWidth={1.5} />
            {t("designRender.actions.retry")}
          </button>
          <button
            type="button"
            onClick={handleBackToProposal}
            className="inline-flex items-center gap-2 text-[12px] tracking-[0.14em] text-[var(--color-silver-400)] uppercase transition-colors hover:text-[var(--color-ivory)]"
          >
            <ArrowLeft className="h-3.5 w-3.5" strokeWidth={1.5} />
            {t("designRender.actions.back")}
          </button>
        </div>
      </div>
    );
  }

  /* --------------------------------------------------------------------- */
  /*  Success state — the concept render + three-layer information + CTA    */
  /* --------------------------------------------------------------------- */

  const { render, handoff, confirmed } = phase;
  const prompt: ImagePrompt = render.image_prompt;

  return (
    <div className="animate-fade-in flex flex-col gap-16 pb-24">
      <MotionReveal>
        <RenderImage imageUrl={render.image.data_url} prompt={prompt} />
      </MotionReveal>
      <MotionReveal delay={140}>
        <RenderWhy prompt={prompt} />
      </MotionReveal>
      <MotionReveal delay={200}>
        <RenderCulture proposal={handoff.proposal} />
      </MotionReveal>
      <MotionReveal delay={240}>
        <RenderInterpretation proposal={handoff.proposal} />
      </MotionReveal>
      <MotionReveal delay={280}>
        <RenderActions
          confirmed={confirmed}
          onRegenerate={handleRegenerate}
          onBack={handleBackToProposal}
          onConfirm={handleConfirm}
        />
      </MotionReveal>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  RenderActions — the closing panel                                          */
/* -------------------------------------------------------------------------- */

interface RenderActionsProps {
  confirmed: boolean;
  onRegenerate: () => void;
  onBack: () => void;
  onConfirm: () => void;
}

function RenderActions({ confirmed, onRegenerate, onBack, onConfirm }: RenderActionsProps) {
  const { t } = useI18n();
  const router = useRouter();

  if (confirmed) {
    return (
      <section className="glass-panel flex flex-col gap-8 rounded-[var(--radius-lg)] p-8 sm:p-10">
        <SectionLabel>{t("designRender.confirmedLabel")}</SectionLabel>
        <div className="flex flex-col gap-4">
          <h3 className="font-editorial text-3xl leading-[1.15] tracking-[-0.01em] text-[var(--color-ivory)] sm:text-4xl">
            {t("designRender.confirmedTitle")}
          </h3>
          <p className="max-w-2xl text-[14px] leading-relaxed text-[var(--color-silver-300)]">
            {t("designRender.confirmedBody")}
          </p>
          <p className="text-[12px] leading-relaxed text-[var(--color-silver-500)]">
            {t("designRender.confirmedBody2")}
          </p>
        </div>
        <div className="flex flex-col gap-4 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            onClick={() => router.push("/")}
            className="inline-flex items-center gap-2 text-[12px] tracking-[0.14em] text-[var(--color-silver-400)] uppercase transition-colors hover:text-[var(--color-ivory)]"
          >
            <RotateCcw className="h-3.5 w-3.5" strokeWidth={1.5} />
            {t("common.actions.startOver")}
          </button>
          <span className="text-[10px] tracking-[0.22em] text-[var(--color-silver-600)] uppercase">
            {t("designRender.customizationComingSoon")}
          </span>
        </div>
      </section>
    );
  }

  return (
    <section className="glass-panel flex flex-col gap-8 rounded-[var(--radius-lg)] p-8 sm:p-10">
      <SectionLabel>{t("designRender.actionsLabel")}</SectionLabel>
      <div className="flex flex-col gap-4">
        <h3 className="font-editorial text-3xl leading-[1.15] tracking-[-0.01em] text-[var(--color-ivory)] sm:text-4xl">
          {t("designRender.actionsTitle")}
        </h3>
      </div>
      <div className="flex flex-col gap-4">
        <button
          type="button"
          onClick={onConfirm}
          className="group inline-flex items-center justify-between gap-3 rounded-full border border-[var(--color-line-strong)] bg-[rgba(231,226,211,0.06)] px-7 py-4 text-left transition-colors hover:border-[var(--color-accent)]"
        >
          <span className="flex flex-col gap-1">
            <span className="text-[13px] font-medium tracking-[0.1em] text-[var(--color-ivory)]">
              {t("designRender.actions.love")}
            </span>
            <span className="text-[11px] leading-relaxed text-[var(--color-silver-500)]">
              {t("designRender.actions.loveHint")}
            </span>
          </span>
          <Heart
            className="h-4 w-4 shrink-0 text-[var(--color-silver-400)] transition-colors group-hover:text-[var(--color-accent)]"
            strokeWidth={1.5}
          />
        </button>
        <div className="flex flex-col gap-4 sm:flex-row">
          <button
            type="button"
            onClick={onRegenerate}
            className="group inline-flex flex-1 items-center gap-3 rounded-full border border-[var(--color-line)] px-6 py-3.5 text-left transition-colors hover:border-[var(--color-silver-400)]"
          >
            <Sparkles
              className="h-4 w-4 shrink-0 text-[var(--color-silver-500)]"
              strokeWidth={1.5}
            />
            <span className="flex flex-col gap-1">
              <span className="text-[12px] font-medium tracking-[0.1em] text-[var(--color-silver-200)]">
                {t("designRender.actions.regenerate")}
              </span>
              <span className="text-[11px] leading-relaxed text-[var(--color-silver-500)]">
                {t("designRender.actions.regenerateHint")}
              </span>
            </span>
          </button>
          <button
            type="button"
            onClick={onBack}
            className="group inline-flex flex-1 items-center gap-3 rounded-full border border-[var(--color-line)] px-6 py-3.5 text-left transition-colors hover:border-[var(--color-silver-400)]"
          >
            <ArrowLeft
              className="h-4 w-4 shrink-0 text-[var(--color-silver-500)]"
              strokeWidth={1.5}
            />
            <span className="flex flex-col gap-1">
              <span className="text-[12px] font-medium tracking-[0.1em] text-[var(--color-silver-200)]">
                {t("designRender.actions.back")}
              </span>
              <span className="text-[11px] leading-relaxed text-[var(--color-silver-500)]">
                {t("designRender.actions.backHint")}
              </span>
            </span>
          </button>
        </div>
      </div>
      <p className="text-[10px] tracking-[0.22em] text-[var(--color-silver-600)] uppercase">
        {t("designRender.regenerateNote")}
      </p>
    </section>
  );
}
