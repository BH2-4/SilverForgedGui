"use client";

// /products 顶部横滑陈列区:复用 SlideDeck 的 Swiper 模式,effect 换 coverflow
// (金属件中心聚焦流廊)。本组件经 ProductCoverflowLazy 以 dynamic(ssr:false)
// 懒加载,不进首屏包。

import Link from "next/link";
import Image from "next/image";
import { Swiper, SwiperSlide } from "swiper/react";
import { EffectCoverflow, Keyboard, Mousewheel, Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/effect-coverflow";
import "swiper/css/pagination";

/** 流廊条目(纯数据,可跨 server/client 边界) */
export interface CoverflowItem {
  slug: string;
  nameZh: string;
  nameEn: string;
  image: string;
}

export default function ProductCoverflow({ items }: { items: CoverflowItem[] }) {
  return (
    <div className="cf-zone">
      <Swiper
        effect="coverflow"
        modules={[EffectCoverflow, Keyboard, Mousewheel, Pagination]}
        /* coverflow 实验室验证参数:中心正面聚焦,两侧 35° 斜切 + 120px 纵深 */
        coverflowEffect={{
          rotate: 35,
          stretch: 0,
          depth: 120,
          modifier: 1,
          slideShadows: true,
        }}
        grabCursor
        centeredSlides
        slidesPerView="auto"
        keyboard
        mousewheel={{ forceToAxis: true }}
        pagination={{ clickable: true }}
      >
        {items.map((it) => (
          <SwiperSlide key={it.slug} className="cf-slide">
            <Link href={`/products/${it.slug}`} className="cf-card">
              {/* 固定宽高比占位,防图片加载抖动 */}
              <span className="cf-img-wrap">
                <Image
                  src={it.image}
                  alt={`${it.nameZh} ${it.nameEn}`}
                  fill
                  sizes="260px"
                />
              </span>
              <span className="cf-cap">
                {it.nameZh} · {it.nameEn}
              </span>
            </Link>
          </SwiperSlide>
        ))}
      </Swiper>
      <p className="deck-hint">拖拽 / 滚轮 / 方向键 · 流廊聚焦</p>
    </div>
  );
}
