import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "苗族银饰 · 非遗手作原型",
  description: "贵州苗族银饰非遗外贸独立站 3D 原型（MVP=#1 hero + #3 锻造加载 + #5 360°预览）",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh">
      <body>{children}</body>
    </html>
  );
}
