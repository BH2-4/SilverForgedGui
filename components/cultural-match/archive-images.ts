/**
 * EXPERIENCE LAYER · Archive imagery
 *
 * Stage 2 档案馆卡片的真实影像映射。图片全部来自项目自带的
 * 苗银非遗数据库（public/collection/assets/images/，已分类的真实
 * 馆藏记录）。映射规则：
 *
 *   motif           → patterns/        （真实纹样与设计图记录）
 *   craft           → craftsmanship/   （真实工艺与制作场景记录）
 *   heritage_item   → 器物类目（确定性散列）
 *   regional_style  → craft-objects/   （真实工艺器皿记录）
 *   project         → craftsmanship/
 *
 * 文化护栏不变式：这里只是「档案馆氛围影像」，卡片上明确标注为
 * 视觉参考；影像不声称是匹配实体本身，不添加数据库以外的文化
 * 含义。选择确定性散列（而非随机）保证同一实体每次渲染同一影像。
 */

const PATTERNS = [
  "PN-001.jpg", "PN-002.jpg", "PN-003.jpg", "PN-004.jpg", "PN-005.jpg",
  "PN-006.jpg", "PN-007.jpg", "PN-008.png", "PN-009.jpg", "PN-010.jpg",
] as const;

const CRAFTSMANSHIP = [
  "CR-001.png", "CR-002.png", "CR-003.png", "CR-004.png", "CR-005.png",
  "CR-006.png", "CR-007.png", "CR-008.png",
] as const;

const CRAFT_OBJECTS = [
  "CO-001.jpg", "CO-002.jpg", "CO-003.jpg", "CO-004.png", "CO-005.png",
  "CO-006.png", "CO-007.png", "CO-008.png",
] as const;

const HEADWEAR = [
  "HW-001.jpeg", "HW-002.jpeg", "HW-003.png", "HW-004.png", "HW-005.png",
  "HW-006.png", "HW-007.png", "HW-008.png", "HW-009.png", "HW-010.png",
] as const;

const BASE = "/collection/assets/images";

/** Stable string hash (FNV-1a, 32-bit) → non-negative integer. */
function hashId(id: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

function pick(files: readonly string[], id: string): string {
  return files[hashId(id) % files.length];
}

/**
 * Deterministic archive image for one heritage match.
 * Falls back to craftsmanship records for unknown kinds.
 */
export function archiveImageFor(id: string, kind: string): string {
  switch (kind) {
    case "motif":
      return `${BASE}/patterns/${pick(PATTERNS, id)}`;
    case "craft":
      return `${BASE}/craftsmanship/${pick(CRAFTSMANSHIP, id)}`;
    case "regional_style":
      return `${BASE}/craft-objects/${pick(CRAFT_OBJECTS, id)}`;
    case "heritage_item":
    case "project":
    default:
      return `${BASE}/headwear/${pick(HEADWEAR, id)}`;
  }
}
