"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useI18n } from "@/components/i18n/I18nProvider";
import { MotionReveal } from "@/components/visual/MotionReveal";
import { JOURNEY_STAGES } from "@/components/journey/journey-stages";

/**
 * JOURNEY SECTION — 首页的「设计旅程」。
 *
 * 不是目录，是一条银色垂线串起的空间路径：00 序章（可选访谈）
 * 与 01–05 五个主站，自上而下、从记忆到银。每一站只给一个名字、
 * 一句话与一个入口——大标题、极细线、零卡片。
 */
export function JourneySection() {
  const { t } = useI18n();

  return (
    <section
      id="journey"
      className="mx-auto max-w-[1400px] px-8 pb-40 sm:px-12 lg:px-16"
    >
      <MotionReveal as="div" className="flex flex-col gap-6 pb-20">
        <span className="act-label">{t("journey.eyebrow")}</span>
        <h2 className="act-title max-w-3xl">{t("journey.title")}</h2>
        <p className="act-body max-w-xl">{t("journey.subtitle")}</p>
      </MotionReveal>

      {/* 银色路径 —— 垂线贯穿六个站点 */}
      <div className="journey-path relative flex flex-col">
        {JOURNEY_STAGES.map((stage, i) => (
          <MotionReveal key={stage.code} as="div" delay={i * 70}>
            <Link
              href={stage.href}
              data-prologue={stage.prologue || undefined}
              className="journey-station group"
            >
              <span className="journey-station-node" aria-hidden>
                <span className="journey-station-dot" />
              </span>
              <span className="journey-station-body">
                <span className="journey-station-head">
                  <span className="journey-station-code font-mono">
                    {stage.code}
                  </span>
                  <span className="journey-station-name">
                    {t(stage.nameKey)}
                  </span>
                  {stage.prologue && (
                    <span className="journey-station-tag">
                      {t("journey.prologueLabel")}
                    </span>
                  )}
                </span>
                <span className="journey-station-desc">
                  {t(stage.descKey)}
                </span>
              </span>
              <span className="journey-station-enter">
                <span className="journey-station-enter-text">
                  {t("journey.enter")}
                </span>
                <ArrowRight
                  className="h-4 w-4 shrink-0"
                  strokeWidth={1.5}
                  aria-hidden
                />
              </span>
            </Link>
          </MotionReveal>
        ))}
      </div>
    </section>
  );
}
