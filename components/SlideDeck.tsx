"use client";

import { Swiper, SwiperSlide } from "swiper/react";
import { EffectCards, Keyboard, Mousewheel, Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/effect-cards";
import "swiper/css/pagination";

const CARDS = [
  {
    img: "/images/butterfly.jpg",
    cap: "蝴蝶妈妈图腾",
    sub: "枫树化蝶,诞下十二蛋——苗族创世神话的族源记忆",
  },
  {
    img: "/images/chasing.jpg",
    cap: "錾刻工艺",
    sub: "上百支錾头、数万次锤击,浮凸纹样的手作成本",
  },
  {
    img: "/images/ornament.jpg",
    cap: "盛装体系",
    sub: "银冠银角层层叠戴,人未至而银铃相击声先到",
  },
  {
    img: "/images/bracelet.jpg",
    cap: "银镯 · 传承",
    sub: "传女不传子,一代代增重改样,流动的族谱",
  },
];

export default function SlideDeck() {
  return (
    <div className="deck-zone">
      <Swiper
        effect="cards"
        modules={[EffectCards, Keyboard, Mousewheel, Pagination]}
        cardsEffect={{ slideShadows: true, rotate: true, perSlideOffset: 10, perSlideRotate: 6 }}
        grabCursor
        keyboard
        mousewheel={{ forceToAxis: true }}
        pagination={{ clickable: true }}
      >
        {CARDS.map((c) => (
          <SwiperSlide key={c.cap}>
            <div className="deck-card">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={c.img} alt={c.cap} />
              <div className="deck-cap">
                <h3>{c.cap}</h3>
                <p>{c.sub}</p>
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
      <p className="deck-hint">拖拽 / 滚轮 / 方向键 · 划开卡牌</p>
    </div>
  );
}
