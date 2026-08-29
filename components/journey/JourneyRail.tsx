"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useI18n } from "@/components/i18n/I18nProvider";
import {
  JOURNEY_STAGES,
  stageIndexFromPathname,
} from "@/components/journey/journey-stages";

/**
 * JOURNEY RAIL — Stage 页面右侧的空间导航。
 *
 * 一条极细的银色垂线，串起 00–05 六个节点：当前站亮起实心点，
 * 其余为空心弱节点；hover 时站名在节点左侧浮现。它是「你在
 * 设计空间中的位置」，不是菜单——不承载任何业务状态。
 *
 * 仅在旅程页面（design-interview / global-design / …）渲染；
 * 首页与成品站不出现。移动端不渲染（内容优先）。
 */
export function JourneyRail() {
  const pathname = usePathname();
  const { t } = useI18n();
  const index = stageIndexFromPathname(pathname);

  if (index < 0) return null;

  return (
    <nav aria-label={t("journey.railAria")} className="journey-rail">
      {JOURNEY_STAGES.map((stage, i) => {
        const active = i === index;
        const visited = i < index;
        return (
          <Link
            key={stage.code}
            href={stage.href}
            aria-current={active ? "page" : undefined}
            aria-label={`${stage.code} · ${t(stage.nameKey)}`}
            className={`journey-rail-node ${active ? "is-active" : ""} ${
              visited ? "is-visited" : ""
            }`}
          >
            <span className="journey-rail-dot" aria-hidden />
            <span className="journey-rail-label">
              <span className="journey-rail-code">{stage.code}</span>
              {t(stage.nameKey)}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
