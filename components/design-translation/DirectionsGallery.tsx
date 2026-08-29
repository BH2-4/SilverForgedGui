"use client";

import { RefreshCw, HelpCircle } from "lucide-react";
import { SectionLabel } from "@/components/shared/SectionLabel";
import { useI18n } from "@/components/i18n/I18nProvider";
import type { DesignDirection } from "@/lib/design/schemas";
import { DirectionCard } from "./DirectionCard";

interface DirectionsGalleryProps {
  directions: DesignDirection[];
  selectedId: string | null;
  busy: boolean;
  onChoose: (directionId: string) => void;
  onRefresh: () => void;
  onNotSure: () => void;
}

const LETTERS = ["A", "B", "C"] as const;

/**
 * SECTION 03 — 「为你生成 3 个设计方向」
 *
 * Structural differentiation is engine-side; the gallery only lays the
 * cards out and owns the three customer actions: pick a direction, ask for
 * another batch (engine refresh rotation), or stay undecided (server falls
 * back to the DNA-nearest tier).
 */
export function DirectionsGallery({
  directions,
  selectedId,
  busy,
  onChoose,
  onRefresh,
  onNotSure,
}: DirectionsGalleryProps) {
  const { t } = useI18n();

  return (
    <section className="flex flex-col gap-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <SectionLabel>{t("designDirections.section3Label")}</SectionLabel>
      </div>
      <p className="max-w-xl text-[12px] leading-relaxed text-[var(--color-silver-600)]">
        {t("designDirections.section3Note")}
      </p>

      <div
        className={`flex flex-col gap-8 transition-opacity duration-300 lg:grid lg:grid-cols-3 lg:gap-6 ${
          busy ? "pointer-events-none opacity-40" : "opacity-100"
        }`}
      >
        {directions.map((direction, i) => (
          <DirectionCard
            key={direction.id}
            direction={direction}
            letter={LETTERS[i] ?? direction.id}
            selected={selectedId === direction.id}
            onChoose={onChoose}
          />
        ))}
      </div>

      <div className="flex flex-col gap-3 border-t border-[var(--color-line)] pt-6 sm:flex-row sm:items-center sm:gap-8">
        <button
          type="button"
          onClick={onRefresh}
          disabled={busy}
          className="inline-flex items-center gap-2 text-[12px] tracking-[0.14em] text-[var(--color-silver-400)] uppercase transition-colors hover:text-[var(--color-ivory)] disabled:opacity-50"
        >
          <RefreshCw className="h-3.5 w-3.5" strokeWidth={1.5} />
          {t("designDirections.actions.refresh")}
        </button>
        <button
          type="button"
          onClick={onNotSure}
          disabled={busy}
          className="inline-flex items-center gap-2 text-[12px] tracking-[0.14em] text-[var(--color-silver-400)] uppercase transition-colors hover:text-[var(--color-ivory)] disabled:opacity-50"
        >
          <HelpCircle className="h-3.5 w-3.5" strokeWidth={1.5} />
          {t("designDirections.actions.notSure")}
        </button>
      </div>
    </section>
  );
}
