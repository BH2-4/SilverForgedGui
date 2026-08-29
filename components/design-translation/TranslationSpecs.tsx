"use client";

import { SectionLabel } from "@/components/shared/SectionLabel";
import { useI18n } from "@/components/i18n/I18nProvider";
import type { DesignBrief } from "@/lib/design/schemas";

interface TranslationSpecsProps {
  brief: DesignBrief;
}

type Provenance = "user" | "ai";

/**
 * EXPERIENCE LAYER · DESIGN SPEC
 *
 * 规格不再以表格行铺开，而是图纸标注式的展签网格：小号大写标签 +
 * 细线 + 大数值。每个值仍由引擎从 Design Brief 推导；每行携带来源徽章
 * ——「你的选择」与「AI 建议」严格区分，用户没有填写的内容永远以
 * AI SUGGESTED 标注，绝不冒充用户选择。
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

  const rows: Array<{
    label: string;
    value: string;
    note?: string;
    provenance: Provenance;
  }> = [
    {
      label: t("designTranslation.formLabel"),
      value: brief.form_language.map((v) => tv("form", v)).join(" · "),
      provenance: "ai",
    },
    {
      label: t("designTranslation.materialLabel"),
      value: `${tv("material", brief.material.primary)} · ${tv("finish", brief.material.finish)}`,
      note: brief.material.notes ?? undefined,
      provenance: "ai",
    },
    {
      label: t("designTranslation.motifLabel"),
      value: motifValue,
      note:
        brief.motif_elements.length > 0
          ? t("designTranslation.specsMotifNote")
          : undefined,
      provenance: "ai",
    },
    {
      label: t("designTranslation.scaleLabel"),
      value: tv("size", brief.size),
      provenance: brief.spec_provenance.size,
    },
    {
      label: t("designTranslation.weightLabel"),
      value: tv("weight", brief.weight),
      provenance: brief.spec_provenance.weight,
    },
    {
      label: t("designTranslation.complexityLabel"),
      value: tv("complexity", brief.complexity),
      provenance: "ai",
    },
    {
      label: t("designTranslation.culturalVisibilityLabel"),
      value: tv("culturalVisibility", brief.cultural_visibility),
      provenance: brief.spec_provenance.cultural_visibility,
    },
    {
      label: t("designTranslation.wearabilityLabel"),
      value: tv("wearability", brief.wearability),
      provenance: brief.spec_provenance.wearability,
    },
  ];

  return (
    <section className="flex flex-col gap-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <SectionLabel>{t("designTranslation.specsLabel")}</SectionLabel>
        <span className="text-[11px] tracking-[0.22em] text-[var(--color-silver-600)] uppercase">
          {t("common.badges.engineDerived")}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-x-10 gap-y-2 sm:grid-cols-2 lg:grid-cols-3">
        {rows.map((row) => (
          <div key={row.label} className="design-attr">
            <span className="design-attr-label">
              {row.label}
              <span
                className={`ml-2 align-middle font-mono text-[9px] tracking-[0.18em] uppercase ${
                  row.provenance === "user"
                    ? "text-[var(--color-silver-400)]"
                    : "text-[var(--color-silver-600)]"
                }`}
              >
                {row.provenance === "user"
                  ? t("common.badges.userSelected")
                  : t("common.badges.aiSuggested")}
              </span>
            </span>
            <span className="design-attr-value">{row.value}</span>
            {row.note && (
              <span className="mt-1 max-w-md text-[12px] leading-relaxed text-[var(--color-silver-500)]">
                {row.note}
              </span>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
