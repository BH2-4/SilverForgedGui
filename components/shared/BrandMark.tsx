"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

interface BrandMarkProps {
  /** 渲染形式：链接到首页 / 纯标识 */
  as?: "link" | "span";
  /** 是否显示中文副位「银中贵」 */
  showZh?: boolean;
  className?: string;
}

/**
 * 银中贵 · Silver Forged Gui — 苹果风品牌字标。
 *
 * 纯净白字、无衬线、中等字重，无渐变无特效。中文「银中贵」以一道
 * 短竖线相隔，沉一阶灰。整体克制大气，面向国际用户。
 * `as="link"` 时整体指向首页。
 */
export function BrandMark({
  as = "link",
  showZh = true,
  className,
}: BrandMarkProps) {
  const content = (
    <span className={cn("brand-mark inline-flex items-center gap-3", className)}>
      <span className="brand-mark-text text-[18px] font-semibold leading-none tracking-[0.12em] uppercase">
        Silver&nbsp;Forged&nbsp;Gui
      </span>
      {showZh && (
        <>
          <span
            aria-hidden
            className="h-4 w-px bg-[var(--color-line-strong)]"
          />
          <span
            aria-hidden
            className="text-[14px] tracking-[0.32em] text-[var(--color-silver-500)]"
          >
            银中贵
          </span>
        </>
      )}
    </span>
  );

  if (as === "span") return content;

  return (
    <Link
      href="/"
      className="brand-mark group inline-flex items-center"
      aria-label="银中贵 Silver Forged Gui — 首页"
    >
      {content}
    </Link>
  );
}
