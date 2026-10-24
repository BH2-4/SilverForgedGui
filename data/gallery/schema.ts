// 产品数据层 zod schema —— Product 类型定义
// personalization 镜像 Spree option types：engraving / totem / size（#8 定制钩子）

import { z } from "zod";

/** 产品分类（对齐 image-manifest-products.json 的 category 目录） */
export const productCategorySchema = z.enum([
  "headpieces",
  "neckpieces",
  "chestpieces",
  "earrings",
  "handpieces",
  "garments",
  "craftworks",
]);

/** 刻字定制选项 */
export const engravingSchema = z.object({
  /** 是否开放刻字 */
  enabled: z.boolean(),
  /** 刻字最大字符数 */
  maxChars: z.number().int().positive(),
});

/** 尺寸定制选项（如手镯内径范围） */
export const sizeSchema = z.object({
  /** 尺寸范围，如 "16-20" */
  range: z.string(),
  /** 单位，如 "cm" */
  unit: z.string(),
});

/** 图腾候选（如：蝴蝶妈妈 / 龙纹 / 鸟纹 / 螺旋） */
export const totemSchema = z.array(z.string()).min(1);

/** 定制钩子：三项均可选，按品类赋值 */
export const personalizationSchema = z.object({
  engraving: engravingSchema.optional(),
  totem: totemSchema.optional(),
  size: sizeSchema.optional(),
});

/** 产品主体 schema */
export const productSchema = z.object({
  id: z.string(),
  /** URL 路径标识 */
  slug: z.string(),
  nameZh: z.string(),
  nameEn: z.string(),
  category: productCategorySchema,
  descriptionZh: z.string(),
  descriptionEn: z.string(),
  /** 关联图片路径（/images/products/... webp），每件 2-4 张 */
  images: z.array(z.string()).min(2).max(4),
  /** GLB 模型路径（/models/...），无 3D 模型的产品可省略 */
  model: z.string().optional(),
  /** 非遗背景注记 */
  heritageNote: z.string(),
  personalization: personalizationSchema,
});

export type ProductCategory = z.infer<typeof productCategorySchema>;
export type Engraving = z.infer<typeof engravingSchema>;
export type SizeOption = z.infer<typeof sizeSchema>;
export type Personalization = z.infer<typeof personalizationSchema>;
export type Product = z.infer<typeof productSchema>;
