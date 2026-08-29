import Narrative from "@/components/Narrative";
import SlideDeck from "@/components/SlideDeck";
import ScrollScene from "@/components/ScrollScene";

export default function Home() {
  return (
    <main>
      {/* 固定全屏 3D 层:单一 WebGL 上下文,模型随滚动贯穿全页(z0/pointer-events:none) */}
      <ScrollScene />

      {/* DOM 内容层(z1):文案浮于 3D 之上,滚动不受影响 */}
      <div className="content-layer">
        <nav className="nav">
          <a href="/">首页</a>
          <a href="/products">Products</a>
          <a href="/product">产品 · 360° 预览</a>
        </nav>

        {/* hero:3D 主角在此段居中偏右 + 银饰环绕 + 粒子 */}
        <section id="sec-hero" style={{ position: "relative", height: "88vh" }}>
          <div style={{ position: "absolute", left: 32, bottom: 48, zIndex: 2 }}>
            <h1 style={{ fontSize: 42, letterSpacing: 4 }}>贵州苗族银饰</h1>
            <p style={{ color: "#8b93a7", marginTop: 8 }}>
              蝴蝶妈妈图腾 · 錾刻锻造 · 非遗匠人手作
            </p>
          </div>
        </section>

        {/* 卡牌区:模型缩小让位到左侧 */}
        <section id="sec-cards" style={{ padding: "72px 0 32px" }}>
          <div className="cards-right">
            <h2 className="sec-h cards-sec-h">工艺与图腾 · 卡牌划开</h2>
            <SlideDeck />
          </div>
        </section>

        {/* 叙事区:模型滑入左栏,随滚动旋转至正面锁定,右侧知识卡片 */}
        <Narrative />

        {/* 结尾回中:模型回中放大收束 */}
        <section
          id="sec-outro"
          style={{
            height: "92vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 20,
          }}
        >
          <h2 style={{ fontSize: 30, letterSpacing: 4 }}>每件银饰,都是可以佩戴的历史</h2>
          <p style={{ color: "#8b93a7" }}>蝴蝶妈妈 · 錾刻 · 盛装 —— 叙事完</p>
          <a
            href="/product"
            style={{
              padding: "12px 28px",
              border: "1px solid #3a4052",
              borderRadius: 999,
              marginTop: 8,
            }}
          >
            进入产品 · 360° 预览
          </a>
        </section>
      </div>
    </main>
  );
}
