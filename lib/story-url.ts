/**
 * 3D 数字展厅链接 —— 品牌叙事二级入口（引擎 → 3D 叙事 → 成品站闭环）。
 *
 * 使用位置：首页 Act 3 幕内深链、页脚常驻链接（collection 静态站的
 * heritage 页另有一处静态入口）。UTM 参数由各使用处按入口拼接，
 * 因此这里只暴露不含查询参数的基础 URL。
 *
 * 地址通过环境变量配置，便于随时更换域名而无需改代码：
 *   NEXT_PUBLIC_3D_STORY_URL=https://3d.randomplayx.com
 * 未设置时使用线上默认地址（3D 站已稳定上线且同属品牌域）。
 */
export const STORY_3D_URL =
  process.env.NEXT_PUBLIC_3D_STORY_URL ?? "https://3d.randomplayx.com";
