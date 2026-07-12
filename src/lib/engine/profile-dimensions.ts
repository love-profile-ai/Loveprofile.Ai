import type {
  PsychologicalDimension,
  Question,
  SessionAnswerRecord,
  UserProfile,
} from "@/types/adaptive-engine";
import { getDimensionCertainty } from "./profile-utils";

/** High-level dimensions surfaced to the LLM question selector */
export type ProfileDimension =
  | "trust_emotional_safety"
  | "communication_clarity"
  | "attraction_balance"
  | "long_term_compatibility";

export const PROFILE_DIMENSIONS: ProfileDimension[] = [
  "trust_emotional_safety",
  "communication_clarity",
  "attraction_balance",
  "long_term_compatibility",
];

const PROFILE_DIMENSION_GROUPS: Record<
  ProfileDimension,
  PsychologicalDimension[]
> = {
  trust_emotional_safety: ["trust", "attachment", "jealousy"],
  communication_clarity: ["communication"],
  attraction_balance: [
    "love",
    "crush",
    "physical_attraction",
    "emotional_attraction",
  ],
  long_term_compatibility: ["future", "commitment", "reciprocity", "friendship"],
};

export const DIMENSION_TO_PROFILE: Record<
  PsychologicalDimension,
  ProfileDimension
> = Object.fromEntries(
  Object.entries(PROFILE_DIMENSION_GROUPS).flatMap(([profile, dims]) =>
    dims.map((d) => [d, profile as ProfileDimension])
  )
) as Record<PsychologicalDimension, ProfileDimension>;

/** Confidence 0–100: how much data has been collected (not positivity). */
export function getProfileDimensionConfidenceScores(
  profile: UserProfile
): Record<ProfileDimension, number> {
  const scores = {} as Record<ProfileDimension, number>;

  for (const profileDim of PROFILE_DIMENSIONS) {
    const dims = PROFILE_DIMENSION_GROUPS[profileDim];
    const avg =
      dims.reduce((sum, d) => sum + getDimensionCertainty(profile, d), 0) /
      dims.length;
    scores[profileDim] = Math.round(avg * 100);
  }

  return scores;
}

export function countQuestionsPerProfileDimension(
  askedIds: string[],
  questions: Question[]
): Record<ProfileDimension, number> {
  const counts = Object.fromEntries(
    PROFILE_DIMENSIONS.map((d) => [d, 0])
  ) as Record<ProfileDimension, number>;

  const byId = new Map(questions.map((q) => [q.id, q]));

  for (const id of askedIds) {
    const question = byId.get(id);
    if (!question || question.is_clarification) continue;
    const profileDim = DIMENSION_TO_PROFILE[question.psychological_dimension];
    counts[profileDim] += 1;
  }

  return counts;
}

export function areProfileDimensionsSufficient(
  askedIds: string[],
  questions: Question[],
  minPerDimension: number
): boolean {
  const counts = countQuestionsPerProfileDimension(askedIds, questions);
  return PROFILE_DIMENSIONS.every((d) => counts[d] >= minPerDimension);
}

export function toProfileDimension(
  dimension: PsychologicalDimension
): ProfileDimension {
  return DIMENSION_TO_PROFILE[dimension];
}
