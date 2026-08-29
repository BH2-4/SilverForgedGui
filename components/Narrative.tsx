"use client";

import { useEffect, useRef, useState } from "react";

/* 测试占位内容(文案为示例质量,上线前需非遗合作方校验) */
const CARDS = [
  {
    id: "butterfly",
    title: "蝴蝶妈妈 · 创世图腾",
    teaser:
      "《苗族古歌》里,枫树心化出蝴蝶妈妈,她与水泡游方,生下十二个蛋,其中一个孵出了人类始祖姜央。",
    img: "/images/butterfly.jpg",
    detail: [
      "蝴蝶妈妈(Mej Bangx Mej Lief)是苗族神话中的始祖形象。传说枫树被砍倒后,树心化作蝴蝶,与水泡游方十二天,产下十二个蛋,其中一枚孵出人类祖先姜央——因此苗人尊蝶为祖。",
      "银饰上的蝶纹因此不是装饰,而是族源记忆的携带体。黔东南银匠锤下的蝶纹有数十种变体:蝶身嵌鸟、蝶翅衔鱼、蝶腹藏石榴,每一变体都对应一支迁徙支系的口传谱系。",
      "佩戴蝶纹银饰,等于把创世神话戴在身上——这是本站文化叙事的第一张牌:先讲蝴蝶,再讲银。",
    ],
  },
  {
    id: "chasing",
    title: "錾刻 · 一錾一痕的手艺",
    teaser:
      "一片银到一件银饰,要经熔炼、锻打、錾刻、洗银等数十道工序;仅錾刻一步,匠人就需上百支不同錾头。",
    img: "/images/chasing.jpg",
    detail: [
      "錾刻分「錾花」与「錾刻」两路:錾花以弯錾在银面走出阴文线稿,錾刻以窝錾、豆錾顶出浮雕。一件银冠上的浮凸纹样,是匠人交替使用数十种錾头、数万次锤击的累积。",
      "錾头按刃形分:直、弯、勾、沙、丝、豆、窝——匠人自制的錾具往往不外传,这是「手作」二字的真实成本,也是与铸模制品的根本分界。",
      "3D 特写镜头要展示的正是这个:錾口的高光走向、浮雕的深浅节奏。此为后续带 UV 精模的核心叙事素材。",
    ],
  },
  {
    id: "ornament",
    title: "盛装 · 无银不成女",
    teaser:
      "苗谚说「无银不成女」。盛装之日,银冠、银角、银项圈层层叠戴,走动时银铃相击,人未至而声先到。",
    img: "/images/ornament.jpg",
    detail: [
      "黔东南苗族的盛装银饰是完整体系:银角高耸如月,银冠覆顶,银项圈、银压领、银衣片层层叠叠,全套可达十余公斤。",
      "银饰盛装只在芦笙节、姊妹节、婚嫁等重大场合穿戴。行走时银片相击的清脆声响,是盛装的「听觉维度」——银饰不仅被看,也被听见。",
      "对外贸站而言,盛装体系是「场景化陈列」的天然素材:不做单件罗列,而做整套叙事。",
    ],
  },
  {
    id: "bracelet",
    title: "银镯 · 财富与传承",
    teaser:
      "银饰既是穿戴,也是家庭财富的便携形态——「钱在身上,家在背上」。传女不传子,一代代增重改样。",
    img: "/images/bracelet.jpg",
    detail: [
      "历史上苗寨以银为储值手段,银饰即「可穿戴的家产」。迁徙文化把财富铸成可背负的形态,这是苗族银饰体量惊人的经济根源。",
      "银镯常刻有支系标识纹样,母亲传给女儿时往往再加一环或改一纹——银饰因此是流动的族谱。",
      "这条脉络指向本站的定制业务(#8 配置器):刻字、选纹、改圈口,本质是让用户参与「增重改样」的传承动作。",
    ],
  },
];

export default function Narrative() {
  const sectionRef = useRef<HTMLElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);
  const [open, setOpen] = useState<number | null>(null);

  /* 叙事段进度标签(rAF 直写 DOM,不触发重渲染;实际旋转由 ScrollScene 驱动) */
  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      const el = sectionRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const total = rect.height - window.innerHeight;
      const p = Math.min(1, Math.max(0, -rect.top / total));
      if (labelRef.current) labelRef.current.textContent = `${Math.round(p * 100)}%`;
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    update();
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  /* 卡片渐显 */
  useEffect(() => {
    const root = sectionRef.current;
    if (!root) return;
    const io = new IntersectionObserver(
      (es) => es.forEach((e) => e.isIntersecting && e.target.classList.add("visible")),
      { threshold: 0.2 }
    );
    root.querySelectorAll(".kcard").forEach((c) => io.observe(c));
    return () => io.disconnect();
  }, []);

  /* Esc 关闭弹层 */
  useEffect(() => {
    const fn = (e: KeyboardEvent) => e.key === "Escape" && setOpen(null);
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, []);

  return (
    <section id="sec-story" ref={sectionRef} style={{ position: "relative", minHeight: "300vh" }}>
      <div className="story-grid">
        {/* 左:3D 锚位区(模型由全页 ScrollScene 滑入此栏,滚动旋转至正面) */}
        <div className="story-left">
          <div className="story-anchor" />
          <div className="story-hint">
            滚动旋转 → 正面锁定(测试) · 旋转进度{" "}
            <span ref={labelRef}>0%</span>
          </div>
        </div>

        {/* 右:知识卡片,渐显 + 点击展开详情 */}
        <div className="story-right">
          <h2 style={{ fontSize: 24, letterSpacing: 2 }}>银饰叙事 · 越滚越正面</h2>
          {CARDS.map((c, i) => (
            <div key={c.id} className="kcard" onClick={() => setOpen(i)}>
              <h3>{c.title}</h3>
              <p>{c.teaser}</p>
              <span>点击展开图文详情 →</span>
            </div>
          ))}
        </div>
      </div>

      {/* 详情弹层 */}
      {open !== null && (
        <div className="modal-overlay" onClick={() => setOpen(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={CARDS[open].img} alt={CARDS[open].title} />
            <div className="modal-body">
              <h3>{CARDS[open].title}</h3>
              {CARDS[open].detail.map((p, j) => (
                <p key={j}>{p}</p>
              ))}
              <button onClick={() => setOpen(null)}>关闭</button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
