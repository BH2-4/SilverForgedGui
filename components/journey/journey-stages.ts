/**
 * JOURNEY — 一次设计旅程的空间定义。
 *
 * 整个定制流程被组织为「同一空间中的六个节点」：
 *   00 PROLOGUE  记忆访谈（可选起点）
 *   01–05        从你的故事到最终银饰
 *
 * 该常量只描述站点与路由的对应关系——不含任何业务状态，
 * 导航层（顶栏 JOURNEY 菜单、右侧 JourneyRail、首页 JourneySection）
 * 共用这一份定义，保证三处始终一致。
 */
export const JOURNEY_STAGES = [
  {
    code: "00",
    href: "/design-interview",
    nameKey: "journey.stations.s0.name",
    descKey: "journey.stations.s0.desc",
    prologue: true,
  },
  {
    code: "01",
    href: "/global-design",
    nameKey: "journey.stations.s1.name",
    descKey: "journey.stations.s1.desc",
    prologue: false,
  },
  {
    code: "02",
    href: "/cultural-match",
    nameKey: "journey.stations.s2.name",
    descKey: "journey.stations.s2.desc",
    prologue: false,
  },
  {
    code: "03",
    href: "/design-translation",
    nameKey: "journey.stations.s3.name",
    descKey: "journey.stations.s3.desc",
    prologue: false,
  },
  {
    code: "04",
    href: "/design-proposal",
    nameKey: "journey.stations.s4.name",
    descKey: "journey.stations.s4.desc",
    prologue: false,
  },
  {
    code: "05",
    href: "/design-render",
    nameKey: "journey.stations.s5.name",
    descKey: "journey.stations.s5.desc",
    prologue: false,
  },
] as const;

export type JourneyStage = (typeof JOURNEY_STAGES)[number];

/** 当前 pathname 属于旅程中的哪一站（-1 = 不在旅程中，如首页）。 */
export function stageIndexFromPathname(pathname: string | null): number {
  if (!pathname) return -1;
  return JOURNEY_STAGES.findIndex(
    (s) => pathname === s.href || pathname.startsWith(`${s.href}/`),
  );
}
