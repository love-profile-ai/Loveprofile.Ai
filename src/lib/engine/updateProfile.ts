import type {
  AnswerValue,
  Question,
  ScoreDelta,
  UserProfile,
} from "@/types/adaptive-engine";
import {
  clampScore,
  mergeDimensionCertainty,
  recalculateConfidence,
} from "./profile-utils";

const UNCERTAIN_VALUES = new Set(["not_sure", "unsure", "maybe", "confused"]);

export function isUncertainAnswer(
  question: Question,
  value: AnswerValue
): boolean {
  const raw = value.raw;

  if (question.type === "single_select" && typeof raw === "string") {
    return UNCERTAIN_VALUES.has(raw.toLowerCase());
  }

  if (question.type === "slider" && typeof raw === "number") {
    const opts = question.options as { min: number; max: number };
    const mid = (opts.min + opts.max) / 2;
    const range = opts.max - opts.min;
    return Math.abs(raw - mid) <= range * 0.15;
  }

  if (question.type === "multi_select" && Array.isArray(raw)) {
    return raw.some((v) => UNCERTAIN_VALUES.has(String(v).toLowerCase()));
  }

  return false;
}

function applyDelta(profile: UserProfile, delta: ScoreDelta): UserProfile {
  return {
    ...profile,
    love_score: clampScore(profile.love_score + (delta.love ?? 0)),
    crush_score: clampScore(profile.crush_score + (delta.crush ?? 0)),
    trust_score: clampScore(profile.trust_score + (delta.trust ?? 0)),
    attachment_score: clampScore(profile.attachment_score + (delta.attachment ?? 0)),
    future_score: clampScore(profile.future_score + (delta.future ?? 0)),
    communication_score: clampScore(
      profile.communication_score + (delta.communication ?? 0)
    ),
    jealousy_score: clampScore(profile.jealousy_score + (delta.jealousy ?? 0)),
    physical_attraction_score: clampScore(
      profile.physical_attraction_score + (delta.physical_attraction ?? 0)
    ),
    emotional_attraction_score: clampScore(
      profile.emotional_attraction_score + (delta.emotional_attraction ?? 0)
    ),
  };
}

export function computeScoreDelta(
  question: Question,
  value: AnswerValue,
  uncertain: boolean
): ScoreDelta {
  const scoring = question.scoring ?? {};
  const delta: ScoreDelta = {};

  if (question.type === "single_select" && typeof value.raw === "string") {
    const map = scoring.single_select?.[value.raw] ?? {};
    Object.assign(delta, map);
  }

  if (question.type === "multi_select" && Array.isArray(value.raw)) {
    for (const v of value.raw) {
      const part = scoring.multi_select?.[v] ?? {};
      for (const [k, n] of Object.entries(part)) {
        const key = k as keyof ScoreDelta;
        delta[key] = (delta[key] ?? 0) + (n ?? 0);
      }
    }
  }

  if (question.type === "slider" && typeof value.raw === "number") {
    const opts = question.options as { min: number; max: number };
    const normalized =
      (value.raw - opts.min) / Math.max(1, opts.max - opts.min);
    const scale = scoring.slider?.scale ?? {};
    for (const [k, factor] of Object.entries(scale)) {
      const key = k as keyof ScoreDelta;
      delta[key] = (delta[key] ?? 0) + normalized * (factor ?? 0) * 10;
    }
    if (scoring.slider?.confidence) {
      delta.confidence = scoring.slider.confidence;
    }
  }

  if (delta.confidence === undefined) {
    delta.confidence = uncertain
      ? question.confidence_value * 0.35
      : question.confidence_value;
  } else if (uncertain) {
    delta.confidence *= 0.4;
  }

  return delta;
}

export function updateProfile(
  profile: UserProfile,
  question: Question,
  value: AnswerValue
): { profile: UserProfile; score_deltas: ScoreDelta; uncertain: boolean } {
  const uncertain = isUncertainAnswer(question, value);
  const score_deltas = computeScoreDelta(question, value, uncertain);

  let next = applyDelta(profile, score_deltas);

  const certaintyBoost = uncertain
    ? (score_deltas.confidence ?? question.confidence_value) * 0.5
    : (score_deltas.confidence ?? question.confidence_value);

  next = {
    ...next,
    dimension_certainty: mergeDimensionCertainty(
      next.dimension_certainty,
      question.psychological_dimension,
      Math.min(1, certaintyBoost * 4)
    ),
    asked_question_ids: next.asked_question_ids.includes(question.id)
      ? next.asked_question_ids
      : [...next.asked_question_ids, question.id],
    confidence_score: 0,
  };

  next.confidence_score = recalculateConfidence(next);

  return { profile: next, score_deltas, uncertain };
}
