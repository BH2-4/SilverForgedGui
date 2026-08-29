// REVIEW_PENDING: 文案待人工审核（见 data/COPY-REVIEW.md）
// /products 产品列表页(服务端组件):读 data/products.ts 渲染卡片网格
// + 顶部 coverflow 横滑流廊。/product(单数)为 360° 预览 demo,两者并存。

import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { products } from "@/data/products";
import type { ProductCategory } from "@/data/schema";
import ProductCoverflowLazy from "@/components/ProductCoverflowLazy";

export const metadata: Metadata = {
  title: "产品系列 · 苗族银饰",
  description:
    "苗族银饰全系列:繁花银冠、月牙银角、图腾银胸牌、盘龙银镯、螺旋银耳坠、苗银项圈——非遗锻制技艺手作,数字陈列。",
};

/** 品类中文标签(schema 7 类全覆盖,防数据扩展漏标) */
const CATEGORY_LABELS: Record<ProductCategory, string> = {
  headpieces: "头饰",
  neckpieces: "项饰",
  chestpieces: "胸饰",
  earrings: "耳饰",
  handpieces: "手饰",
  garments: "盛装",
  craftworks: "工艺品",
};

export default function ProductsPage() {
  /* 流廊数据:每件取首图(纯字符串,可序列化跨 server/client 边界) */
  const coverflowItems = products.map((p) => ({
    slug: p.slug,
    nameZh: p.nameZh,
    nameEn: p.nameEn,
    image: p.images[0],
  }));

  return (
    <main>
      <nav className="nav">
        <a href="/">首页</a>
        <a href="/products" aria-current="page">
          Products
        </a>
        <a href="/product">产品 · 360° 预览</a>
      </nav>

      <header className="container products-head">
        <h1>产品系列</h1>
        <p>苗银六件 —— 非遗手作数字陈列</p>
      </header>

      {/* 顶部横滑:coverflow 中心聚焦流廊(client 懒加载,ssr:false) */}
      <section className="container cf-section" aria-label="产品横滑陈列">
        <ProductCoverflowLazy items={coverflowItems} />
      </section>

      {/* 产品卡网格:语义化 article + Link,图片固定宽高比占位防 CLS */}
      <section className="container" aria-label="全部产品">
        <h2 className="products-grid-h">全部产品</h2>
        <ul className="products-grid">
          {products.map((p) => (
            <li key={p.slug}>
              <article className="pcard">
                <Link href={`/products/${p.slug}`} className="pcard-link">
                  <div className="pcard-img-wrap">
                    <Image
                      src={p.images[0]}
                      alt={`${p.nameZh}(${p.nameEn})`}
                      fill
                      sizes="(max-width: 860px) 92vw, (max-width: 1080px) 45vw, 30vw"
                    />
                  </div>
                  <div className="pcard-body">
                    <div className="pcard-names">
                      <strong>{p.nameZh}</strong>
                      <em>{p.nameEn}</em>
                    </div>
                    <span className="pcard-tag">{CATEGORY_LABELS[p.category]}</span>
                  </div>
                </Link>
              </article>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
