/**
 * 成品独立站链接 —— 双路线中的"直接选购"线。
 *
 * 定制线（Stage 0-5）之外，用户可一键跳转到成品系列，直接浏览
 * 已有档案款式并询价。
 *
 * 地址通过环境变量配置，便于随时更换域名而无需改代码：
 *   .env.local 里设置 NEXT_PUBLIC_COLLECTION_URL=https://your-shop.example
 * 未设置、空值或旧 "#" 占位时，默认指向站内静态成品站
 * /collection/index.html（统一应用内完整可达，本地未配置不退回死链）。
 */
const CONFIGURED_COLLECTION_URL = process.env.NEXT_PUBLIC_COLLECTION_URL;

export const COLLECTION_URL =
  CONFIGURED_COLLECTION_URL && CONFIGURED_COLLECTION_URL !== "#"
    ? CONFIGURED_COLLECTION_URL
    : "/collection/index.html";

/** 是否已配置真实成品站地址（保留兼容导出；默认站内路径亦为真实入口）。 */
export const HAS_COLLECTION_URL = COLLECTION_URL !== "#";