import type {
  DimensionCertainty,
  PsychologicalDimension,
  UserProfile,
} from "@/types/adaptive-engine";
import { ALL_DIMENSIONS } from "@/types/adaptive-engine";
import { DIMENSION_CERTAINTY_THRESHOLD } from "./constants";

export function createEmptyProfile(): UserProfile {
  return {
    love_score: 0,
    crush_score: 0,
    trust_score: 0,
    attachment_score: 0,
    future_score: 0,
    communication_score: 0,
    jealousy_score: 0,
    physical_attraction_score: 0,
    emotional_attraction_score: 0,
    confidence_score: 0,
    dimension_certainty: {},
    asked_question_ids: [],
  };
}

export function getDimensionScore(
  profile: UserProfile,
  dimension: PsychologicalDimension
): number {
  const key = `${dimension}_score` as keyof UserProfile;
  const value = profile[key];
  return typeof value === "number" ? value : 0;
}

export function getDimensionCertainty(
  profile: UserProfile,
  dimension: PsychologicalDimension
): number {
  return profile.dimension_certainty[dimension] ?? 0;
}

export function getDimensionUncertainty(
  profile: UserProfile,
  dimension: PsychologicalDimension
): number {
  return 1 - getDimensionCertainty(profile, dimension);
}

export function isDimensionConfidentlyAnswered(
  profile: UserProfile,
  dimension: PsychologicalDimension
): boolean {
  return getDimensionCertainty(profile, dimension) >= DIMENSION_CERTAINTY_THRESHOLD;
}

export function allRequiredDimensionsCovered(profile: UserProfile): boolean {
  const required: PsychologicalDimension[] = [
    "love",
    "trust",
    "attachment",
    "communication",
  ];
  return required.every((d) => isDimensionConfidentlyAnswered(profile, d));
}

export function countMeasuredDimensions(profile: UserProfile): number {
  return ALL_DIMENSIONS.filter((d) => getDimensionCertainty(profile, d) > 0).length;
}

export function clampScore(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value * 10) / 10));
}

export function recalculateConfidence(profile: UserProfile): number {
  const certainties = ALL_DIMENSIONS.map((d) => getDimensionCertainty(profile, d));
  const measured = certainties.filter((c) => c > 0);
  if (measured.length === 0) return 0;

  const avgCertainty =
    measured.reduce((sum, c) => sum + c, 0) / measured.length;
  const coverage = measured.length / ALL_DIMENSIONS.length;
  const questionBoost = Math.min(profile.asked_question_ids.length * 2.5, 25);

  return clampScore(avgCertainty * 55 * coverage + questionBoost);
}

export function mergeDimensionCertainty(
  current: DimensionCertainty,
  dimension: PsychologicalDimension,
  incoming: number
): DimensionCertainty {
  const prev = current[dimension] ?? 0;
  return {
    ...current,
    [dimension]: Math.min(1, Math.max(prev, incoming)),
  };
}
