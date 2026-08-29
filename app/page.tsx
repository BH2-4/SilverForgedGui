"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { SectionLabel } from "@/components/shared/SectionLabel";
import { MotionReveal } from "@/components/visual/MotionReveal";
import { useI18n } from "@/components/i18n/I18nProvider";

/**
 * HOME — the entrance to the atelier.
 *
 * Rebuilt as an asymmetric editorial composition (55 / 45 on desktop):
 * left column holds the type, right column holds a floating "spatial
 * signature" — a hairline diagram of the six-stage journey that reads
 * as an object in the space, not a decoration.
 *
 * The composition uses the shared spatial-motion primitives from
 * globals.css and MotionReveal; no business logic is touched.
 */
export default function Home() {
  const { t } = useI18n();

  return (
    <main className="relative min-h-dvh">
      <div className="mx-auto flex min-h-dvh max-w-6xl flex-col px-6 py-8 sm:px-10 lg:px-14">
        <header className="flex items-center justify-between">
          <div className="flex items-baseline gap-3">
            <span className="text-[13px] tracking-[0.32em] text-[var(--color-silver-200)]">
              SILVER
            </span>
            <span className="text-[13px] tracking-[0.32em] text-[var(--color-silver-400)]">
              FUTURE
            </span>
          </div>
          <span className="eyebrow hidden sm:inline">{t("home.coCreationNote")}</span>
        </header>

        <section className="relative flex flex-1 flex-col justify-center py-20 lg:py-28">
          <div className="grid gap-16 lg:grid-cols-[1.15fr_1fr] lg:items-center lg:gap-24">
            {/* --- Left column: editorial title stack ------------------- */}
            <MotionReveal
              as="div"
              className="flex max-w-2xl flex-col gap-8 lg:pr-4"
            >
              <SectionLabel>{t("home.chapterLabel")}</SectionLabel>
              <h1 className="type-display">
                {t("home.title1")}
                <br />
                <span className="text-[var(--color-silver-400)]">
                  {t("home.title2")}
                </span>
              </h1>
              <p className="type-body max-w-xl">{t("home.intro")}</p>

              <div className="mt-6 flex flex-wrap items-center gap-5">
                <Link
                  href="/design-interview"
                  className="group depth-lift inline-flex items-center gap-3 rounded-full border border-[var(--color-line-strong)] bg-[linear-gradient(180deg,var(--color-silver-100),var(--color-silver-300))] px-7 py-3.5 text-[13px] font-medium tracking-[0.14em] text-[var(--color-bg)] uppercase hover:brightness-105 active:scale-[0.98]"
                >
                  {t("common.actions.enterStudio")}
                  <ArrowUpRight
                    className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                    strokeWidth={1.5}
                  />
                </Link>
                <span className="eyebrow">{t("home.engineNote")}</span>
              </div>
            </MotionReveal>

            {/* --- Right column: the spatial signature -----------------
                A hairline object that "floats" beside the title. It is
                the six-stage journey, drawn as one continuous vertical
                spine so the eye reads it as a diagram in the space,
                not decoration. All labels come from i18n. */}
            <MotionReveal
              as="aside"
              delay={220}
              className="relative hidden lg:block"
            >
              <div
                className="glass-panel depth-object relative overflow-hidden rounded-[var(--radius-lg)] px-9 py-10"
                aria-hidden
              >
                {/* Soft top rim + vertical spine — the only ornamentation. */}
                <div className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-[var(--color-line-strong)] to-transparent" />
                <span
                  className="absolute top-16 bottom-16 left-9 w-px bg-gradient-to-b from-transparent via-[var(--color-line-strong)] to-transparent"
                  aria-hidden
                />
                <ol className="relative flex flex-col gap-6 pl-10">
                  {[
                    { i: "01", key: "common.stages.globalDemand" },
                    { i: "02", key: "common.stages.culturalMatch" },
                    { i: "03", key: "common.stages.designTranslation" },
                    { i: "04", key: "common.stages.designProposal" },
                    { i: "05", key: "common.stages.designRender" },
                  ].map((row, index) => (
                    <li
                      key={row.i}
                      className="relative flex items-center gap-6"
                    >
                      <span
                        aria-hidden
                        className="absolute -left-[41px] top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-[var(--color-silver-500)]"
                        style={{
                          background:
                            index === 4
                              ? "var(--color-accent)"
                              : "var(--color-silver-500)",
                        }}
                      />
                      <span className="font-mono text-[10px] tracking-[0.22em] text-[var(--color-silver-600)] uppercase">
                        {row.i}
                      </span>
                      <span className="text-[13px] tracking-[0.06em] text-[var(--color-silver-200)]">
                        {t(row.key).replace(/^\d+\s*·\s*/, "")}
                      </span>
                    </li>
                  ))}
                </ol>
                <div className="mt-10 flex items-center gap-3 pt-6 border-t border-[var(--color-line)]">
                  <span className="type-meta">{t("home.footer1")}</span>
                </div>
              </div>
            </MotionReveal>
          </div>
        </section>

        <footer className="flex flex-col gap-4 border-t border-[var(--color-line)] pt-6 text-[11px] tracking-[0.14em] text-[var(--color-silver-500)] uppercase sm:flex-row sm:items-center sm:justify-between">
          <span>{t("home.footer1")}</span>
          <span>{t("home.footer2")}</span>
        </footer>
      </div>
    </main>
  );
}
