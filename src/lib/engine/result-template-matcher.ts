import {
  ALL_RESULT_TEMPLATES,
  type ResultTemplate,
  type ResultTemplateMatch,
} from "@/content/result-templates-gap-fill";
import type { SessionAnswerRecord, UserProfile } from "@/types/adaptive-engine";
import { PROFILE_DIMENSIONS, type ProfileDimension } from "./profile-dimensions";
import { getDimensionScore } from "./profile-utils";
import { buildComputedDimensionScores } from "./report-inputs";

export type SignalLevel = "low" | "medium" | "high";
export type ConsistencyLevel = "clear" | "mixed";
export type ReciprocityLevel = "mutual" | "one_sided" | "unclear";

export interface ComputedDimensionOutlier {
  outlier_dimension: ProfileDimension;
  gap: number;
  peer_avg: number;
}

export interface MatchAxes {
  signal: SignalLevel;
  consistency: ConsistencyLevel;
  reciprocity: ReciprocityLevel;
  ambiguity_rate: number;
  connection_stage: "early" | "established_or_ongoing";
  trend?: "rising" | "falling" | "stable";
  dimension_outlier?: ComputedDimensionOutlier;
}

export interface PriorReportContext {
  hours_since_last_session?: number;
  prior_dimension_scores?: Partial<Record<ProfileDimension, number>>;
}

export interface FindBestMatchInput {
  profile: UserProfile;
  answers: SessionAnswerRecord[];
  priorReport?: PriorReportContext | null;
  templates?: ResultTemplate[];
}

/** Deterministic seed from the user's exact answer set — same answers, same picks. */
export function hashAnswerSeed(answers: SessionAnswerRecord[]): number {
  const fingerprint = answers
    .map((a) => `${a.question_id}:${JSON.stringify(a.value.raw)}`)
    .join("|");

  let hash = 0;
  for (let i = 0; i < fingerprint.length; i++) {
    hash = (hash * 31 + fingerprint.charCodeAt(i)) >>> 0;
  }
  return hash;
}

export function pickVariant<T>(variants: T[], seed: number, salt = 0): T {
  if (!variants.length) {
    throw new Error("pickVariant: received an empty variants array");
  }
  return variants[(seed + salt) % variants.length];
}

function profileDimensionAverages(
  profile: UserProfile
): Record<ProfileDimension, number> {
  const computed = buildComputedDimensionScores(profile);
  return {
    trust_emotional_safety: computed.profile_trust_emotional_safety ?? 0,
    communication_clarity: computed.profile_communication_clarity ?? 0,
    attraction_balance: computed.profile_attraction_balance ?? 0,
    long_term_compatibility: computed.profile_long_term_compatibility ?? 0,
  };
}

export function computeSignal(profile: UserProfile): SignalLevel {
  const dims = Object.values(profileDimensionAverages(profile));
  const avg = dims.reduce((s, v) => s + v, 0) / dims.length;
  if (avg >= 60) return "high";
  if (avg >= 40) return "medium";
  return "low";
}

export function computeConsistency(profile: UserProfile): ConsistencyLevel {
  const dims = Object.values(profileDimensionAverages(profile));
  const avg = dims.reduce((s, v) => s + v, 0) / dims.length;
  const variance = dims.reduce((s, v) => s + (v - avg) ** 2, 0) / dims.length;
  const stdDev = Math.sqrt(variance);
  return stdDev >= 14 ? "mixed" : "clear";
}

/**
 * Reciprocity: the bank does have reciprocity-tagged questions (e.g.
 * "who reaches out first" — fdsl_03, reciprocity_* in migration 005).
 * Prefer a direct answer to that family when present, otherwise fall
 * back to the aggregate reciprocity dimension score.
 */
export function computeReciprocity(
  profile: UserProfile,
  answers: SessionAnswerRecord[]
): ReciprocityLevel {
  const reciprocityAnswers = answers.filter((a) =>
    ["mostly_me", "mostly_them", "equal", "varies"].includes(String(a.value.raw))
  );

  if (reciprocityAnswers.some((a) => a.value.raw === "equal")) return "mutual";
  if (
    reciprocityAnswers.some(
      (a) => a.value.raw === "mostly_me" || a.value.raw === "mostly_them"
    )
  ) {
    return "one_sided";
  }

  const score = getDimensionScore(profile, "reciprocity");
  if (score >= 58) return "mutual";
  if (score <= 42) return "one_sided";
  return "unclear";
}

function computeAmbiguityRate(answers: SessionAnswerRecord[]): number {
  if (!answers.length) return 0;
  return answers.filter((a) => a.is_uncertain).length / answers.length;
}

function computeConnectionStage(
  profile: UserProfile
): "early" | "established_or_ongoing" {
  return profile.asked_question_ids.length < 14 || profile.confidence_score < 45
    ? "early"
    : "established_or_ongoing";
}

function computeTrend(
  profile: UserProfile,
  prior?: PriorReportContext | null
): "rising" | "falling" | "stable" | undefined {
  const priorScores = prior?.prior_dimension_scores;
  if (!priorScores) return undefined;

  const current = profileDimensionAverages(profile);
  const deltas = PROFILE_DIMENSIONS.map(
    (d) => current[d] - (priorScores[d] ?? current[d])
  );
  const avgDelta = deltas.reduce((s, v) => s + v, 0) / deltas.length;

  if (avgDelta >= 6) return "rising";
  if (avgDelta <= -6) return "falling";
  return "stable";
}

function computeDimensionOutlier(
  profile: UserProfile
): ComputedDimensionOutlier | undefined {
  const scores = profileDimensionAverages(profile);
  let best: ComputedDimensionOutlier | null = null;

  for (const dim of PROFILE_DIMENSIONS) {
    const others = PROFILE_DIMENSIONS.filter((d) => d !== dim);
    const peer_avg = others.reduce((s, d) => s + scores[d], 0) / others.length;
    const gap = peer_avg - scores[dim];
    if (!best || gap > best.gap) {
      best = { outlier_dimension: dim, gap, peer_avg };
    }
  }

  if (!best || best.gap < 18) return undefined;
  return best;
}

export function computeMatchAxes(
  profile: UserProfile,
  answers: SessionAnswerRecord[],
  priorReport?: PriorReportContext | null
): MatchAxes {
  return {
    signal: computeSignal(profile),
    consistency: computeConsistency(profile),
    reciprocity: computeReciprocity(profile, answers),
    ambiguity_rate: computeAmbiguityRate(answers),
    connection_stage: computeConnectionStage(profile),
    trend: computeTrend(profile, priorReport),
    dimension_outlier: computeDimensionOutlier(profile),
  };
}

/** Templates with more non-"any"/non-undefined match keys are tried first. */
function matchSpecificity(match: ResultTemplateMatch): number {
  return Object.values(match).filter((v) => v !== undefined && v !== "any").length;
}

function dimensionOutlierMatches(
  spec: NonNullable<ResultTemplateMatch["dimension_outlier"]>,
  actual?: ComputedDimensionOutlier
): boolean {
  if (!actual) return false;
  return (
    spec.outlier_dimension === actual.outlier_dimension &&
    actual.gap >= spec.gap_gte &&
    actual.peer_avg >= spec.peer_avg_gte
  );
}

function templateMatches(
  match: ResultTemplateMatch,
  axes: MatchAxes,
  prior?: PriorReportContext | null
): boolean {
  if (match.signal && match.signal !== axes.signal) return false;
  if (match.consistency && match.consistency !== axes.consistency) return false;
  if (match.reciprocity && match.reciprocity !== axes.reciprocity) return false;
  if (match.connection_stage && match.connection_stage !== axes.connection_stage) {
    return false;
  }
  if (match.trend && match.trend !== axes.trend) return false;
  if (
    match.ambiguity_rate_gte !== undefined &&
    axes.ambiguity_rate < match.ambiguity_rate_gte
  ) {
    return false;
  }
  if (match.is_retest && prior?.hours_since_last_session === undefined) {
    return false;
  }
  if (
    match.hours_since_last_session_lte !== undefined &&
    (prior?.hours_since_last_session ?? Infinity) > match.hours_since_last_session_lte
  ) {
    return false;
  }
  if (
    match.dimension_outlier &&
    !dimensionOutlierMatches(match.dimension_outlier, axes.dimension_outlier)
  ) {
    return false;
  }
  return true;
}

/**
 * Walks the template bank, most-specific-match-first, and returns the
 * first full match. Falls back to "mixed_clarifying" — never silently.
 */
export function findBestMatch(input: FindBestMatchInput): ResultTemplate {
  const candidates = (input.templates ?? ALL_RESULT_TEMPLATES).filter(
    (t) => t.id !== "mixed_clarifying"
  );
  const axes = computeMatchAxes(input.profile, input.answers, input.priorReport);

  const ranked = [...candidates].sort(
    (a, b) => matchSpecificity(b.match) - matchSpecificity(a.match)
  );

  for (const template of ranked) {
    if (templateMatches(template.match, axes, input.priorReport)) {
      return template;
    }
  }

  console.warn(
    "[result-template-matcher] No template matched computed axes — falling back to mixed_clarifying.",
    axes
  );

  const fallback = (input.templates ?? ALL_RESULT_TEMPLATES).find(
    (t) => t.id === "mixed_clarifying"
  );
  if (!fallback) {
    throw new Error(
      "[result-template-matcher] mixed_clarifying fallback template is missing from the template bank."
    );
  }
  return fallback;
}
