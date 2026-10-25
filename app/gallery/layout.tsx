import type { Metadata } from "next";
import "./globals.css";

// 展厅路由组布局：仅提供 .g-scope 作用域容器与展厅专属样式，
// html/body/字体/全局顶栏沿用正式站根布局，不在此重复定义。
export const metadata: Metadata = {
  title: "3D 数字展厅 · 银中贵",
  description:
    "苗族银饰 3D 交互叙事：全页滚动叙事、实时 3D 银饰与工艺图腾卡牌（源自原 3D 展厅，并入统一站）",
};

export default function GalleryLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <div className="g-scope">{children}</div>;
}
