"use client";

import { Sparkles } from "lucide-react";
import { SectionLabel } from "@/components/shared/SectionLabel";
import { useI18n } from "@/components/i18n/I18nProvider";

interface NaturalLanguageInputProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  maxLength?: number;
}

/** Example story — user content, always kept in the user's own language (English). */
const EXAMPLE =
  "I want something minimal for everyday wear. It should represent a new beginning and feel connected to nature.";

export function NaturalLanguageInput({
  value,
  onChange,
  disabled = false,
  maxLength = 1200,
}: NaturalLanguageInputProps) {
  const { t } = useI18n();

  return (
    <section className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <SectionLabel>{t("globalDemand.storyLabel")}</SectionLabel>
        <span className="text-[11px] tracking-[0.18em] text-[var(--color-silver-500)] uppercase">
          {value.length} / {maxLength}
        </span>
      </div>

      <div className="editorial-input group relative rounded-[2px] p-6 sm:p-7">
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value.slice(0, maxLength))}
          placeholder={t("globalDemand.storyPlaceholder")}
          disabled={disabled}
          rows={5}
          aria-label={t("globalDemand.storyAria")}
          className="w-full resize-none bg-transparent font-sans text-[20px] leading-[1.4] tracking-[-0.005em] text-[var(--color-ivory)] placeholder:text-[var(--color-silver-500)]/70 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60 sm:text-[22px]"
        />
        <div className="mt-5 flex flex-col gap-3 border-t border-[var(--color-line)] pt-4 sm:flex-row sm:items-center sm:justify-between">
          <span className="inline-flex items-center gap-2 text-[12px] tracking-[0.06em] text-[var(--color-silver-400)]">
            <Sparkles className="h-3.5 w-3.5" strokeWidth={1.5} />
            {t("globalDemand.storyHint")}
          </span>
          <button
            type="button"
            onClick={() => onChange(EXAMPLE)}
            disabled={disabled}
            className="self-start text-[12px] tracking-[0.14em] text-[var(--color-silver-400)] uppercase transition-colors hover:text-[var(--color-ivory)] disabled:opacity-40 sm:self-auto"
          >
            {t("common.actions.tryExample")}
          </button>
        </div>
      </div>
    </section>
  );
}
