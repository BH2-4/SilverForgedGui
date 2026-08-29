"use client";

import { SectionLabel } from "@/components/shared/SectionLabel";
import { useI18n } from "@/components/i18n/I18nProvider";
import type { OrientationSummary } from "@/lib/design/schemas";
import type { GlobalDesignBrief } from "@/lib/ai/schemas";

interface OrientationPanelProps {
  brief: GlobalDesignBrief;
  orientation: OrientationSummary;
}

/**
 * SECTION 01 — 「你的方向」
 *
 * One hedged, plain-language sentence about where the customer is heading,
 * plus the state of their Stage 2 cultural match. Never an absolute
 * judgement: the copy stays in "更倾向于 / 目前看来" territory (see the
 * designDirections i18n section). Explicitly labeled AI preference reading
 * — never cultural fact.
 */
export function OrientationPanel({ brief, orientation }: OrientationPanelProps) {
  const { t, tv } = useI18n();

  const style = brief.style.length > 0 ? tv("style", brief.style[0]) : tv("style", "modern");
  const summary = t("designDirections.orientationSummary", {
    style,
    product: tv("product", brief.product_type),
    count: String(orientation.match_count),
  });

  return (
    <section className="flex flex-col gap-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <SectionLabel>{t("designDirections.section1Label")}</SectionLabel>
        <span className="text-[10px] tracking-[0.22em] text-[var(--color-silver-600)] uppercase">
          {t("designDirections.section1Note")}
        </span>
      </div>

      <p className="font-editorial max-w-3xl text-[28px] leading-[1.15] tracking-[-0.01em] text-[var(--color-ivory)] sm:text-[36px]">
        {summary}
      </p>

      <div className="flex flex-col gap-2 border-t border-[var(--color-line)] pt-5 text-[13px] leading-relaxed text-[var(--color-silver-400)]">
        {orientation.selected_name ? (
          <span className="text-[var(--color-silver-300)]">
            {t("designDirections.orientationSelected", {
              name: orientation.selected_name,
            })}
          </span>
        ) : (
          <span>{t("designDirections.orientationNoMatch")}</span>
        )}
        <span className="text-[11px] tracking-[0.08em] text-[var(--color-silver-600)]">
          {t("designDirections.orientationPool", {
            count: String(orientation.match_count),
          })}
        </span>
      </div>
    </section>
  );
}
