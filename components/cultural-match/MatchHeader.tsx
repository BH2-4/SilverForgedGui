"use client";

import Image from "next/image";
import { useI18n } from "@/components/i18n/I18nProvider";

export function MatchHeader() {
  const { t } = useI18n();

  return (
    <header className="relative flex flex-col gap-10 py-16 sm:py-24">
      {/* 展厅编号水印 */}
      <span aria-hidden className="stage-numeral">
        02
      </span>



      {/* 档案馆 hero —— 文字与大图错位排布，图渐隐入黑暗 */}
      <div className="relative z-10 grid gap-12 pt-2 lg:grid-cols-[1.1fr_1fr] lg:items-center">
        <div className="flex flex-col gap-9">
          <span className="stage-index">02 / Culture</span>
          <div className="max-w-2xl animate-fade-in">
            <h1 className="act-title">{t("culturalMatch.headerTitle")}</h1>
            <p className="act-body mt-7 max-w-lg">
              {t("culturalMatch.headerSubtitle")}
            </p>
          </div>
        </div>

        {/* 数字档案馆的视觉主体 —— 银冠沉在黑空间中 */}
        <figure className="exhibition-plinth relative hidden lg:block">
          <div
            className="stage-hero-visual relative aspect-[4/5] max-h-[420px] w-full"
            data-hoverable="true"
          >
            <Image
              src="/atelier/culture-silver.jpg"
              alt={t("culturalMatch.headerTitle")}
              fill
              priority
              sizes="(min-width: 1024px) 40vw, 0px"
              className="object-cover"
            />
            {/* 渐隐入黑暗 —— 博物馆照明 */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0"
              style={{
                maskImage:
                  "radial-gradient(120% 90% at 50% 45%, black 45%, transparent 95%)",
                WebkitMaskImage:
                  "radial-gradient(120% 90% at 50% 45%, black 45%, transparent 95%)",
                background:
                  "linear-gradient(180deg, rgba(0,0,0,0.1), rgba(0,0,0,0.45))",
              }}
            />
          </div>
          <figcaption className="exhibit-label mt-5">
            Heritage Archive · Guizhou
          </figcaption>
        </figure>
      </div>
    </header>
  );
}
