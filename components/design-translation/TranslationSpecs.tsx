"use client";

import { SectionLabel } from "@/components/shared/SectionLabel";
import { useI18n } from "@/components/i18n/I18nProvider";
import type { DesignBrief } from "@/lib/design/schemas";

interface TranslationSpecsProps {
  brief: DesignBrief;
}

/**
 * DESIGN TRANSLATION — the product spec grid (Spree-style: clean rows,
 * hairlines, restrained surfaces). Every value is engine-derived from the
 * Design Brief; motif rows carry their source provenance inline.
 *
 * Spec enum values (form / scale / weight / …) are localized via the
 * values.* dictionary layer for display only — the brief stays untouched.
 */
export function TranslationSpecs({ brief }: TranslationSpecsProps) {
  const { t, tv } = useI18n();

  const motifValue =
    brief.motif_elements.length > 0
      ? brief.motif_elements
        .map(
          (m) =>
            `${m.name}${m.region ? ` · ${m.region}` : ""} · ${tv("presentedAs", m.presented_as)}`,
        )
        .join(" / ")
      : t("designTranslation.specsMotifNone");

  const rows: Array<{ label: string; value: string; note?: string }> = [
    {
      label: t("designTranslation.formLabel"),
      value: brief.form_language.map((v) => tv("form", v)).join(" · "),
    },
    {
      label: t("designTranslation.materialLabel"),
      value: `${tv("material", brief.material.primary)} · ${tv("finish", brief.material.finish)}`,
      note: brief.material.notes ?? undefined,
    },
    {
      label: t("designTranslation.motifLabel"),
      value: motifValue,
      note:
        brief.motif_elements.length > 0
          ? t("designTranslation.specsMotifNote")
          : undefined,
    },
    {
      label: t("designTranslation.scaleLabel"),
      value: tv("size", brief.size),
    },
    {
      label: t("designTranslation.weightLabel"),
      value: tv("weight", brief.weight),
    },
    {
      label: t("designTranslation.complexityLabel"),
      value: tv("complexity", brief.complexity),
    },
    {
      label: t("designTranslation.culturalVisibilityLabel"),
      value: tv("culturalVisibility", brief.cultural_visibility),
    },
    {
      label: t("designTranslation.wearabilityLabel"),
      value: tv("wearability", brief.wearability),
    },
  ];

  return (
    <section className="flex flex-col gap-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <SectionLabel>{t("designTranslation.specsLabel")}</SectionLabel>
        <span className="text-[10px] tracking-[0.22em] text-[var(--color-silver-600)] uppercase">
          {t("common.badges.engineDerived")}
        </span>
      </div>

      <div className="glass-panel overflow-hidden rounded-[var(--radius-lg)]">
        <dl className="divide-y divide-[var(--color-line)]">
          {rows.map((row) => (
            <div
              key={row.label}
              className="grid grid-cols-1 gap-3 px-8 py-6 sm:grid-cols-[180px_1fr] sm:gap-8 sm:px-10"
            >
              <dt className="text-[10px] tracking-[0.22em] text-[var(--color-silver-500)] uppercase sm:pt-1">
                {row.label}
              </dt>
              <dd className="flex flex-col gap-2">
                <span className="font-editorial text-[19px] leading-[1.3] tracking-[-0.005em] text-[var(--color-ivory)]">
                  {row.value}
                </span>
                {row.note && (
                  <span className="text-[11px] leading-relaxed text-[var(--color-silver-500)]">
                    {row.note}
                  </span>
                )}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
