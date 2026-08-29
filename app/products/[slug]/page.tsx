// 产品详情动态路由（服务端渲染商品信息 DOM + 3D 懒加载区）
// Next 16 规范：params 为 Promise，需 await（见 node_modules/next/dist/docs）

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { products } from "@/data/products";
import type { Product } from "@/data/schema";
import ViewerSection from "./ViewerSection";

/** 分类中文标签（展示用） */
const categoryLabels: Record<Product["category"], string> = {
  headpieces: "头饰",
  neckpieces: "颈饰",
  chestpieces: "胸饰",
  earrings: "耳饰",
  handpieces: "手饰",
  garments: "盛装",
  craftworks: "工艺摆件",
};

/** 构造 Product 结构化数据（JSON-LD）；无价格数据，不含 offers */
function productJsonLd(p: Product) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: p.nameZh,
    alternateName: p.nameEn,
    description: p.descriptionZh,
    image: p.images,
    sku: p.id,
    category: p.category,
    brand: { "@type": "Brand", name: "苗银非遗手作" },
  };
}

/** #8 定制钩子可见化：只读标签（无任何配置器交互） */
function PersonalizationTags({ p }: { p: Product }) {
  const { engraving, totem, size } = p.personalization;
  if (!engraving && !totem && !size) return null;

  const chipStyle: React.CSSProperties = {
    display: "inline-block",
    padding: "4px 12px",
    marginRight: 8,
    marginBottom: 8,
    borderRadius: 999,
    border: "1px solid #3a3f4d",
    background: "#171a21",
    color: "#c9cedb",
    fontSize: 13,
    letterSpacing: 1,
  };

  return (
    <section style={{ marginTop: 24 }}>
      <h2 style={{ fontSize: 16, letterSpacing: 2, marginBottom: 12, color: "#e8e8ec" }}>
        可定制 · 选项
      </h2>
      <div>
        {engraving?.enabled && (
          <span style={chipStyle}>刻字 · 最多 {engraving.maxChars} 字</span>
        )}
        {totem?.map((t) => (
          <span key={t} style={chipStyle}>
            图腾 · {t}
          </span>
        ))}
        {size && (
          <span style={chipStyle}>
            尺寸 · {size.range} {size.unit}
          </span>
        )}
      </div>
      <p style={{ marginTop: 4, marginBottom: 0, fontSize: 12, color: "#8b93a7" }}>
        定制选项为工坊能力展示，下单定制流程即将开放
      </p>
    </section>
  );
}

/** 静态枚举全部产品 slug，构建期预渲染 */
export function generateStaticParams() {
  return products.map((p) => ({ slug: p.slug }));
}

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = products.find((p) => p.slug === slug);
  if (!product) return {};
  return {
    title: `${product.nameZh}（${product.nameEn}）· 苗族银饰`,
    description: product.descriptionZh,
    openGraph: {
      title: `${product.nameZh} · 苗族银饰非遗手作`,
      description: product.descriptionZh,
      images: [product.images[0]],
    },
  };
}

export default async function ProductDetailPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = products.find((p) => p.slug === slug);
  if (!product) notFound();

  const metaStyle: React.CSSProperties = { color: "#8b93a7", fontSize: 13, letterSpacing: 1 };

  return (
    <main>
      <nav className="nav">
        <a href="/">首页</a>
        <a href="/product">产品 · 360° 预览（demo）</a>
      </nav>
      <div className="container">
        <p style={{ ...metaStyle, margin: "16px 0 4px" }}>
          {categoryLabels[product.category]} · {product.id}
        </p>
        <h1 style={{ fontSize: 28, margin: "0 0 4px", letterSpacing: 2 }}>
          {product.nameZh}
        </h1>
        <p style={{ ...metaStyle, margin: "0 0 16px" }}>{product.nameEn}</p>

        {/* 3D 区：静态图首屏占位（LCP 担当），进视口才初始化 WebGL；固定宽高比防 CLS */}
        {product.model && (
          <>
            <ViewerSection
              model={product.model}
              poster={product.images[0]}
              alt={`${product.nameZh} · 静态参考图`}
            />
            <p style={{ marginTop: 12, color: "#8b93a7", fontSize: 14 }}>
              拖拽旋转 · 滚轮缩放（真实 GLB 几何 + 程序化银材质，reduced-motion
              自动降级）
            </p>
          </>
        )}

        {/* 商品信息（服务端渲染 DOM，SEO 可抓取） */}
        <section style={{ marginTop: 24 }}>
          <p style={{ fontSize: 15, lineHeight: 1.8, margin: 0, color: "#c9cedb" }}>
            {product.descriptionZh}
          </p>
          <p style={{ fontSize: 13, lineHeight: 1.7, margin: "8px 0 0", color: "#8b93a7" }}>
            {product.descriptionEn}
          </p>
        </section>

        {/* 非遗背景注记 */}
        <section
          style={{
            marginTop: 24,
            padding: "14px 16px",
            borderLeft: "2px solid #8b93a7",
            background: "#171a21",
            borderRadius: "0 8px 8px 0",
          }}
        >
          <h2 style={{ fontSize: 13, letterSpacing: 2, margin: "0 0 6px", color: "#8b93a7" }}>
            非遗注记
          </h2>
          <p style={{ margin: 0, fontSize: 14, lineHeight: 1.8, color: "#c9cedb" }}>
            {product.heritageNote}
          </p>
        </section>

        {/* #8 钩子可见化：只读定制标签 */}
        <PersonalizationTags p={product} />

        {/* 其余参考图（固定 1:1 防布局抖动） */}
        {product.images.length > 1 && (
          <section style={{ marginTop: 24 }}>
            <h2 style={{ fontSize: 16, letterSpacing: 2, marginBottom: 12, color: "#e8e8ec" }}>
              参考图集
            </h2>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
              {product.images.slice(1).map((src) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={src}
                  src={src}
                  alt={`${product.nameZh} 参考图`}
                  style={{ width: "100%", aspectRatio: "1 / 1", objectFit: "cover", borderRadius: 8, display: "block" }}
                />
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Product 结构化数据 */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd(product)) }}
      />
    </main>
  );
}
