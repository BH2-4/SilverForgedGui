"use client";

// REVIEW_PENDING: 文案待人工审核（见 data/COPY-REVIEW.md）
import { useEffect, useRef, useState } from "react";

/* 知识卡片文案:仅采用公开可查证的苗族银饰文化常识撰写,不含匠人姓名/村落/年代/销量等不可验证表述 */
const CARDS = [
  {
    id: "butterfly",
    title: "蝴蝶妈妈 · 创世图腾",
    teaser:
      "《苗族古歌》里,枫树心化出蝴蝶妈妈,她与水泡游方,生下十二个蛋,其中一个孵出了人类始祖姜央。",
    img: "/images/narrative/patterns/yinshi-59.webp",
    imgW: 1080,
    imgH: 542,
    detail: [
      "在世代口传的《苗族古歌》里,枫树被砍倒后,树心化作了蝴蝶,苗人尊称她为「蝴蝶妈妈」。她与水泡游方相恋,生下十二个蛋,由传说中的鹡宇鸟代为孵化,其中一枚孵出了人类的祖先姜央——因此在苗族的创世叙述中,蝴蝶是受尊奉的始祖形象。",
      "银饰上的蝶纹因此不只作装饰,更被视作族源记忆的载体。匠人锤下的蝶纹变体繁多:有的与鸟纹相伴,有的与花卉果实同构,常见于银冠、胸牌等显要位置。",
      "辨认蝶纹并不难:双翅对称展开,身旁常伴鸟纹或花卉。对佩戴者而言,把蝶纹戴在身上,等于随身携带一段关于「我们从哪里来」的古老回答。",
    ],
  },
  {
    id: "chasing",
    title: "錾刻 · 一錾一痕的手艺",
    teaser:
      "一片银到一件银饰,要经熔炼、锻打、錾刻、洗银等数十道工序;仅錾刻一步,匠人便需动用数十种不同的錾头。",
    img: "/images/narrative/craftsmanship/yinshi-73.webp",
    imgW: 1080,
    imgH: 759,
    detail: [
      "錾刻有「錾花」与「錾刻」两路:錾花以弯錾在银面走出阴文线稿,如同以铁笔作画;錾刻则以窝錾、豆錾将纹样顶出浮雕。一件银饰上的浮凸图案,是匠人交替使用数十种錾头、无数次锤击的累积。",
      "錾头按刃形分直、弯、勾、沙、丝、豆、窝等多种,匠人常按自己的手感自制錾具。手工錾刻与机械压模的分别,细看便知:手作的纹线深浅不一、起落有痕,每一道都留有落錾的痕迹。",
      "2006 年,苗族银饰锻制技艺列入第一批国家级非物质文化遗产名录。欣赏錾刻可以看三处:线条起落是否利落,浮雕层次是否分明,以及光线转过纹沟时明暗的节奏。",
    ],
  },
  {
    id: "ornament",
    title: "盛装 · 无银不成女",
    teaser:
      "苗谚说「无银不成女」。盛装之日,银冠、银角、银项圈层层叠戴,走动时银铃相击,人未至而声先到。",
    img: "/images/narrative/craftsmanship/yinshi-82.webp",
    imgW: 1080,
    imgH: 1440,
    detail: [
      "黔东南苗族的盛装银饰是一个完整体系:银角高耸如月,银冠覆顶,银项圈、银压领、银衣片层层叠叠,全套可重达十余公斤。",
      "盛装银饰只在重大场合穿戴——苗年、姊妹节、芦笙节,以及婚嫁之日。行走时银片相击,人未至而声先到;银饰盛装不仅被看见,也被听见。",
      "在传统习俗中,家中会早早为女儿备置银饰,盛装之日整套穿戴。银饰因此既是家的心意,也是女儿在节日里最郑重的仪容。",
    ],
  },
  {
    id: "bracelet",
    title: "银镯 · 财富与传承",
    teaser:
      "银饰既是穿戴,也是家庭财富的便携形态;银镯常由母亲传给女儿,一代代增重改样。",
    img: "/images/narrative/craftsmanship/yinshi-89.webp",
    imgW: 1080,
    imgH: 1440,
    detail: [
      "历史上,银在苗寨长期兼具储值的功能——把银打成饰物随身佩戴,财富因此可携、可传。这一习惯常与苗族历史上的迁徙经历联系在一起:家产打成银饰,人走到哪里,家当就带到哪里。",
      "银镯是最常见的传家银饰之一,多由母亲传给女儿。传过一两代后,也常回炉重打、改换纹样——银料不变,样式常新,一副银镯里往往叠着不止一代人的手泽。",
      "对佩戴者而言,传下来的银镯是贴身之物,也是家族记忆的凭据。苗银因此始终处在被打磨、改样、再传递的流转之中——它不是静止的藏品,而是一直被使用着的传家之物。",
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
            {/* 固定宽高比容器:渲染即预留高度,图片加载前后无跳动 */}
            <div
              style={{
                aspectRatio: `${CARDS[open].imgW} / ${CARDS[open].imgH}`,
                maxHeight: 380,
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={CARDS[open].img}
                alt={CARDS[open].title}
                width={CARDS[open].imgW}
                height={CARDS[open].imgH}
                style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
              />
            </div>
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
