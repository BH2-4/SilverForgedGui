"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";

/* #5 验收:3D 组件动态导入 + ssr:false,不进首屏包 */
const Viewer = dynamic(() => import("@/components/ProductViewer"), {
  ssr: false,
  loading: () => (
    <div className="viewer-overlay">
      <div>3D 组件加载中…</div>
    </div>
  ),
});

export default function ProductPage() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  /* #5 验收:进入视口(+200px 预载)才初始化 WebGL */
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
    <main>
      <nav className="nav">
        <a href="/">首页</a>
        <a href="/products">Products</a>
        <a href="/product">产品 · 360° 预览</a>
      </nav>
      <div className="container">
        <h1 style={{ fontSize: 28, margin: "16px 0 4px" }}>银项圈 · 蝴蝶妈妈纹</h1>
        <p style={{ color: "#8b93a7", marginBottom: 16 }}>
          #5 360° 预览 + #3 锻造成型加载 · 静态图承担 LCP,3D 进视口才加载
        </p>

        <div className="viewer-wrap" ref={wrapRef}>
          {/* 静态参考图:LCP 担当,WebGL 就绪后 3D 盖在其上 */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/collar-ref-1.jpg"
            alt="苗族银项圈 · 博物馆参考图"
            className="placeholder-img"
          />
          {inView && <Viewer url="/models/collar-meshopt.glb" />}
        </div>

        <p style={{ marginTop: 12, color: "#8b93a7", fontSize: 14 }}>
          拖拽旋转 · 滚轮缩放(真实 GLB 几何 + 程序化银材质,法线为加载时补算)
        </p>
      </div>
    </main>
  );
}
