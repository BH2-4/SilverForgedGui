/**
 * STAGE 3 — Prompt builders.
 *
 * `generation_prompt` / `negative_prompt` are assembled EXCLUSIVELY from the
 * structured Design Brief fields. Raw user input never reaches this layer:
 * the brief itself was derived from sanitized DNA tokens and knowledge-base
 * facts, so the prompt is a pure function of documented data + labeled
 * interpretation.
 */

import type { DesignBrief } from "@/lib/design/schemas";

const FORM_NOUNS: Record<string, string> = {
  necklace: "necklace",
  earrings: "earrings",
  bracelet: "bangle",
  cuff: "cuff",
  ring: "ring",
  pendant: "pendant",
  brooch: "brooch",
  hairpiece: "hairpiece",
  anklet: "anklet",
  unknown: "piece",
};

const VISIBILITY_PROMPT: Record<string, string> = {
  subtle: "quietly present, readable only at close range",
  balanced: "clearly readable at conversational distance",
  strong: "deliberately prominent",
};

function visibilityPhrase(brief: DesignBrief): string {
  const key = brief.cultural_visibility.toLowerCase();
  return VISIBILITY_PROMPT[key] ?? "clearly readable";
}

export function buildGenerationPrompt(brief: DesignBrief): string {
  const lines: string[] = [];

  lines.push(brief.design_title);

  const noun = FORM_NOUNS[brief.product_type] ?? "piece";
  lines.push(
    `A ${brief.size} ${noun} in ${brief.material.primary}, ${brief.material.finish}.`,
  );
  lines.push(`Form: ${brief.form_language.join("; ")}.`);

  if (brief.motif_elements.length > 0) {
    const motifParts = brief.motif_elements.map((motif) => {
      const origin = motif.region ? `${motif.region} Miao silver` : "Guizhou Miao silver";
      if (motif.presented_as === "documented-meaning" && motif.documented_meaning) {
        return `the documented "${motif.name}" motif of ${origin} (documented meaning: ${motif.documented_meaning}), rendered as ${visibilityPhrase(brief)}`;
      }
      return `the documented "${motif.name}" visual subject of ${origin}, used as a formal design element with ${visibilityPhrase(brief)} — no symbolic meaning is claimed`;
    });
    lines.push(`Motif: ${motifParts.join("; and ")}.`);
  } else {
    lines.push("Motif: none — form-led design with no cultural motif.");
  }

  lines.push(`Palette: ${brief.color.palette.join(", ")}.`);
  lines.push(`Wearability: ${brief.wearability}. Complexity: ${brief.complexity}.`);

  const attribution = brief.heritage_reference?.region
    ? `Cultural attribution is limited to the documented ${brief.heritage_reference.region} tradition`
    : "No cultural attribution is made";
  lines.push(
    `Constraints: ${attribution}; the design must not imply undocumented symbolism.`,
  );

  return lines.join("\n");
}

const BASE_NEGATIVES = [
  "invented cultural symbolism",
  "fake traditional patterns",
  "incorrect regional attribution",
  "generic Chinese costume aesthetics",
  "fantasy ethnic stereotypes",
  "tourism souvenir aesthetics",
  "overly ornate design",
];

export function buildNegativePrompt(brief: DesignBrief): string {
  const negatives = [...BASE_NEGATIVES];

  const hasDocumentedMeaning = brief.motif_elements.some(
    (m) => m.presented_as === "documented-meaning",
  );
  if (!hasDocumentedMeaning) {
    negatives.push("symbolic captions or meaning claims");
  }

  for (const avoid of brief.avoid_elements) {
    if (!negatives.includes(avoid)) negatives.push(avoid);
  }

  return negatives.join(", ");
}
