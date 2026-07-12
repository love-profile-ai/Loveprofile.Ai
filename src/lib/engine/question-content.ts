import {
  ADAPTIVE_QUESTION_CONTENT,
  type AdaptiveQuestionContent,
  type SignalWeightKey,
} from "@/content/adaptive-questions";
import type { ProfileDimension } from "./profile-dimensions";
import type {
  EnginePath,
  FollowUpRule,
  FollowUpRules,
  PsychologicalDimension,
  Question,
  QuestionScoring,
  ScoreDelta,
} from "@/types/adaptive-engine";

const PATH_PREFIX: Record<EnginePath, string> = {
  do_i_love_someone: "dls",
  does_someone_love_me: "dsl",
};

const PROFILE_PRIMARY_DIMENSION: Record<ProfileDimension, PsychologicalDimension> =
  {
    trust_emotional_safety: "trust",
    communication_clarity: "communication",
    attraction_balance: "crush",
    long_term_compatibility: "future",
  };

const SIGNAL_TO_PSYCH: Record<
  SignalWeightKey,
  PsychologicalDimension | PsychologicalDimension[]
> = {
  communication: "communication",
  trust: "trust",
  attraction: ["crush", "emotional_attraction"],
  compatibility: ["future", "friendship"],
  love: "love",
  crush: "crush",
  future: "future",
  friendship: "friendship",
  commitment: "commitment",
  reciprocity: "reciprocity",
  attachment: "attachment",
};

function slugify(label: string): string {
  return label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");
}

function engineId(path: EnginePath, contentId: string): string {
  return `${PATH_PREFIX[path]}_${contentId}`;
}

function resolveText(item: AdaptiveQuestionContent, path: EnginePath): string {
  if (path === "does_someone_love_me" && item.text_other_path) {
    return item.text_other_path;
  }
  return item.text;
}

function categoryForDimension(dimension: ProfileDimension): string {
  switch (dimension) {
    case "communication_clarity":
      return "communication";
    case "attraction_balance":
      return "attraction";
    case "long_term_compatibility":
      return "future";
    default:
      return "trust";
  }
}

function expandSignalWeights(
  weights: Partial<Record<SignalWeightKey, number>>
): Partial<Record<PsychologicalDimension, number>> {
  const out: Partial<Record<PsychologicalDimension, number>> = {};

  for (const [key, weight] of Object.entries(weights)) {
    if (weight === undefined) continue;
    const mapped = SIGNAL_TO_PSYCH[key as SignalWeightKey];
    const dims = Array.isArray(mapped) ? mapped : [mapped];
    const share = weight / dims.length;
    for (const dim of dims) {
      out[dim] = (out[dim] ?? 0) + share;
    }
  }

  return out;
}

function scoreMagnitude(weight: number): number {
  return Math.round(8 + weight * 14);
}

function buildSingleSelectScoring(
  item: AdaptiveQuestionContent
): QuestionScoring["single_select"] {
  if (!item.options?.length) return {};

  const weights = expandSignalWeights(item.signal_weight);
  const primary = PROFILE_PRIMARY_DIMENSION[item.dimension];
  const scoring: Record<string, Partial<ScoreDelta>> = {};

  for (const label of item.options) {
    const value = slugify(label);
    const signal = item.option_signal?.[label] ?? "mid";
    const delta: Partial<ScoreDelta> = {};

    for (const [dim, w] of Object.entries(weights)) {
      const dimension = dim as PsychologicalDimension;
      const mag = scoreMagnitude(w);
      if (signal === "high") {
        delta[dimension] = mag;
      } else if (signal === "low") {
        delta[dimension] = -Math.round(mag * 0.75);
      } else {
        delta[dimension] = Math.round(mag * 0.2);
      }
    }

    if (signal === "high" && primary) {
      delta[primary] = (delta[primary] ?? 0) + 4;
    }

    scoring[value] = delta;
  }

  return scoring;
}

function buildSliderScoring(item: AdaptiveQuestionContent): QuestionScoring {
  const weights = expandSignalWeights(item.signal_weight);
  const scale: Partial<Record<keyof ScoreDelta, number>> = {};

  for (const [dim, w] of Object.entries(weights)) {
    scale[dim as keyof ScoreDelta] = 1.8 + w * 2.2;
  }

  return {
    slider: {
      scale,
      confidence: 0.11 + Math.max(...Object.values(item.signal_weight)) * 0.02,
    },
  };
}

function lowTriggerRules(
  path: EnginePath,
  parent: AdaptiveQuestionContent,
  childId: string
): FollowUpRule[] | undefined {
  if (!parent.follow_up_if_low || parent.follow_up_if_low !== childId) {
    return undefined;
  }

  const parentEngineId = engineId(path, parent.id);

  if (parent.type === "likert_5") {
    return [{ type: "answer_lte", question_id: parentEngineId, value: 2 }];
  }

  if (!parent.options?.length) return undefined;

  const lowValues = parent.options
    .filter((label) => parent.option_signal?.[label] === "low")
    .map((label) => slugify(label));

  if (!lowValues.length) return undefined;

  return lowValues.map((value) => ({
    type: "answer_equals" as const,
    question_id: parentEngineId,
    value,
  }));
}

function buildFollowUpRules(
  path: EnginePath,
  item: AdaptiveQuestionContent,
  byId: Map<string, AdaptiveQuestionContent>
): FollowUpRules {
  if (!item.depends_on) return {};

  const parent = byId.get(item.depends_on);
  if (!parent) return {};

  const only_if_any = lowTriggerRules(path, parent, item.id);
  if (!only_if_any?.length) return {};

  return { only_if_any };
}

function contentItemToQuestion(
  item: AdaptiveQuestionContent,
  path: EnginePath,
  byId: Map<string, AdaptiveQuestionContent>
): Question {
  const id = engineId(path, item.id);
  const primary = PROFILE_PRIMARY_DIMENSION[item.dimension];
  const weight = Math.max(...Object.values(item.signal_weight)) || 1;
  const follow_up_rules = buildFollowUpRules(path, item, byId);

  const base: Question = {
    id,
    path,
    category: categoryForDimension(item.dimension),
    question_text: resolveText(item, path),
    type: item.type === "likert_5" ? "slider" : "single_select",
    options:
      item.type === "likert_5"
        ? { min: 1, max: 5 }
        : (item.options ?? []).map((label) => ({
            label,
            value: slugify(label),
          })),
    psychological_dimension: primary,
    weight,
    priority: item.priority ?? 70,
    follow_up_rules,
    scoring:
      item.type === "likert_5"
        ? buildSliderScoring(item)
        : { single_select: buildSingleSelectScoring(item) },
    confidence_value: 0.11 + weight * 0.02,
    parent_question_id: item.depends_on
      ? engineId(path, item.depends_on)
      : null,
    is_active: true,
  };

  return base;
}

/** Convert authored content into engine-ready questions for both paths. */
export function contentQuestionsToEngine(): Question[] {
  const byId = new Map(ADAPTIVE_QUESTION_CONTENT.map((q) => [q.id, q]));
  const paths: EnginePath[] = ["do_i_love_someone", "does_someone_love_me"];

  return paths.flatMap((path) =>
    ADAPTIVE_QUESTION_CONTENT.map((item) =>
      contentItemToQuestion(item, path, byId)
    )
  );
}

export function getContentQuestionByEngineId(
  engineQuestionId: string
): AdaptiveQuestionContent | undefined {
  const match = engineQuestionId.match(/^(?:dls|dsl)_(.+)$/);
  if (!match) return undefined;
  return ADAPTIVE_QUESTION_CONTENT.find((q) => q.id === match[1]);
}

export function getPhrasingVariants(engineQuestionId: string): string[] {
  const content = getContentQuestionByEngineId(engineQuestionId);
  if (!content) return [];
  return content.phrasing_variants ?? [content.text];
}
