import type {
  EngineDecision,
  PsychologicalDimension,
  UserProfile,
} from "@/types/adaptive-engine";
import { ALL_DIMENSIONS } from "@/types/adaptive-engine";
import {
  CONFIDENCE_CLARIFY_THRESHOLD,
  CONFIDENCE_END_THRESHOLD,
  MAX_QUESTIONS,
  MIN_QUESTIONS_BEFORE_EARLY_END,
  REQUIRED_DIMENSIONS,
} from "./constants";
import {
  allRequiredDimensionsCovered,
  getDimensionScore,
  getDimensionUncertainty,
  isDimensionConfidentlyAnswered,
} from "./profile-utils";

function dimensionNeedsClarification(
  profile: UserProfile,
  dimension: PsychologicalDimension
): boolean {
  const uncertainty = getDimensionUncertainty(profile, dimension);
  const score = getDimensionScore(profile, dimension);
  return uncertainty > 0.45 || (score > 0 && score < 100 && uncertainty > 0.3);
}

/**
 * Pure rule engine — inspects profile state and returns what to do next.
 */
export function evaluateRules(profile: UserProfile): EngineDecision {
  const asked = profile.asked_question_ids.length;

  if (
    asked >= MIN_QUESTIONS_BEFORE_EARLY_END &&
    profile.confidence_score >= CONFIDENCE_END_THRESHOLD
  ) {
    return {
      should_end: true,
      reason: "confidence_threshold_met",
      priority_dimensions: [],
    };
  }

  if (asked >= MIN_QUESTIONS_BEFORE_EARLY_END && allRequiredDimensionsCovered(profile)) {
    return {
      should_end: true,
      reason: "all_dimensions_covered",
      priority_dimensions: [],
    };
  }

  if (asked >= MAX_QUESTIONS) {
    return {
      should_end: true,
      reason: "max_questions_reached",
      priority_dimensions: [],
    };
  }

  const priority_dimensions: PsychologicalDimension[] = [];

  // Trust low or unmeasured
  if (
    getDimensionScore(profile, "trust") < 35 ||
    !isDimensionConfidentlyAnswered(profile, "trust")
  ) {
    priority_dimensions.push("trust");
  }

  // Future ambiguous
  if (dimensionNeedsClarification(profile, "future")) {
    priority_dimensions.push("future");
  }

  // Physical high, emotional low/unmeasured
  const physical = getDimensionScore(profile, "physical_attraction");
  const emotional = getDimensionScore(profile, "emotional_attraction");
  if (
    physical >= 55 &&
    (emotional < 40 || !isDimensionConfidentlyAnswered(profile, "emotional_attraction"))
  ) {
    priority_dimensions.push("emotional_attraction");
  }

  // Love / crush core dimensions
  if (!isDimensionConfidentlyAnswered(profile, "love")) {
    priority_dimensions.push("love");
  }
  if (!isDimensionConfidentlyAnswered(profile, "crush")) {
    priority_dimensions.push("crush");
  }

  // Communication gap
  if (dimensionNeedsClarification(profile, "communication")) {
    priority_dimensions.push("communication");
  }

  // Attachment
  if (!isDimensionConfidentlyAnswered(profile, "attachment")) {
    priority_dimensions.push("attachment");
  }

  // Jealousy if love/crush are developing
  if (
    (getDimensionScore(profile, "love") > 30 || getDimensionScore(profile, "crush") > 30) &&
    !isDimensionConfidentlyAnswered(profile, "jealousy")
  ) {
    priority_dimensions.push("jealousy");
  }

  // Fill remaining uncertain dimensions
  for (const dim of ALL_DIMENSIONS) {
    if (
      !priority_dimensions.includes(dim) &&
      getDimensionUncertainty(profile, dim) > 0.5
    ) {
      priority_dimensions.push(dim);
    }
  }

  const unique = [...new Set(priority_dimensions)];

  if (
    profile.confidence_score < CONFIDENCE_CLARIFY_THRESHOLD &&
    asked >= 2
  ) {
    return {
      should_end: false,
      reason: "needs_clarification",
      priority_dimensions: unique,
    };
  }

  return {
    should_end: false,
    reason: "continue",
    priority_dimensions: unique,
  };
}

/** Check if all required dimensions have been confidently measured. */
export function requiredDimensionsSatisfied(profile: UserProfile): boolean {
  return REQUIRED_DIMENSIONS.every((d) =>
    isDimensionConfidentlyAnswered(profile, d as PsychologicalDimension)
  );
}
