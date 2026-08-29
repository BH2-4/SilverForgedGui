export const STYLE_OPTIONS = [
  "Minimal",
  "Modern",
  "Bohemian",
  "Luxury",
  "Vintage",
  "Street",
] as const;

export const OCCASION_OPTIONS = [
  "Everyday",
  "Date",
  "Festival",
  "Wedding",
  "Gift",
] as const;

export const EMOTION_OPTIONS = [
  "Love",
  "Freedom",
  "Protection",
  "New Beginning",
  "Connection",
  "Transformation",
] as const;

export const CULTURAL_VISIBILITY_OPTIONS = [
  "Subtle",
  "Balanced",
  "Strong",
] as const;

export const PRODUCT_OPTIONS = [
  "Necklace",
  "Earrings",
  "Bracelet",
  "Ring",
  "Brooch",
] as const;

export type StyleOption = (typeof STYLE_OPTIONS)[number];
export type OccasionOption = (typeof OCCASION_OPTIONS)[number];
export type EmotionOption = (typeof EMOTION_OPTIONS)[number];
export type CulturalVisibilityOption =
  (typeof CULTURAL_VISIBILITY_OPTIONS)[number];
export type ProductOption = (typeof PRODUCT_OPTIONS)[number];
