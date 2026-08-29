"use client";

import { useState } from "react";
import { ArrowRight, MessageCircleQuestion } from "lucide-react";
import { SectionLabel } from "@/components/shared/SectionLabel";
import { useI18n } from "@/components/i18n/I18nProvider";
import type { ClarificationQuestion } from "@/lib/ai/schemas";

interface ClarificationDialogProps {
  question: ClarificationQuestion;
  onAnswer: (answer: string) => void;
  disabled?: boolean;
}

/**
 * A single-turn clarification prompt.
 *
 * The AI (or Demo heuristic) has flagged the input as too sparse and
 * asked ONE question with 2–5 concrete options. The dialog captures a
 * single answer and hands it back to the caller, which appends it to
 * `history` and re-invokes /api/global-demand/analyze.
 */
export function ClarificationDialog({
  question,
  onAnswer,
  disabled = false,
}: ClarificationDialogProps) {
  const { t } = useI18n();
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <section className="animate-fade-in flex flex-col gap-8 py-8">
      <div className="flex items-center gap-3">
        <MessageCircleQuestion
          className="h-4 w-4 text-[var(--color-silver-400)]"
          strokeWidth={1.5}
        />
        <SectionLabel>{t("globalDemand.clarificationLabel")}</SectionLabel>
      </div>

      <h2 className="font-sans max-w-2xl text-[28px] leading-[1.1] tracking-[-0.01em] text-[var(--color-ivory)] sm:text-[32px]">
        {question.question}
      </h2>

      <div
        className="flex flex-wrap gap-3"
        role="radiogroup"
        aria-label={question.question}
      >
        {question.options.map((option) => (
          <button
            key={option}
            type="button"
            role="radio"
            aria-checked={selected === option}
            data-selected={selected === option}
            disabled={disabled}
            onClick={() => setSelected(option)}
            className="chip"
          >
            {option}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-4 pt-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="max-w-md text-[12px] leading-relaxed text-[var(--color-silver-500)]">
          {t("globalDemand.clarificationHint")}
        </p>
        <button
          type="button"
          disabled={disabled || selected === null}
          onClick={() => selected && onAnswer(selected)}
          className="group inline-flex items-center gap-3 self-start rounded-full border border-[var(--color-line-strong)] bg-[linear-gradient(180deg,var(--color-silver-100),var(--color-silver-300))] px-6 py-3 text-[12px] font-medium tracking-[0.16em] text-[var(--color-bg)] uppercase transition-all duration-300 hover:brightness-105 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:brightness-100 sm:self-auto"
        >
          {t("common.actions.continue")}
          <ArrowRight
            className="h-4 w-4 transition-transform duration-300 group-enabled:group-hover:translate-x-0.5"
            strokeWidth={1.5}
          />
        </button>
      </div>
    </section>
  );
}
