"use client";

import { useEffect, useState } from "react";
import { Check } from "lucide-react";
import { SectionLabel } from "@/components/shared/SectionLabel";
import { useI18n } from "@/components/i18n/I18nProvider";

/**
 * Editorial processing state.
 *
 * Four stages advance deterministically at ~800ms each until the last
 * stage — the last stage holds a shimmer until the caller reports the
 * request has completed via the `done` prop.
 *
 * There is no fake randomness; each stage maps to a real phase of the
 * server pipeline (input parse → intent read → preference merge → brief).
 */

const STAGE_KEYS = [
  "globalDemand.processingStages.stage0",
  "globalDemand.processingStages.stage1",
  "globalDemand.processingStages.stage2",
  "globalDemand.processingStages.stage3",
] as const;

interface ProcessingStateProps {
  done: boolean;
}

export function ProcessingState({ done }: ProcessingStateProps) {
  const { t } = useI18n();
  const [stage, setStage] = useState(0);

  useEffect(() => {
    if (stage >= STAGE_KEYS.length - 1) return;
    const timer = setTimeout(() => setStage((s) => s + 1), 850);
    return () => clearTimeout(timer);
  }, [stage]);

  return (
    <div className="animate-fade-in flex flex-col gap-10 py-16">
      <SectionLabel>{t("globalDemand.processingLabel")}</SectionLabel>

      <ol className="flex flex-col gap-4">
        {STAGE_KEYS.map((key, i) => {
          const state =
            i < stage
              ? "done"
              : i === stage
                ? done
                  ? "done"
                  : "active"
                : "pending";
          return (
            <li key={key} className="flex items-center gap-5">
              <span
                aria-hidden
                className={`relative flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors duration-500 ${
                  state === "done"
                    ? "border-[var(--color-silver-200)] bg-[var(--color-silver-100)]"
                    : state === "active"
                      ? "border-[var(--color-line-strong)]"
                      : "border-[var(--color-line)]"
                }`}
              >
                {state === "done" ? (
                  <Check
                    className="h-3 w-3 text-[var(--color-bg)]"
                    strokeWidth={2.5}
                  />
                ) : state === "active" ? (
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--color-silver-200)]" />
                ) : (
                  <span className="h-1 w-1 rounded-full bg-[var(--color-silver-600)]" />
                )}
              </span>
              <span
                className={`font-sans text-[18px] leading-[1.2] tracking-[-0.005em] transition-colors duration-500 sm:text-[20px] ${
                  state === "done"
                    ? "text-[var(--color-silver-300)]"
                    : state === "active"
                      ? "text-[var(--color-ivory)]"
                      : "text-[var(--color-silver-600)]"
                }`}
              >
                {t(key)}
              </span>
              {state === "active" && !done && (
                <span
                  className="ml-auto h-px w-24 shimmer"
                  aria-hidden
                />
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
