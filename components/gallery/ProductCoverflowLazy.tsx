"use client";

// Next 16 约束:ssr:false 的 dynamic import 只能用在 Client Component,
// 服务端页面(app/products/page.tsx)经本包装组件间接懒加载 Swiper 流廊。

import dynamic from "next/dynamic";

const ProductCoverflowLazy = dynamic(() => import("./ProductCoverflow"), {
  ssr: false,
  /* 与流廊真实高度近似的固定占位,减少懒加载完成时的布局跳动 */
  loading: () => <div className="cf-fallback" aria-hidden="true" />,
});

export default ProductCoverflowLazy;
