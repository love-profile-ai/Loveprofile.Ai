export const CONFIDENCE_END_THRESHOLD = 90;
export const CONFIDENCE_CLARIFY_THRESHOLD = 75;
export const MIN_QUESTIONS_BEFORE_EARLY_END = 18;
export const MAX_QUESTIONS = 18;

/** Score ceiling per dimension (0–100 scale). */
export const SCORE_CEILING = 100;
export const SCORE_FLOOR = 0;

/** Dimensions required for "all covered" early stop. */
export const REQUIRED_DIMENSIONS = [
  "love",
  "crush",
  "friendship",
  "trust",
  "attachment",
  "commitment",
  "communication",
  "future",
  "physical_attraction",
  "emotional_attraction",
  "jealousy",
  "reciprocity",
] as const;

export const DIMENSION_CERTAINTY_THRESHOLD = 0.72;

/** Min questions per profile dimension before LLM may return COMPLETE. */
export const PROFILE_DIMENSION_MIN_QUESTIONS = 4;

/** Max candidates passed to the LLM question selector. */
export const LLM_CANDIDATE_POOL_SIZE = 15;
