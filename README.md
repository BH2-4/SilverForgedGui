# Miao Silver 3D · 苗族银饰 3D 交互叙事站

本分支（`main`）是苗族银饰的 **3D 交互叙事站**：全页滚动叙事 + React Three Fiber 实时 3D 银饰——拖拽旋转、滚轮缩放、锻造成型加载，蝴蝶妈妈图腾贯穿工艺与图腾卡牌叙事。

- **线上地址**：https://3d.randomplayx.com（RandomPlayX 的品牌叙事二级入口，由正式站 Act 3 / 页脚 / collection heritage 三处链接引入）
- **⚠️ 正式独立站在另一条分支**：[`silver-forged-gui`](../../tree/silver-forged-gui) —— AI 需求引擎（Stage 0–5）+ 成品独立站 `/collection`，部署于 **https://randomplayx.com**，即本仓库的默认分支
- 两条分支为**无共同祖先的独立历史**：本分支用 pnpm，正式分支用 npm；各自独立部署（本分支 → Vercel 项目 `silverforgedgui`，自动部署；正式分支 → `randomplayx-engine`，手动部署）

## 本地开发

```bash
pnpm install
pnpm dev        # http://localhost:3100
```

## 目录速览

```
app/            Next.js 路由（首页五段叙事 / products 列表与详情 / product 360° demo）
components/     R3F 3D 查看器、卡牌流、滚动场景、叙事组件
data/           商品数据与图片清单（源自苗族银饰3D实拍素材）
public/         GLB 模型与图片资产
```
