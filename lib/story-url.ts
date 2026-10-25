/**
 * 3D 数字展厅链接 —— 品牌叙事二级入口（引擎 → 3D 叙事 → 成品站闭环）。
 *
 * 使用位置：首页 Act 3 幕内深链、页脚常驻链接（collection 静态站的
 * heritage 页另有一处静态入口）。UTM 参数由各使用处按入口拼接，
 * 因此这里只暴露不含查询参数的基础 URL。
 *
 * Q03 统一站整合（2026-10-25）：展厅已并入本应用 /gallery 路由，
 * 默认地址改为站内路径，不再依赖生产旧域环境变量即可进入；
 * 如需临时指向外部展厅，仍可用 NEXT_PUBLIC_3D_STORY_URL 覆盖。
 */
export const STORY_3D_URL =
  process.env.NEXT_PUBLIC_3D_STORY_URL ?? "/gallery";
