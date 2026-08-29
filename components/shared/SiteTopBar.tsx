"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowUpRight } from "lucide-react";
import { BrandMark } from "@/components/shared/BrandMark";
import { LanguageSwitcher } from "@/components/i18n/LanguageSwitcher";
import { useI18n } from "@/components/i18n/I18nProvider";
import { COLLECTION_URL } from "@/lib/collection-url";

/**
 * 全局顶部导航条 — 博物馆 / 高级设计工作室风。
 *
 * 左品牌字标 / 中阶段导航（小号大写、宽字距，当前阶段亮起一根细线）
 * / 右语言切换。极轻、极静，不与页面内容争夺注意力。
 */
const STAGES = [
  { href: "/global-design", key: "common.stages.globalDemand", code: "01" },
  { href: "/cultural-match", key: "common.stages.culturalMatch", code: "02" },
  {
    href: "/design-translation",
    key: "common.stages.designTranslation",
    code: "03",
  },
  { href: "/design-proposal", key: "common.stages.designProposal", code: "04" },
  { href: "/design-render", key: "common.stages.designRender", code: "05" },
] as const;

function isStageActive(pathname: string | null, href: string): boolean {
  if (!pathname) return false;
  return pathname === href || pathname.startsWith(href);
}

export function SiteTopBar() {
  const pathname = usePathname();
  const { t } = useI18n();

  return (
    <div className="sticky top-0 z-40 border-b border-[var(--color-line)] bg-[rgba(0,0,0,0.78)] backdrop-blur-md supports-[backdrop-filter]:bg-[rgba(0,0,0,0.62)]">
      <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-8 px-8 py-5 sm:px-12 lg:px-16">
        <BrandMark />

        <nav
          aria-label={t("common.navAria")}
          className="hidden items-center gap-10 lg:flex"
        >
          {STAGES.map((s) => {
            const active = isStageActive(pathname, s.href);
            return (
              <Link
                key={s.href}
                href={s.href}
                aria-current={active ? "page" : undefined}
                className={`nav-stage group relative flex flex-col items-center gap-1.5 py-0.5 text-[13px] tracking-[0.16em] uppercase transition-colors duration-300 ${
                  active
                    ? "text-[var(--color-ivory)]"
                    : "text-[var(--color-silver-600)] hover:text-[var(--color-silver-300)]"
                }`}
              >
                {t(s.key).replace(/^\d+\s*·\s*/, "")}
                <span
                  aria-hidden
                  className={`nav-stage-line h-px bg-[var(--color-ivory)] transition-all duration-500 ${
                    active ? "w-full opacity-100" : "w-0 opacity-0"
                  } group-hover:w-full group-hover:opacity-60`}
                />
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-7">
          {/* 成品直购线 —— 跳转独立站，与定制线并行 */}
          <a
            href={COLLECTION_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="group hidden items-center gap-1.5 border-b border-transparent pb-0.5 text-[13px] tracking-[0.16em] text-[var(--color-silver-300)] uppercase transition-colors duration-300 hover:border-[var(--color-silver-300)] hover:text-[var(--color-ivory)] sm:inline-flex"
          >
            {t("common.collectionLabel")}
            <ArrowUpRight
              className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
              strokeWidth={1.5}
            />
          </a>
          <LanguageSwitcher />
        </div>
      </div>
    </div>
  );
}
