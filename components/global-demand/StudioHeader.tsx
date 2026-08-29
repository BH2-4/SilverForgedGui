"use client";

import { useI18n } from "@/components/i18n/I18nProvider";

export function StudioHeader() {
  const { t } = useI18n();

  return (
    <header className="relative flex flex-col gap-10 py-16 sm:py-24">
      {/* 展厅编号水印 —— 沉在右上角，极静 */}
      <span aria-hidden className="stage-numeral">
        01
      </span>


      <div className="hairline" aria-hidden />

      <div className="relative z-10 flex flex-col gap-9 pt-2">
        <span className="stage-index">01 / Intent</span>
        <div className="max-w-3xl animate-fade-in">
          <h1 className="act-title">{t("globalDemand.headerTitle")}</h1>
          <p className="act-body mt-7 max-w-xl">{t("globalDemand.headerSubtitle")}</p>
        </div>
      </div>
    </header>
  );
}
