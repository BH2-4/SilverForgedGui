"use client";

import { useI18n } from "@/components/i18n/I18nProvider";

/**
 * Header for the Custom Design Proposal document. Mirrors the earlier
 * stages' visual language; states the pipeline lineage explicitly, with
 * Stage 04 (this page) as the current step.
 */
export function ProposalHeader() {
  const { t } = useI18n();

  return (
    <header className="relative flex flex-col gap-10 py-16 sm:py-24">
      {/* 展厅编号水印 */}
      <span aria-hidden className="stage-numeral">
        04
      </span>


      <div className="hairline" aria-hidden />

      <div className="relative z-10 flex flex-col gap-9 pt-2">
        <span className="stage-index">04 / Design</span>
        <div className="max-w-3xl animate-fade-in">
          <h1 className="act-title">
            {t("designProposal.headerTitle")}
          </h1>
          <p className="act-body mt-7 max-w-xl">
            {t("designProposal.headerSubtitle")}
          </p>
        </div>
      </div>
    </header>
  );
}
