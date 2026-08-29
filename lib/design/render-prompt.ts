/**
 * STAGE 5 — DESIGN RENDER · Image Prompt Builder
 *
 * Converts the confirmed Design Proposal (Stage 4) into a STRUCTURED image
 * prompt for the visual generation stage. This is a pure translation layer:
 * every field is derived from the proposal's own schema — nothing is
 * invented, nothing cultural is added, nothing the customer did not choose.
 *
 * TRUTH LAYERING (inherited from Stage 3/4, enforced again here):
 *   A. Customer intent      — echoes only; never injected as cultural text
 *   B. Design decisions     — form / scale / composition / craft / material
 *   C. Cultural facts       — motif NAME verbatim from the KB, sources intact;
 *                             `visual-subject` motifs are described strictly
 *                             as visual subjects — no symbolic meaning text
 *   D. Design interpretation— never enters the prompt body (it is rendered
 *                             in the UI as labeled AI reasoning instead)
 *   E. Visual parameters    — fixed product-photography language
 *   F. Safety constraints   — cultural boundary + conditional negative list
 *
 * PRIORITY (hard rule): DesignProposal > DesignBrief > DesignDna.
 * The prompt obeys the CONFIRMED proposal even when the raw DNA suggests
 * something more flamboyant — a quiet daily-wear brief must never render
 * as an ornate ceremonial piece.
 */

import { z } from "zod";
import {
  DesignProposalSchema,
  type ProposalHandoff,
} from "@/lib/design/schemas";

/* -------------------------------------------------------------------------- */
/*  Structured image prompt contract                                           */
/* -------------------------------------------------------------------------- */

/** B — form decisions carried into the image. */
export const PromptFormSchema = z.object({
  product_type: z.string().min(1),
  thickness: z.enum(["slim", "medium", "substantial"]),
  scale: z.enum(["small", "medium", "large"]),
  arrangement: z.enum(["single-focus", "balanced-dual", "layered-system"]),
  coverage: z.enum(["local", "partial", "full"]),
});

/** C — the ONLY cultural content allowed in the prompt. */
export const PromptMotifSchema = z.object({
  /** KB verbatim name (never translated, never embellished). */
  name: z.string().min(1),
  region: z.string().nullable(),
  /** visual-subject → the prompt must not depict symbolic meaning. */
  presented_as: z.enum(["visual-subject", "documented-meaning"]),
  entity_id: z.string().min(1),
});

export const PromptMaterialSchema = z.object({
  base: z.literal("silver"),
  finish: z.enum(["high-polish", "satin-matte", "textured-relief"]),
});

export const PromptCraftSchema = z.object({
  /** KB craft name, verbatim. */
  primary: z.string().min(1),
  fineness: z.enum(["low", "medium", "high"]),
});

/** E — fixed product-photography parameters (Stage 5 V1). */
export const PromptVisionSchema = z.object({
  camera: z.string().min(1),
  lighting: z.string().min(1),
  background: z.string().min(1),
  /** Tier-derived visual language (quiet/balanced/statement). */
  visual_style: z.enum(["quiet", "balanced", "statement"]),
});

/**
 * The full structured prompt. `prompt` / `negative_prompt` are assembled
 * ONLY from the fields above — the UI shows the fields, the API consumes
 * the strings, and nothing in between can inject cultural claims.
 */
export const ImagePromptSchema = z.object({
  /* A — customer intent echo (for the "why" panel, not prompt text). */
  intent: z.object({
    product_type: z.string().min(1),
    style: z.array(z.string()),
    emotions: z.array(z.string()),
    occasion: z.string(),
  }),

  /* B — design decisions from the proposal. */
  form: PromptFormSchema,
  material: PromptMaterialSchema,
  craft: PromptCraftSchema,
  wearing_scene: z.string().min(1),

  /* C — cultural basis: motif or null (form-led). */
  motif: PromptMotifSchema.nullable(),

  /* E — visual parameters. */
  vision: PromptVisionSchema,

  /* F — safety constraints. */
  cultural_constraints: z.array(z.string().min(1)).min(1),
  negative_constraints: z.array(z.string().min(1)).min(1),

  /* Assembled strings (Layer 3 — derived, deterministic). */
  prompt: z.string().min(1),
  negative_prompt: z.string().min(1),

  /* Traceability echo — the proposal id this prompt was built from. */
  proposal_id: z.string().min(1),
});

export type ImagePrompt = z.infer<typeof ImagePromptSchema>;
export type PromptMotif = z.infer<typeof PromptMotifSchema>;

/* -------------------------------------------------------------------------- */
/*  Controlled visual vocabulary (design translation, NOT cultural claims)     */
/* -------------------------------------------------------------------------- */

/**
 * Tier → visual language. These are DESIGN descriptors describing how
 * restrained or rich the RENDERING should be — they describe the confirmed
 * proposal's own tier, never a cultural style claim.
 */
const TIER_VISUAL_LANGUAGE: Record<
  "quiet" | "balanced" | "statement",
  string
> = {
  quiet: "restrained and minimal, clean structural lines, generous negative space",
  balanced: "harmonious and refined, measured detail density",
  statement: "bold and richly detailed, prominent presence",
};

const THICKNESS_TEXT: Record<string, string> = {
  slim: "slim delicate profile",
  medium: "medium-weight profile",
  substantial: "substantial sculptural profile",
};

const SCALE_TEXT: Record<string, string> = {
  small: "small scale, worn close to the body",
  medium: "medium scale, everyday presence",
  large: "large scale, eye-catching presence",
};

const ARRANGEMENT_TEXT: Record<string, string> = {
  "single-focus": "a single focal element",
  "balanced-dual": "two balanced symmetrical elements",
  "layered-system": "a layered system of elements",
};

const COVERAGE_TEXT: Record<string, string> = {
  local: "motif detail concentrated on one local area",
  partial: "motif detail covering part of the surface",
  full: "motif detail across the full surface",
};

const FINISH_TEXT: Record<string, string> = {
  "high-polish": "high-polish mirror-finish sterling silver",
  "satin-matte": "satin-matte brushed sterling silver",
  "textured-relief": "hammered relief-textured sterling silver",
};

const FINENESS_TEXT: Record<string, string> = {
  low: "subtle craft detail",
  medium: "clearly visible craft detail",
  high: "fine, dense craft detail",
};

/**
 * The negative list. Conditional entries are derived from the proposal
 * itself: what the customer did NOT choose is forbidden — e.g. a quiet /
 * small proposal forbids oversized flamboyance, and silver forbids gold.
 * This makes the negative prompt an honest mirror of the confirmed design.
 */
function buildNegativeConstraints(proposal: z.infer<typeof DesignProposalSchema>): string[] {
  const list: string[] = [
    "random ethnic symbols",
    "unrelated ethnic motifs",
    "fantasy tribal costume",
    "mixed cultural motifs from different regions or ethnic groups",
    "invented traditional symbols",
    "invented heritage claims",
    "plastic or cheap-looking material",
    "gold jewelry",
    "gemstones",
    "human model, hands, face",
    "complex scene, busy background",
    "text",
    "watermark",
    "logo",
  ];

  /* Conditional honesty: only forbid what the proposal itself rejects. */
  if (proposal.title.tier !== "statement") {
    list.push("excessive ornamentation");
  }
  if (proposal.scale.size !== "large") {
    list.push("oversized jewelry");
  }
  if (proposal.motif.primary === null) {
    list.push("any ethnic, tribal, or traditional pattern");
  }

  return list;
}

/**
 * Cultural constraints — the affirmative boundary text embedded in the
 * prompt body. Exactly one motif (or none), never mixed, never symbolic
 * unless the KB documented a meaning (currently it never does).
 */
function buildCulturalConstraints(
  motif: PromptMotif | null,
): string[] {
  const constraints: string[] = [
    "present the piece as a contemporary custom jewelry design, not as a replica of any historical artifact",
  ];

  if (motif === null) {
    constraints.push(
      "no ethnic, tribal, or traditional motifs of any kind — the design is a modern formal expression only",
    );
  } else {
    constraints.push(
      `use only the documented motif "${motif.name}" as the single cultural visual element, exactly as a visual subject`,
    );
    constraints.push(
      "do not add any other ethnic, tribal, or traditional patterns beyond this one motif",
    );
    if (motif.presented_as === "visual-subject") {
      constraints.push(
        `the motif "${motif.name}" carries no symbolic meaning in this rendering — it is a documented visual subject only`,
      );
    }
    constraints.push(
      "do not mix visual elements from other cultures, regions, or ethnic groups",
    );
  }

  return constraints;
}

/* -------------------------------------------------------------------------- */
/*  Builder                                                                    */
/* -------------------------------------------------------------------------- */

export interface BuildImagePromptInput {
  handoff: ProposalHandoff;
  /** Regeneration seed — varies decorative placement in the renderer. */
  seed?: number;
}

export interface BuildImagePromptOutput {
  prompt: ImagePrompt;
}

/**
 * Pure, deterministic DesignProposal → ImagePrompt translation.
 * Throws never — the input is already schema-validated upstream.
 */
export function buildImagePrompt(
  input: BuildImagePromptInput,
): BuildImagePromptOutput {
  const { proposal, designBrief } = input.handoff;
  const direction = proposal.design_direction;

  /* ---- B: design decisions (proposal-first, brief as fallback) ---- */
  const form = {
    product_type: proposal.form.product_type,
    thickness: proposal.form.thickness,
    scale: proposal.scale.size,
    arrangement: proposal.composition.arrangement,
    coverage: proposal.composition.coverage,
  };

  const material = {
    base: proposal.material.base,
    finish: proposal.material.finish,
  } as const;

  const craft = {
    primary: proposal.craft.primary.name,
    fineness: proposal.craft.fineness,
  };

  /* Wearing scene: the direction's primary scene token (proposal-first,
     then the brief the proposal was assembled from). */
  const wearing_scene =
    direction.wearing_scenes[0] ?? designBrief.wearing_scene;

  /* ---- C: cultural basis — motif verbatim or null ---- */
  const motif: PromptMotif | null =
    proposal.motif.primary !== null
      ? {
        name: proposal.motif.primary.name,
        region: proposal.motif.primary.region,
        presented_as: proposal.motif.primary.presented_as,
        entity_id: proposal.motif.primary.origin_entity_id,
      }
      : null;

  /* ---- E: fixed product-photography vision ---- */
  const vision = {
    camera: "professional product photography, front three-quarter view, jewelry centered",
    lighting: "soft diffused studio lighting with gentle specular highlights",
    background: "clean seamless neutral studio background",
    visual_style: proposal.title.tier,
  };

  /* ---- F: safety constraints ---- */
  const cultural_constraints = buildCulturalConstraints(motif);
  const negative_constraints = buildNegativeConstraints(proposal);

  /* ---- A: customer intent echo (UI trace only) ---- */
  const intent = {
    product_type: proposal.customer_intent.product_type,
    style: proposal.customer_intent.style,
    emotions: proposal.customer_intent.emotions,
    occasion: proposal.customer_intent.occasion,
  };

  /* ---- Assemble the prompt body (Layer 3) ----
     Order mirrors the data flow: the confirmed design first, the cultural
     boundary last, so the model reads the piece before its constraints. */
  const segments: string[] = [
    `${vision.camera}, ${ARRANGEMENT_TEXT[form.arrangement]} ${form.product_type} in ${FINISH_TEXT[material.finish]}`,
    `${THICKNESS_TEXT[form.thickness]}, ${SCALE_TEXT[form.scale]}`,
    `${FINENESS_TEXT[craft.fineness]} showing ${craft.primary} craftsmanship`,
    `${TIER_VISUAL_LANGUAGE[vision.visual_style]}`,
  ];

  if (motif !== null) {
    const coverage = COVERAGE_TEXT[form.coverage];
    segments.push(
      `featuring the documented motif "${motif.name}" as its visual subject, ${coverage}`,
    );
  } else {
    segments.push("pure form-led design without any motif");
  }

  segments.push(`${vision.lighting}, ${vision.background}`);

  const prompt = segments.join(", ") + ". " + cultural_constraints.join(". ") + ".";

  const negative_prompt = negative_constraints.join(", ");

  return {
    prompt: {
      intent,
      form,
      material,
      craft,
      wearing_scene,
      motif,
      vision,
      cultural_constraints,
      negative_constraints,
      prompt,
      negative_prompt,
      proposal_id: proposal.id,
    },
  };
}
