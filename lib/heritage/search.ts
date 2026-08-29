import {
  loadCrafts,
  loadHeritageItems,
  loadMotifs,
  loadPeople,
  loadProjects,
  loadRegionalStyles,
} from "./repository";
import type {
  Craft,
  HeritageItem,
  HeritageProject,
  Motif,
  Person,
  RegionalStyle,
} from "./types";

/**
 * Structured keyword search over the heritage knowledge base.
 *
 * Deliberately NOT embedding/vector based (V1 scope): it tokenizes the
 * query, matches tokens against name / region / category / features /
 * description, and returns an honest 0–1 relevance score with the matched
 * fields exposed for debugging. Bilingual glosses let English queries hit
 * Chinese entities without inventing any cultural semantics.
 */

export type HeritageSearchKind =
  | "motif"
  | "heritage_item"
  | "regional_style"
  | "craft"
  | "project"
  | "person";

export interface HeritageSearchHit {
  kind: HeritageSearchKind;
  id: string;
  name: string;
  region: string | null;
  category: string | null;
  description: string;
  source_ids: string[];
  evidence_level: string;
  /** 0–1 relevance, normalized over matched-field counts. */
  score: number;
  matched_fields: string[];
}

/** English gloss → dataset terms. Pure translation, no meaning attached. */
const GLOSS: Record<string, string[]> = {
  dragon: ["龙", "苗龙"],
  tiger: ["虎"],
  butterfly: ["蝴蝶"],
  bird: ["鸟雀", "银雀", "花鸟"],
  flower: ["花草", "银头花", "银花帽"],
  flora: ["花草"],
  insect: ["昆虫"],
  fish: ["龙鱼"],
  nature: ["花草", "鸟雀", "昆虫", "花鸟", "龙鱼"],
  headpiece: ["银凤冠", "银角", "银冠", "银花帽", "银帽", "银头围"],
  necklace: ["项圈", "银项链", "银链"],
  earring: ["耳环", "耳柱"],
  bracelet: ["手镯", "手圈"],
  ring: ["银戒指"],
  pendant: ["胸锁", "胸宝"],
  hairpin: ["银簪", "银梳"],
  engraving: ["錾花", "錾刻"],
  wire: ["拉丝"],
  braiding: ["编结", "编花"],
  forging: ["锻制", "捶打", "锤錾"],
  leishan: ["雷山"],
  taijiang: ["台江"],
  jianhe: ["剑河"],
  huangping: ["黄平"],
};

interface SearchableEntity {
  kind: HeritageSearchKind;
  id: string;
  name: string;
  region: string | null;
  category: string | null;
  /** Extra fields worth matching (features, style types, subregions…). */
  extra: string[];
  description: string;
  source_ids: string[];
  evidence_level: string;
}

function collectEntities(): SearchableEntity[] {
  const entities: SearchableEntity[] = [];

  const motifs: Motif[] = loadMotifs();
  for (const m of motifs) {
    entities.push({
      kind: "motif",
      id: m.id,
      name: m.name,
      region: m.region,
      category: null,
      extra: [],
      description: m.description,
      source_ids: m.source_ids,
      evidence_level: m.evidence_level,
    });
  }

  const items: HeritageItem[] = loadHeritageItems();
  for (const i of items) {
    entities.push({
      kind: "heritage_item",
      id: i.id,
      name: i.name,
      region: i.region,
      category: i.category,
      extra: [],
      description: i.description,
      source_ids: i.source_ids,
      evidence_level: i.evidence_level,
    });
  }

  const styles: RegionalStyle[] = loadRegionalStyles();
  for (const s of styles) {
    entities.push({
      kind: "regional_style",
      id: s.id,
      name: s.region,
      region: s.region,
      category: null,
      extra: [...s.features, ...(s.style_types ?? [])],
      description: s.features.join("、"),
      source_ids: s.source_ids,
      evidence_level: s.evidence_level,
    });
  }

  const crafts: Craft[] = loadCrafts();
  for (const c of crafts) {
    entities.push({
      kind: "craft",
      id: c.id,
      name: c.name,
      region: null,
      category: null,
      extra: [],
      description: c.description,
      source_ids: c.source_ids,
      evidence_level: c.evidence_level,
    });
  }

  const projects: HeritageProject[] = loadProjects();
  for (const p of projects) {
    entities.push({
      kind: "project",
      id: p.id,
      name: p.name,
      region: p.region,
      category: p.category,
      extra: [p.designation],
      description: p.description,
      source_ids: p.source_ids,
      evidence_level: p.evidence_level,
    });
  }

  const people: Person[] = loadPeople();
  for (const p of people) {
    entities.push({
      kind: "person",
      id: p.id,
      name: p.name,
      region: p.region,
      category: p.role,
      extra: p.facts,
      description: p.facts.join("；"),
      source_ids: p.source_ids,
      evidence_level: p.evidence_level,
    });
  }

  return entities;
}

/** Expand a raw query token into dataset terms via the gloss. */
function expandToken(token: string): string[] {
  const lower = token.toLowerCase();
  const terms = new Set<string>([token]);
  for (const [en, zh] of Object.entries(GLOSS)) {
    if (lower.includes(en)) {
      for (const term of zh) terms.add(term);
    }
  }
  return [...terms];
}

export function searchHeritage(query: string, limit = 10): HeritageSearchHit[] {
  const rawTokens = query
    .toLowerCase()
    .split(/[\s,，、/|;；]+/)
    .map((t) => t.trim())
    .filter((t) => t.length > 0);

  if (rawTokens.length === 0) return [];

  const entities = collectEntities();
  const hits: HeritageSearchHit[] = [];

  for (const entity of entities) {
    const haystacks: Array<[string, string]> = [
      ["name", entity.name],
      ["region", entity.region ?? ""],
      ["category", entity.category ?? ""],
      ["description", entity.description],
      ["features", entity.extra.join(" ")],
    ];

    const matchedFields = new Set<string>();
    let matchCount = 0;

    for (const token of rawTokens) {
      const terms = expandToken(token);
      for (const [field, haystack] of haystacks) {
        if (!haystack) continue;
        if (terms.some((term) => haystack.includes(term))) {
          matchedFields.add(field);
          matchCount += 1;
        }
      }
    }

    if (matchedFields.size === 0) continue;

    hits.push({
      kind: entity.kind,
      id: entity.id,
      name: entity.name,
      region: entity.region,
      category: entity.category,
      description: entity.description,
      source_ids: entity.source_ids,
      evidence_level: entity.evidence_level,
      score: Math.min(1, matchCount / 5),
      matched_fields: [...matchedFields],
    });
  }

  return hits.sort((a, b) => b.score - a.score).slice(0, limit);
}
