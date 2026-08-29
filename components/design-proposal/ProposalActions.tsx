"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, RotateCcw, SlidersHorizontal } from "lucide-react";
import { SectionLabel } from "@/components/shared/SectionLabel";
import { useI18n } from "@/components/i18n/I18nProvider";
import { STAGE3_BRIEF_STORAGE_KEY } from "@/lib/constants/storage";
import { PARTICLE_MODE_EVENT } from "@/components/visual/ParticleField";
import type { DesignProposal } from "@/lib/design/schemas";

interface ProposalActionsProps {
  proposal: DesignProposal;
  confirmed: boolean;
  onConfirm: () => void;
}

/**
 * 「下一步」 — the three closing operations. Only「确认这个方向」unlocks the
 * final visual design / generation stage; adjust and re-explore send the
 * customer back up the pipeline without confirming anything.
 */
export function ProposalActions({
  proposal,
  confirmed,
  onConfirm,
}: ProposalActionsProps) {
  const { t } = useI18n();
  const router = useRouter();
  void proposal; /* reserved for downstream analytics — intentionally unused */

  /* Stage 6 · Round 4 — broadcast the confirmed "hold" state to the
     global particle layer. Once the customer locks in the direction the
     field visibly settles (30 % velocity/jitter drop, half the flashes,
     a touch brighter). Idle on unmount so the next route boots clean. */
  useEffect(() => {
    if (typeof window === "undefined") return;
    window.dispatchEvent(
      new CustomEvent(PARTICLE_MODE_EVENT, {
        detail: { mode: confirmed ? "confirmed" : "idle" },
      }),
    );
  }, [confirmed]);

  useEffect(() => {
    return () => {
      if (typeof window === "undefined") return;
      window.dispatchEvent(
        new CustomEvent(PARTICLE_MODE_EVENT, { detail: { mode: "idle" } }),
      );
    };
  }, []);

  if (confirmed) {
    return (
      <section className="glass-panel flex flex-col gap-8 rounded-[var(--radius-lg)] p-8 sm:p-10">
        <SectionLabel>{t("designProposal.confirmedLabel")}</SectionLabel>
        <div className="flex flex-col gap-4">
          <h3 className="font-editorial text-3xl leading-[1.15] tracking-[-0.01em] text-[var(--color-ivory)] sm:text-4xl">
            {t("designProposal.confirmedTitle")}
          </h3>
          <p className="max-w-2xl text-[14px] leading-relaxed text-[var(--color-silver-300)]">
            {t("designProposal.confirmedBody")}
          </p>
          <p className="text-[12px] leading-relaxed text-[var(--color-silver-500)]">
            {t("designProposal.confirmedBody2")}
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
          <button
            type="button"
            onClick={() => router.push("/design-render")}
            className="group inline-flex items-center gap-3 rounded-full border border-[var(--color-line-strong)] bg-[linear-gradient(180deg,var(--color-silver-100),var(--color-silver-300))] px-6 py-3 text-[12px] font-medium tracking-[0.14em] text-[var(--color-bg)] uppercase transition-all duration-300 hover:brightness-105 active:scale-[0.97]"
          >
            {t("designProposal.actions.continueToRender")}
            <ArrowRight
              className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5"
              strokeWidth={1.5}
            />
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="glass-panel flex flex-col gap-8 rounded-[var(--radius-lg)] p-8 sm:p-10">
      <SectionLabel>{t("designProposal.actionsLabel")}</SectionLabel>
      <div className="flex flex-col gap-4">
        <h3 className="font-editorial text-3xl leading-[1.15] tracking-[-0.01em] text-[var(--color-ivory)] sm:text-4xl">
          {t("designProposal.actionsTitle")}
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
              {t("designProposal.actions.confirm")}
            </span>
            <span className="text-[11px] leading-relaxed text-[var(--color-silver-500)]">
              {t("designProposal.actions.confirmHint")}
            </span>
          </span>
          <ArrowRight
            className="h-4 w-4 shrink-0 text-[var(--color-silver-400)] transition-colors group-hover:text-[var(--color-accent)]"
            strokeWidth={1.5}
          />
        </button>
        <div className="flex flex-col gap-4 sm:flex-row">
          <button
            type="button"
            onClick={() => router.push("/design-translation")}
            className="group inline-flex flex-1 items-center gap-3 rounded-full border border-[var(--color-line)] px-6 py-3.5 text-left transition-colors hover:border-[var(--color-silver-400)]"
          >
            <SlidersHorizontal
              className="h-4 w-4 shrink-0 text-[var(--color-silver-500)]"
              strokeWidth={1.5}
            />
            <span className="flex flex-col gap-1">
              <span className="text-[12px] font-medium tracking-[0.1em] text-[var(--color-silver-200)]">
                {t("designProposal.actions.adjust")}
              </span>
              <span className="text-[11px] leading-relaxed text-[var(--color-silver-500)]">
                {t("designProposal.actions.adjustHint")}
              </span>
            </span>
          </button>
          <button
            type="button"
            onClick={() => {
              try {
                sessionStorage.removeItem(STAGE3_BRIEF_STORAGE_KEY);
              } catch {
                /* storage unavailable — ignore */
              }
              router.push("/cultural-match");
            }}
            className="group inline-flex flex-1 items-center gap-3 rounded-full border border-[var(--color-line)] px-6 py-3.5 text-left transition-colors hover:border-[var(--color-silver-400)]"
          >
            <RotateCcw
              className="h-4 w-4 shrink-0 text-[var(--color-silver-500)]"
              strokeWidth={1.5}
            />
            <span className="flex flex-col gap-1">
              <span className="text-[12px] font-medium tracking-[0.1em] text-[var(--color-silver-200)]">
                {t("designProposal.actions.reexplore")}
              </span>
              <span className="text-[11px] leading-relaxed text-[var(--color-silver-500)]">
                {t("designProposal.actions.reexploreHint")}
              </span>
            </span>
          </button>
        </div>
      </div>
      <p className="text-[10px] tracking-[0.22em] text-[var(--color-silver-600)] uppercase">
        {t("designProposal.noImageNote")}
      </p>
    </section>
  );
}
