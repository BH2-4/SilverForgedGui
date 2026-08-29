/**
 * 成品独立站链接 —— 双路线中的"直接选购"线。
 *
 * 定制线（Stage 0-5）之外，用户可一键跳转到银饰独立站平台，
 * 直接浏览已有成品并询盘 / 购买。
 *
 * 地址通过环境变量配置，便于随时更换域名而无需改代码：
 *   .env.local 里设置 NEXT_PUBLIC_COLLECTION_URL=https://your-shop.example
 * 未设置时为 "#" 占位，点击无跳转（上线前务必配置）。
 */
export const COLLECTION_URL =
  process.env.NEXT_PUBLIC_COLLECTION_URL ?? "#";

/** 是否已配置真实成品站地址（用于决定链接是否可交互的兜底判断）。 */
export const HAS_COLLECTION_URL = COLLECTION_URL !== "#";