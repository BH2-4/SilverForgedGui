"use client";

import { SectionLabel } from "@/components/shared/SectionLabel";
import { useI18n } from "@/components/i18n/I18nProvider";
import {
  STYLE_OPTIONS,
  OCCASION_OPTIONS,
  EMOTION_OPTIONS,
  CULTURAL_VISIBILITY_OPTIONS,
  PRODUCT_OPTIONS,
} from "@/lib/constants/preferences";

export interface StructuredPreferencesValue {
  product: string | null;
  styles: string[];
  occasion: string | null;
  emotions: string[];
  culturalVisibility: string | null;
}

interface StructuredPreferencesProps {
  value: StructuredPreferencesValue;
  onChange: (value: StructuredPreferencesValue) => void;
  disabled?: boolean;
}

interface GroupProps {
  label: string;
  options: readonly string[];
  /** values.* dictionary section used to localize the displayed labels. */
  valueCategory: string;
  mode: "single" | "multi";
  selected: string | string[] | null;
  onToggle: (option: string) => void;
  disabled?: boolean;
}

function ChipGroup({
  label,
  options,
  valueCategory,
  mode,
  selected,
  onToggle,
  disabled,
}: GroupProps) {
  const { tv } = useI18n();
  const isSelected = (opt: string) =>
    mode === "multi"
      ? Array.isArray(selected) && selected.includes(opt)
      : selected === opt;

  return (
    <div className="flex flex-col gap-3">
      <span className="text-[11px] tracking-[0.22em] text-[var(--color-silver-400)] uppercase">
        {label}
      </span>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <button
            key={option}
            type="button"
            className="chip"
            data-selected={isSelected(option)}
            disabled={disabled}
            aria-pressed={isSelected(option)}
            onClick={() => onToggle(option)}
          >
            {tv(valueCategory, option)}
          </button>
        ))}
      </div>
    </div>
  );
}

export function StructuredPreferences({
  value,
  onChange,
  disabled,
}: StructuredPreferencesProps) {
  const { t } = useI18n();

  const toggleMulti = (
    key: "styles" | "emotions",
    option: string,
  ) => {
    const current = value[key];
    const next = current.includes(option)
      ? current.filter((v) => v !== option)
      : [...current, option];
    onChange({ ...value, [key]: next });
  };

  const toggleSingle = (
    key: "product" | "occasion" | "culturalVisibility",
    option: string,
  ) => {
    onChange({
      ...value,
      [key]: value[key] === option ? null : option,
    });
  };

  return (
    <section className="flex flex-col gap-8">
      <SectionLabel>{t("globalDemand.refineLabel")}</SectionLabel>

      <div className="grid grid-cols-1 gap-x-10 gap-y-8 md:grid-cols-2">
        <ChipGroup
          label={t("common.labels.product")}
          options={PRODUCT_OPTIONS}
          valueCategory="product"
          mode="single"
          selected={value.product}
          onToggle={(o) => toggleSingle("product", o)}
          disabled={disabled}
        />
        <ChipGroup
          label={t("common.labels.occasion")}
          options={OCCASION_OPTIONS}
          valueCategory="occasion"
          mode="single"
          selected={value.occasion}
          onToggle={(o) => toggleSingle("occasion", o)}
          disabled={disabled}
        />
        <ChipGroup
          label={t("common.labels.style")}
          options={STYLE_OPTIONS}
          valueCategory="style"
          mode="multi"
          selected={value.styles}
          onToggle={(o) => toggleMulti("styles", o)}
          disabled={disabled}
        />
        <ChipGroup
          label={t("common.labels.emotion")}
          options={EMOTION_OPTIONS}
          valueCategory="emotion"
          mode="multi"
          selected={value.emotions}
          onToggle={(o) => toggleMulti("emotions", o)}
          disabled={disabled}
        />
        <div className="md:col-span-2">
          <ChipGroup
            label={t("common.labels.culturalVisibility")}
            options={CULTURAL_VISIBILITY_OPTIONS}
            valueCategory="shared"
            mode="single"
            selected={value.culturalVisibility}
            onToggle={(o) => toggleSingle("culturalVisibility", o)}
            disabled={disabled}
          />
        </div>
      </div>
    </section>
  );
}
