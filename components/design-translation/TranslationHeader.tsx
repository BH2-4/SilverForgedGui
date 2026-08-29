"use client";

import { useI18n } from "@/components/i18n/I18nProvider";

/**
 * Header for the Design Translation studio. Mirrors the earlier stages'
 * visual language and states the pipeline lineage explicitly.
 */
export function TranslationHeader() {
  const { t } = useI18n();

  return (
    <header className="relative flex flex-col gap-10 py-16 sm:py-24">
      {/* 展厅编号水印 */}
      <span aria-hidden className="stage-numeral">
        03
      </span>



      <div className="relative z-10 flex flex-col gap-9 pt-2">
        <span className="stage-index">03 / Direction</span>
        <div className="max-w-3xl animate-fade-in">
          <h1 className="act-title">
            {t("designTranslation.headerTitle")}
          </h1>
          <p className="act-body mt-7 max-w-xl">
            {t("designTranslation.headerSubtitle")}
          </p>
        </div>
      </div>
    </header>
  );
}
