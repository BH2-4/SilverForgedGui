"use client";

import { Check } from "lucide-react";
import { useI18n } from "@/components/i18n/I18nProvider";
import { Disclosure } from "@/components/shared/Disclosure";
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
      <span className="text-[11px] tracking-[0.22em] text-[var(--color-silver-500)] uppercase">
        {label}
      </span>
      <div className="text-[14px] leading-relaxed text-[var(--color-silver-200)]">
        {children}
      </div>
    </div>
  );
}

/**
 * EXPERIENCE LAYER · Design direction card
 *
 * Stage 3 的方向卡片只保留「先看到、再选择」的信息量：名称、一句话、
 * 四个关键参数；完整设计日志（工艺、纹样、场景、情感、为什么适合你、
 * 文化来源与证据）收进渐进披露。15 项引擎数据一项不删。
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
      data-selected={selected}
      className="flex flex-col gap-7 border border-[var(--color-line)] bg-[#050506] p-7 transition-colors duration-300 sm:p-8 data-[selected=true]:border-[rgba(231,226,211,0.45)] data-[selected=true]:shadow-[0_0_0_1px_rgba(231,226,211,0.22)]"
    >
      {/* 1 名称 + 2 一句话描述 + 14 置信度 */}
      <header className="flex flex-col gap-3">
        <div className="flex items-baseline justify-between gap-4">
          <span className="text-[11px] tracking-[0.22em] text-[var(--color-silver-500)] uppercase">
            {t("designDirections.directionLetter", { letter })}
          </span>
          <span className="text-[11px] tracking-[0.22em] text-[var(--color-silver-500)] uppercase">
            {t("designDirections.fields.confidence")}{" "}
            {t("designDirections.confidenceValue", { value: String(confidencePct) })}
          </span>
        </div>
        <h3 className="font-sans text-[24px] leading-[1.1] tracking-[-0.01em] text-[var(--color-ivory)]">
          {t(`designDirections.direction.name.${tier}`)}
        </h3>
        <p className="text-[14px] leading-relaxed text-[var(--color-silver-300)]">
          {t(`designDirections.direction.desc.${tier}`)}
        </p>
      </header>

      {/* 关键参数 —— 先看到设计，再读日志 */}
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
      </div>

      {/* 完整设计日志 —— 渐进披露 */}
      <Disclosure label={t("common.actions.readDesignLog")}>
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-4">
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
            <span className="text-[11px] tracking-[0.22em] text-[var(--color-silver-500)] uppercase">
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
            <span className="text-[11px] tracking-[0.22em] text-[var(--color-silver-500)] uppercase">
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
                <span className="text-[12px] text-[var(--color-silver-500)]">
                  {t(`designDirections.values.meaning.${direction.meaning_status}`)} ·{" "}
                  {t(`designDirections.values.evidenceLevel.${direction.evidence_level}`)}
                  {direction.origin_match_score !== null
                    ? ` · ${direction.origin_match_score}/100`
                    : ""}
                </span>
                {direction.source_refs.length > 0 ? (
                  <span className="text-[12px] text-[var(--color-silver-600)]">
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
        </div>
      </Disclosure>

      {/* 选择动作 */}
      <button
        type="button"
        aria-pressed={selected}
        aria-label={t("designDirections.actions.chooseAria", { letter })}
        onClick={() => onChoose(direction.id)}
        data-variant={selected ? "solid" : undefined}
        className="journey-cta"
      >
        {selected ? <Check className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden /> : null}
        {t("designDirections.actions.choose")}
      </button>
    </article>
  );
}
