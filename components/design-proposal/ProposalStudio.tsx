"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { AlertCircle, ArrowRight, RotateCcw } from "lucide-react";
import { SectionLabel } from "@/components/shared/SectionLabel";
import { useI18n } from "@/components/i18n/I18nProvider";
import {
  STAGE3_BRIEF_STORAGE_KEY,
  STAGE4_PROPOSAL_STORAGE_KEY,
} from "@/lib/constants/storage";
import type { GlobalDesignBrief } from "@/lib/ai/schemas";
import {
  ProposalRequestSchema,
  ProposalHandoffSchema,
  type DesignBrief,
} from "@/lib/design/schemas";
import type { ProposalApiResponse } from "@/types/design-proposal";
import {
  ProposalHero,
  ProposalReasoning,
  ProposalFormSection,
  ProposalMotifSection,
  ProposalMaterialSection,
  ProposalWearabilitySection,
  ProposalCulturalSources,
} from "./ProposalSections";
import { ProposalActions } from "./ProposalActions";
import { MotionReveal } from "@/components/visual/MotionReveal";

const ASSEMBLING_STAGE_KEYS = [
  "designProposal.assemblingStages.stage0",
  "designProposal.assemblingStages.stage1",
  "designProposal.assemblingStages.stage2",
  "designProposal.assemblingStages.stage3",
] as const;

type ProposalBody = Extract<ProposalApiResponse, { success: true }>;

type Phase =
  | { kind: "loading" }
  | { kind: "empty" }
  | { kind: "error"; message: string; code?: string }
  | {
    kind: "proposal";
    proposal: ProposalBody;
    /** The Stage 3 brief the proposal was assembled from (kept for the
        Stage 4 → 5 hand-off, never rendered as-is). */
    designBrief: DesignBrief;
    confirmed: boolean;
  };

/**
 * Design Proposal studio — Stage 4 orchestrator.
 *
 * Reads the Stage 3 → 4 hand-off from sessionStorage and delegates ALL
 * proposal derivation to the server-side engine. The client only renders
 * what the API returns; it cannot inject or upgrade any cultural claim
 * (the engine re-verifies the brief against the live knowledge base and
 * withholds the document if any guardrail fails).
 */
export function ProposalStudio() {
  const { t, tApiError } = useI18n();
  const [phase, setPhase] = useState<Phase>({ kind: "loading" });
  const [stage, setStage] = useState(0);

  /* Assembling animation — same cadence as the earlier stages. */
  useEffect(() => {
    if (stage >= ASSEMBLING_STAGE_KEYS.length - 1) return;
    const timer = setTimeout(() => setStage((s) => s + 1), 700);
    return () => clearTimeout(timer);
  }, [stage]);

  const build = useCallback(
    async (designDna: GlobalDesignBrief, designBrief: DesignBrief) => {
      try {
        const res = await fetch("/api/design-proposal", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ designDna, designBrief }),
        });
        const body = (await res.json()) as ProposalApiResponse;
        if (!body.success) {
          setPhase({ kind: "error", message: body.error, code: body.code });
          return;
        }
        setPhase({ kind: "proposal", proposal: body, designBrief, confirmed: false });
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

  /* Mount: read the Stage 3 → 4 hand-off (id-level trust only — the
     server re-verifies everything before assembling the proposal). Also
     honor an already-confirmed proposal from a previous visit. */
  useEffect(() => {
    let confirmed: unknown = null;
    let handoff: unknown = null;
    try {
      const rawConfirmed = sessionStorage.getItem(STAGE4_PROPOSAL_STORAGE_KEY);
      confirmed = rawConfirmed ? JSON.parse(rawConfirmed) : null;
      const rawHandoff = sessionStorage.getItem(STAGE3_BRIEF_STORAGE_KEY);
      handoff = rawHandoff ? JSON.parse(rawHandoff) : null;
    } catch {
      confirmed = null;
      handoff = null;
    }

    const confirmedParsed = ProposalHandoffSchema.safeParse(confirmed);
    if (confirmedParsed.success) {
      const { designDna, designBrief, selectedDirectionId, proposal } =
        confirmedParsed.data;
      setPhase({
        kind: "proposal",
        proposal: {
          success: true,
          design_dna: designDna,
          selected_direction_id: selectedDirectionId,
          design_proposal: proposal,
          verification: proposal.guardrail_status,
        },
        designBrief,
        confirmed: true,
      });
      return;
    }

    const handoffParsed = ProposalRequestSchema.safeParse(handoff);
    if (!handoffParsed.success) {
      setPhase({ kind: "empty" });
      return;
    }
    void build(handoffParsed.data.designDna, handoffParsed.data.designBrief);
  }, [build]);

  const handleConfirm = useCallback(() => {
    if (phase.kind !== "proposal") return;
    /* Stage 4 → 5 hand-off: the confirmed proposal + the brief/DNA it
       derives from. The final visual stage reads it on mount. */
    try {
      sessionStorage.setItem(
        STAGE4_PROPOSAL_STORAGE_KEY,
        JSON.stringify({
          designDna: phase.proposal.design_dna,
          designBrief: phase.designBrief,
          selectedDirectionId: phase.proposal.selected_direction_id,
          proposal: phase.proposal.design_proposal,
        }),
      );
    } catch {
      /* storage unavailable — the confirm still registers in-state */
    }
    setPhase({ ...phase, confirmed: true });
  }, [phase]);

  /* ------------------------------  States  ------------------------------ */

  if (phase.kind === "loading") {
    return (
      <div className="animate-fade-in flex flex-col gap-10 py-16">
        <SectionLabel>{t("designProposal.assemblingLabel")}</SectionLabel>
        <ol className="flex flex-col gap-4">
          {ASSEMBLING_STAGE_KEYS.map((key, i) => (
            <li key={key} className="flex items-center gap-5">
              <span
                className={`font-editorial text-[20px] leading-[1.2] tracking-[-0.005em] sm:text-[22px] ${i <= stage
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
        <SectionLabel>{t("designProposal.emptyLabel")}</SectionLabel>
        <h2 className="font-editorial max-w-2xl text-4xl leading-[1.1] tracking-[-0.01em] text-[var(--color-ivory)] sm:text-5xl">
          {t("designProposal.emptyTitle")}
        </h2>
        <p className="max-w-md text-[14px] leading-relaxed text-[var(--color-silver-400)]">
          {t("designProposal.emptyBody")}
        </p>
        <Link
          href="/design-translation"
          className="group inline-flex items-center gap-3 rounded-full border border-[var(--color-line-strong)] bg-[linear-gradient(180deg,var(--color-silver-100),var(--color-silver-300))] px-7 py-3.5 text-[12px] font-medium tracking-[0.14em] text-[var(--color-bg)] uppercase transition-all duration-300 hover:brightness-105 active:scale-[0.97]"
        >
          {t("common.actions.continueToDesignTranslation")}
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
            <div className="mb-1 text-[11px] tracking-[0.14em] text-red-300/70 uppercase">
              {t("designProposal.errorInterrupted")}
            </div>
            <div>{tApiError(phase.code, phase.message)}</div>
          </div>
        </div>
        <Link
          href="/design-translation"
          className="inline-flex items-center gap-2 text-[12px] tracking-[0.14em] text-[var(--color-silver-400)] uppercase transition-colors hover:text-[var(--color-ivory)]"
        >
          <RotateCcw className="h-3.5 w-3.5" strokeWidth={1.5} />
          {t("common.actions.backToDesignTranslation")}
        </Link>
      </div>
    );
  }

  /* ----------------------------  The document  --------------------------- */

  const { proposal } = phase;

  return (
    <div className="animate-fade-in flex flex-col gap-16 pb-24">
      <MotionReveal>
        <ProposalHero proposal={proposal.design_proposal} />
      </MotionReveal>
      <MotionReveal delay={80}>
        <ProposalReasoning proposal={proposal.design_proposal} />
      </MotionReveal>
      <MotionReveal delay={120}>
        <ProposalFormSection proposal={proposal.design_proposal} />
      </MotionReveal>
      <MotionReveal delay={140}>
        <ProposalMotifSection proposal={proposal.design_proposal} />
      </MotionReveal>
      <MotionReveal delay={160}>
        <ProposalMaterialSection proposal={proposal.design_proposal} />
      </MotionReveal>
      <MotionReveal delay={180}>
        <ProposalWearabilitySection proposal={proposal.design_proposal} />
      </MotionReveal>
      <MotionReveal delay={200}>
        <ProposalCulturalSources proposal={proposal.design_proposal} />
      </MotionReveal>
      <MotionReveal delay={240}>
        <ProposalActions
          proposal={proposal.design_proposal}
          confirmed={phase.confirmed}
          onConfirm={handleConfirm}
        />
      </MotionReveal>
    </div>
  );
}
