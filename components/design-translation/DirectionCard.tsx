"use client";

import { Check } from "lucide-react";
import { useI18n } from "@/components/i18n/I18nProvider";
import type {
  DesignDirection,
  WhyItem,
} from "@/lib/design/schemas";

interface DirectionCardProps {
  direction: DesignDirection;
  letter: string;
  selected: boolean;
  onChoose: (directionId: string) => void;
}

/** Render one engine template sentence (WhyItem) through t(). */
function TemplateLine({ item }: { item: WhyItem }) {
  const { t } = useI18n();
  return <>{t(`designDirections.${item.key}`, item.vars)}</>;
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5 border-t border-[var(--color-line)] pt-4">
      <span className="text-[10px] tracking-[0.22em] text-[var(--color-silver-500)] uppercase">
        {label}
      </span>
      <div className="text-[14px] leading-relaxed text-[var(--color-silver-200)]">
        {children}
      </div>
    </div>
  );
}

/**
 * SECTION 03 — one design direction card.
 *
 * Renders all 15 required aspects of a direction through i18n templates
 * (engine emits keys + vars, never copy). Cultural honesty is structural:
 * the motif line and risk line surface the standard “visual record only”
 * wording whenever meaning_status is not “documented”, and confidence /
 * evidence level always show their real value.
 */
export function DirectionCard({
  direction,
  letter,
  selected,
  onChoose,
}: DirectionCardProps) {
  const { t, tv } = useI18n();
  const tier = direction.tier;

  const motif = direction.motif_elements[0] ?? null;
  const confidencePct = Math.round(direction.confidence * 100);

  return (
    <article
      className={`glass-panel flex flex-col gap-7 rounded-[var(--radius-lg)] p-7 transition-colors duration-300 sm:p-9 ${
        selected
          ? "border-[var(--color-line-strong)] bg-[var(--color-silver-100)/0.05]"
          : ""
      }`}
    >
      {/* 1 名称 + 2 一句话描述 + 14 置信度 */}
      <header className="flex flex-col gap-3">
        <div className="flex items-baseline justify-between gap-4">
          <span className="text-[10px] tracking-[0.22em] text-[var(--color-silver-500)] uppercase">
            {t("designDirections.directionLetter", { letter })}
          </span>
          <span className="text-[10px] tracking-[0.22em] text-[var(--color-silver-500)] uppercase">
            {t("designDirections.fields.confidence")}{" "}
            {t("designDirections.confidenceValue", { value: String(confidencePct) })}
          </span>
        </div>
        <h3 className="font-editorial text-[30px] leading-[1.1] tracking-[-0.01em] text-[var(--color-ivory)]">
          {t(`designDirections.direction.name.${tier}`)}
        </h3>
        <p className="text-[14px] leading-relaxed text-[var(--color-silver-300)]">
          {t(`designDirections.direction.desc.${tier}`)}
        </p>
      </header>

      {/* 3–10 设计内容 */}
      <div className="flex flex-col gap-4">
        <Field label={t("designDirections.fields.keywords")}>
          {direction.design_keywords
            .map((keyword) => tv("style", keyword))
            .join(" · ")}
        </Field>
        <Field label={t("designDirections.fields.product")}>
          {tv("product", direction.form_token)}
        </Field>
        <Field label={t("designDirections.fields.scale")}>
          {t(`designDirections.values.scale.${direction.recommended_scale}`)}
        </Field>
        <Field label={t("designDirections.fields.material")}>
          {t(`designDirections.values.finish.${direction.material_finish}`)}
        </Field>
        {direction.crafts.length > 0 ? (
          <Field label={t("designDirections.fields.craft")}>
            {direction.crafts.map((craft) => craft.name).join(" · ")}
          </Field>
        ) : null}
        {/* 8 纹样 — visual-only wording is the default, documented the exception */}
        <Field label={t("designDirections.fields.motif")}>
          {motif ? (
            <span>
              {motif.name} ·{" "}
              <span
                className={
                  motif.presented_as === "documented-meaning"
                    ? "text-[var(--color-silver-300)]"
                    : "text-[var(--color-silver-500)]"
                }
              >
                {t(`designDirections.motifPresented.${motif.presented_as}`)}
              </span>
            </span>
          ) : (
            <span className="text-[var(--color-silver-500)]">
              {t("designDirections.motifNone")}
            </span>
          )}
        </Field>
        <Field label={t("designDirections.fields.scene")}>
          {direction.wearing_scenes
            .map((scene) => tv("occasion", scene))
            .join(" · ")}
        </Field>
        <Field label={t("designDirections.fields.emotion")}>
          {direction.emotional_expression
            .map((emotion) => tv("emotion", emotion))
            .join(" · ")}
        </Field>
      </div>

      {/* 11 为什么适合你 — AI 推断，模板化 */}
      <div className="flex flex-col gap-2 border-t border-[var(--color-line)] pt-4">
        <span className="text-[10px] tracking-[0.22em] text-[var(--color-silver-500)] uppercase">
          {t("designDirections.fields.why")}
        </span>
        <ul className="flex flex-col gap-1.5 text-[13px] leading-relaxed text-[var(--color-silver-400)]">
          {direction.why_suitable.map((item, i) => (
            <li key={i}>
              <TemplateLine item={item} />
            </li>
          ))}
        </ul>
      </div>

      {/* 12 文化来源 + 13 官方证据 */}
      <div className="flex flex-col gap-2 border-t border-[var(--color-line)] pt-4">
        <span className="text-[10px] tracking-[0.22em] text-[var(--color-silver-500)] uppercase">
          {t("designDirections.fields.source")}
        </span>
        {direction.heritage_reference ? (
          <div className="flex flex-col gap-1 text-[13px] leading-relaxed text-[var(--color-silver-300)]">
            <span>
              {direction.heritage_reference.name}
              {direction.heritage_reference.region
                ? ` · ${direction.heritage_reference.region}`
                : ""}
            </span>
            <span className="text-[11px] text-[var(--color-silver-500)]">
              {t(`designDirections.values.meaning.${direction.meaning_status}`)} ·{" "}
              {t(`designDirections.values.evidenceLevel.${direction.evidence_level}`)}
              {direction.origin_match_score !== null
                ? ` · ${direction.origin_match_score}/100`
                : ""}
            </span>
            {direction.source_refs.length > 0 ? (
              <span className="text-[11px] text-[var(--color-silver-600)]">
                {t("designDirections.fields.evidence")}:{" "}
                {direction.source_refs.map((ref) => ref.title).join(" · ")}
              </span>
            ) : null}
          </div>
        ) : (
          <div className="text-[13px] leading-relaxed text-[var(--color-silver-500)]">
            <TemplateLine
              item={{
                key: "why.formLed",
              }}
            />
          </div>
        )}
      </div>

      {/* 15 风险提示 */}
      <div className="flex flex-col gap-2 border-t border-[var(--color-line)] pt-4">
        <span className="text-[10px] tracking-[0.22em] text-[var(--color-silver-500)] uppercase">
          {t("designDirections.fields.risk")}
        </span>
        <ul className="flex flex-col gap-1.5 text-[12px] leading-relaxed text-[var(--color-silver-500)]">
          {direction.uncertainties.map((item, i) => (
            <li key={i}>
              <TemplateLine item={item} />
            </li>
          ))}
        </ul>
      </div>

      {/* 选择动作 */}
      <button
        type="button"
        aria-pressed={selected}
        aria-label={t("designDirections.actions.chooseAria", { letter })}
        onClick={() => onChoose(direction.id)}
        className={`inline-flex items-center justify-center gap-2.5 rounded-full px-6 py-3.5 text-[12px] font-medium tracking-[0.14em] uppercase transition-all duration-300 active:scale-[0.97] ${
          selected
            ? "border border-[var(--color-line-strong)] bg-[linear-gradient(180deg,var(--color-silver-100),var(--color-silver-300))] text-[var(--color-bg)]"
            : "border border-[var(--color-line-strong)] text-[var(--color-silver-200)] hover:text-[var(--color-ivory)] hover:brightness-110"
        }`}
      >
        {selected ? <Check className="h-4 w-4" strokeWidth={1.5} /> : null}
        {t("designDirections.actions.choose")}
      </button>
    </article>
  );
}
