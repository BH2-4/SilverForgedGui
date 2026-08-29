"use client";

// 产品详情 3D 区：照搬 app/product/page.tsx 既有模式 ——
// 动态导入 + ssr:false（3D 不进首屏包），进视口(+200px 预载)才初始化 WebGL，
// 静态图首屏占位承担 LCP，容器固定宽高比（.viewer-wrap aspect-ratio 4/5）防 CLS。

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";

const Viewer = dynamic(() => import("@/components/ProductViewer"), {
  ssr: false,
  loading: () => (
    <div className="viewer-overlay">
      <div>3D 组件加载中…</div>
    </div>
  ),
});

export default function ViewerSection({
  model,
  poster,
  alt,
}: {
  model: string;
  poster: string;
  alt: string;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  /* 进视口(+200px 预载)才初始化 WebGL */
  useEffect(() => {
    if (!wrapRef.current) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setInView(true);
          io.disconnect();
        }
      },
      { rootMargin: "200px" }
    );
    io.observe(wrapRef.current);
    return () => io.disconnect();
  }, []);

  return (
    <div className="viewer-wrap" ref={wrapRef}>
      {/* 静态参考图:LCP 担当,WebGL 就绪后 3D 盖在其上 */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={poster} alt={alt} className="placeholder-img" />
      {inView && <Viewer url={model} />}
    </div>
  );
}
