// REVIEW_PENDING: 文案待人工审核（见 data/COPY-REVIEW.md）
// 产品数据（纯数据层，6 件）
// 图片均选自 data/image-manifest-products.json 对应分类目录
// 文案依据公开可查证的苗族银饰文化常识撰写，不含匠人姓名/村落/年代/销量等不可验证表述

import type { Product } from "./schema";

export const products: Product[] = [
  {
    id: "ms-001",
    slug: "blossom-headdress",
    nameZh: "繁花银冠",
    nameEn: "Blossom Silver Headdress",
    category: "headpieces",
    descriptionZh:
      "满冠银花由匠人逐瓣锻打、錾花成型，蜂蝶花鸟错落其间。银冠居于苗族盛装之首，节日与婚嫁的整套银饰，都从戴上它开始。",
    descriptionEn:
      "A full crown of hand-wrought silver blossoms, each petal raised by hammer and fine chasing tools, with butterflies and birds scattered among the flowers. The headdress crowns the Miao festive ensemble, worn on festival days and at weddings.",
    images: [
      "/images/products/headpieces/yinshi-1.webp",
      "/images/products/headpieces/yinshi-2.webp",
      "/images/products/headpieces/yinshi-83.webp",
    ],
    model: "/models/blossom-headdress.glb",
    heritageNote: "银冠属苗族盛装首服，纹样多取蜂蝶花鸟；花开繁盛之形，寄托着对丰足与生命力的祈愿。",
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
    descriptionZh:
      "银角取水牛角之形，如一对弯月高耸于头顶，是苗族盛装中最醒目的轮廓。匠人锻打成型、錾花饰纹，角身在光下明暗流转。",
    descriptionEn:
      "A pair of tall silver horns rise from the brow like crescent moons — a silhouette taken from the water-buffalo horn, and the most striking piece of Miao festive dress. Forged and chased by hand, the surface shifts between light and shadow as the wearer moves.",
    images: [
      "/images/products/headpieces/yinshi-90.webp",
      "/images/products/headpieces/yinshi-81.webp",
      "/images/products/headpieces/yinshi-91.webp",
    ],
    model: "/models/crescent-headdress.glb",
    heritageNote: "银角造型源于牛角。牛在苗族农耕生活中备受珍视，高耸的银角因此被视为对勤劳与力量的礼赞，多见于黔东南盛装。",
    personalization: {
      engraving: { enabled: true, maxChars: 6 },
      totem: ["龙纹", "鸟纹"],
    },
  },
  {
    id: "ms-003",
    slug: "tribal-ornament",
    nameZh: "图腾银胸牌",
    nameEn: "Totemic Silver Chest Ornament",
    category: "chestpieces",
    descriptionZh:
      "一方银牌悬于胸前，錾出龙、鸟、蝶等传统纹样。苗族历史上没有通行的本民族文字，衣饰纹样长期承担记事传情的功能，胸牌正是这页「无字史书」的一角。",
    descriptionEn:
      "A silver panel hung at the chest, its face covered with traditional motifs — dragon, bird and butterfly — raised line by line with chasing tools. The Miao have traditionally passed down their culture without a widely used written script, so patterns on clothing and silver long carried stories and blessings.",
    images: [
      "/images/products/chestpieces/yinshi-27.webp",
      "/images/products/chestpieces/yinshi-32.webp",
      "/images/products/chestpieces/yinshi-94.webp",
    ],
    model: "/models/tribal-ornament.glb",
    heritageNote: "胸牌纹样多取龙、鸟、蝶等传统意象，苗族服饰因此常被形容为「穿在身上的史书」，佩戴于胸前以寄护佑祈福之愿。",
    personalization: {
      engraving: { enabled: true, maxChars: 10 },
      totem: ["蝴蝶妈妈", "龙纹", "鸟纹", "螺旋"],
    },
  },
  {
    id: "ms-004",
    slug: "engraved-dragon",
    nameZh: "盘龙银镯",
    nameEn: "Coiled Dragon Silver Bracelet",
    category: "handpieces",
    descriptionZh:
      "一条龙沿镯身盘绕一周，鳞爪以錾刻细细理出，转折处可见匠人手上轻重的分寸。分量贴腕而不压手，是盛装之外日常可佩的一件。",
    descriptionEn:
      "A single dragon coils once around the wrist, its scales and claws drawn in fine chasing — patterns raised on the silver with small steel tools and countless measured hammer taps. Substantial in the hand yet easy to wear, it suits everyday use beyond festive dress.",
    images: [
      "/images/products/handpieces/yinshi-100.webp",
      "/images/products/handpieces/yinshi-108.webp",
      "/images/products/handpieces/yinshi-118.webp",
    ],
    model: "/models/engraved-dragon.glb",
    heritageNote: "龙纹是苗族银饰最常见的纹样之一，苗龙形态自由多变；银镯日常可佩，也是苗家常见的传家之物。",
    personalization: {
      engraving: { enabled: true, maxChars: 6 },
      size: { range: "16-20", unit: "cm" },
    },
  },
  {
    id: "ms-005",
    slug: "spirals-infinity",
    nameZh: "螺旋银耳坠",
    nameEn: "Spiral Silver Earrings",
    category: "earrings",
    descriptionZh:
      "细银丝盘绕成螺旋，垂于耳侧，随步履轻晃生辉。螺旋是苗族纹样中最基础的语汇之一，既见于银饰，也见于刺绣与蜡染。",
    descriptionEn:
      "Fine silver wire wound into spirals that swing softly at the ear, catching light with every turn. The spiral is one of the most basic motifs in Miao decoration, appearing not only on silver but also in embroidery and batik.",
    images: [
      "/images/products/earrings/yinshi-101.webp",
      "/images/products/earrings/yinshi-102.webp",
      "/images/products/earrings/yinshi-30.webp",
    ],
    model: "/models/spirals-infinity.glb",
    heritageNote: "螺旋纹常见于苗族银饰，人们通常将其与水涡、藤蔓等自然意象相联系，寄托生命绵延的祝愿。",
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
    descriptionZh:
      "素银项圈以整条银料锻打弯制成型，圈身留有细密锤纹。项圈是苗族银饰的核心品类，盛装时常数只叠戴，环环相映。",
    descriptionEn:
      "A plain silver collar shaped from a single band of metal, hammered and bent into a circle, its surface carrying the fine texture of the hammer. Neck rings are a core piece of Miao silver jewelry; on festive days several are worn at once, one over another.",
    images: [
      "/images/products/neckpieces/yinshi-114.webp",
      "/images/products/neckpieces/yinshi-115.webp",
      "/images/products/neckpieces/yinshi-116.webp",
    ],
    // 既有 hero 模型（Meshopt 压缩版，ScrollScene.tsx / product demo 同源）
    model: "/models/collar-meshopt.glb",
    heritageNote: "苗族素以银饰为嫁妆重头，「无银不成女」的俗语道出银与女儿身份的关联，项圈正是其中最核心的品类。",
    personalization: {
      engraving: { enabled: true, maxChars: 12 },
      totem: ["龙纹", "蝴蝶妈妈", "螺旋"],
    },
  },
];
