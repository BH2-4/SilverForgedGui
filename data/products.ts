// 产品数据（纯数据层，6 件）
// 图片均选自 data/image-manifest-products.json 对应分类目录
// 文案为占位：nameEn 直译、description 一句话占位 —— TODO 待非遗审校后替换

import type { Product } from "./schema";

export const products: Product[] = [
  {
    id: "ms-001",
    slug: "blossom-headdress",
    nameZh: "繁花银冠",
    nameEn: "Blossom Silver Headdress",
    category: "headpieces",
    // TODO 待非遗审校：占位描述
    descriptionZh: "满冠银花如春竞放，是苗家盛装之首。",
    descriptionEn: "A crown of silver blossoms in full bloom, crowning the Miao festive attire. (TODO: pending heritage review)",
    images: [
      "/images/products/headpieces/yinshi-1.webp",
      "/images/products/headpieces/yinshi-2.webp",
      "/images/products/headpieces/yinshi-83.webp",
    ],
    model: "/models/blossom-headdress.glb",
    heritageNote: "银花头饰以蜂蝶花鸟为题，寓意万物有灵、花开富足。",
    personalization: {
      engraving: { enabled: true, maxChars: 8 },
      totem: ["蝴蝶妈妈", "鸟纹"],
    },
  },
  {
    id: "ms-002",
    slug: "crescent-headdress",
    nameZh: "月牙银角",
    nameEn: "Crescent Silver Horns",
    category: "headpieces",
    // TODO 待非遗审校：占位描述
    descriptionZh: "弯月般的银角高耸，映照苗岭山川的轮廓。",
    descriptionEn: "Crescent silver horns rise high, echoing the silhouette of the Miao mountains. (TODO: pending heritage review)",
    images: [
      "/images/products/headpieces/yinshi-90.webp",
      "/images/products/headpieces/yinshi-81.webp",
      "/images/products/headpieces/yinshi-91.webp",
    ],
    model: "/models/crescent-headdress.glb",
    heritageNote: "银角取牛角之形，是苗族始祖崇拜与农耕记忆的象征。",
    personalization: {
      engraving: { enabled: true, maxChars: 6 },
      totem: ["龙纹", "鸟纹"],
    },
  },
  {
    id: "ms-003",
    slug: "tribal-ornament",
    nameZh: "部落银胸牌",
    nameEn: "Tribal Silver Chest Ornament",
    category: "chestpieces",
    // TODO 待非遗审校：占位描述
    descriptionZh: "一面银牌悬于胸前，藏着部落的记事与祈愿。",
    descriptionEn: "A silver panel worn on the chest, carrying tribal records and blessings. (TODO: pending heritage review)",
    images: [
      "/images/products/chestpieces/yinshi-27.webp",
      "/images/products/chestpieces/yinshi-32.webp",
      "/images/products/chestpieces/yinshi-94.webp",
    ],
    model: "/models/tribal-ornament.glb",
    heritageNote: "胸牌纹样常镌图腾纪事，为苗族无字史书的一页。",
    personalization: {
      engraving: { enabled: true, maxChars: 10 },
      totem: ["蝴蝶妈妈", "龙纹", "鸟纹", "螺旋"],
    },
  },
  {
    id: "ms-004",
    slug: "engraved-dragon",
    nameZh: "盘龙银镯",
    nameEn: "Engraved Dragon Silver Bracelet",
    category: "handpieces",
    // TODO 待非遗审校：占位描述
    descriptionZh: "龙纹缠腕一圈，錾刻之间尽显银匠手上功夫。",
    descriptionEn: "A dragon coiling around the wrist, revealing the silversmith's chasing craft. (TODO: pending heritage review)",
    images: [
      "/images/products/handpieces/yinshi-100.webp",
      "/images/products/handpieces/yinshi-108.webp",
      "/images/products/handpieces/yinshi-118.webp",
    ],
    model: "/models/engraved-dragon.glb",
    heritageNote: "盘龙纹银镯为苗族婚嫁礼器，寓龙护平安。",
    personalization: {
      engraving: { enabled: true, maxChars: 6 },
      size: { range: "16-20", unit: "cm" },
    },
  },
  {
    id: "ms-005",
    slug: "spirals-infinity",
    nameZh: "螺旋银耳坠",
    nameEn: "Spiral Infinity Silver Earrings",
    category: "earrings",
    // TODO 待非遗审校：占位描述
    descriptionZh: "银丝盘成回旋无尽的纹样，随步履轻晃生辉。",
    descriptionEn: "Silver wires wound into endless spirals, shimmering with every step. (TODO: pending heritage review)",
    images: [
      "/images/products/earrings/yinshi-101.webp",
      "/images/products/earrings/yinshi-102.webp",
      "/images/products/earrings/yinshi-30.webp",
    ],
    model: "/models/spirals-infinity.glb",
    heritageNote: "螺旋纹源于水涡与藤蔓意象，象征生命绵延不绝。",
    personalization: {
      engraving: { enabled: true, maxChars: 4 },
    },
  },
  {
    id: "ms-006",
    slug: "silver-collar",
    nameZh: "苗银项圈",
    nameEn: "Miao Silver Collar",
    category: "neckpieces",
    // TODO 待非遗审校：占位描述
    descriptionZh: "一环素银承千针万錾，是苗家女儿的身份印记。",
    descriptionEn: "A ring of plain silver bearing countless hammer strokes, the mark of a Miao daughter. (TODO: pending heritage review)",
    images: [
      "/images/products/neckpieces/yinshi-114.webp",
      "/images/products/neckpieces/yinshi-115.webp",
      "/images/products/neckpieces/yinshi-116.webp",
    ],
    // 既有 hero 模型（Meshopt 压缩版，ScrollScene.tsx / product demo 同源）
    model: "/models/collar-meshopt.glb",
    heritageNote: "项圈为苗族银饰核心品类，层层相叠如月悬颈。",
    personalization: {
      engraving: { enabled: true, maxChars: 12 },
      totem: ["龙纹", "蝴蝶妈妈", "螺旋"],
    },
  },
];
