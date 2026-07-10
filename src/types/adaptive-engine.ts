/** Engine path identifiers (DB + adaptive engine). */
export type EnginePath = "do_i_love_someone" | "does_someone_love_me";

/** Legacy app paths — mapped at API boundary. */
export type AnalysisPath = "i_like_someone" | "someone_likes_me";

export type QuestionType = "single_select" | "slider" | "multi_select";

export type PsychologicalDimension =
  | "love"
  | "crush"
  | "trust"
  | "attachment"
  | "future"
  | "communication"
  | "jealousy"
  | "physical_attraction"
  | "emotional_attraction";

export const ALL_DIMENSIONS: PsychologicalDimension[] = [
  "love",
  "crush",
  "trust",
  "attachment",
  "future",
  "communication",
  "jealousy",
  "physical_attraction",
  "emotional_attraction",
];

export interface QuestionOption {
  label: string;
  value: string;
}

export interface SliderOptions {
  min: number;
  max: number;
}

export type FollowUpRule =
  | { type: "dimension_below"; dimension: PsychologicalDimension; threshold: number }
  | { type: "dimension_uncertain"; dimension: PsychologicalDimension; below: number }
  | { type: "dimension_gap"; high: PsychologicalDimension; low: PsychologicalDimension; gap: number }
  | { type: "answer_equals"; question_id: string; value: string }
  | { type: "dimension_above"; dimension: PsychologicalDimension; threshold: number };

export interface FollowUpRules {
  skip_if?: FollowUpRule[];
  only_if?: FollowUpRule[];
}

export interface QuestionScoring {
  single_select?: Record<string, Partial<ScoreDelta>>;
  slider?: {
    scale?: Partial<Record<keyof ScoreDelta, number>>;
    confidence?: number;
  };
  multi_select?: Record<string, Partial<ScoreDelta>>;
}

export interface Question {
  id: string;
  path: EnginePath;
  category: string;
  question_text: string;
  type: QuestionType;
  options: QuestionOption[] | SliderOptions;
  psychological_dimension: PsychologicalDimension;
  weight: number;
  priority: number;
  follow_up_rules: FollowUpRules;
  scoring: QuestionScoring;
  confidence_value: number;
  parent_question_id?: string | null;
  is_clarification?: boolean;
  is_starter?: boolean;
  is_active?: boolean;
}

export interface AnswerValue {
  /** single_select / multi_select / slider value(s) */
  raw: string | number | boolean | string[];
}

export interface Answer {
  question_id: string;
  question_text: string;
  type: QuestionType;
  value: AnswerValue;
  is_uncertain?: boolean;
}

export interface ScoreDelta {
  love?: number;
  crush?: number;
  trust?: number;
  attachment?: number;
  future?: number;
  communication?: number;
  jealousy?: number;
  physical_attraction?: number;
  emotional_attraction?: number;
  confidence?: number;
}

export type DimensionCertainty = Partial<Record<PsychologicalDimension, number>>;

export interface UserProfile {
  love_score: number;
  crush_score: number;
  trust_score: number;
  attachment_score: number;
  future_score: number;
  communication_score: number;
  jealousy_score: number;
  physical_attraction_score: number;
  emotional_attraction_score: number;
  confidence_score: number;
  dimension_certainty: DimensionCertainty;
  asked_question_ids: string[];
}

export type EngineDecisionReason =
  | "confidence_threshold_met"
  | "all_dimensions_covered"
  | "max_questions_reached"
  | "no_eligible_questions"
  | "needs_clarification"
  | "continue";

export interface EngineDecision {
  should_end: boolean;
  reason: EngineDecisionReason;
  /** Dimensions the rule engine wants clarified next (highest priority first). */
  priority_dimensions: PsychologicalDimension[];
  /** If set, a clarification question should be asked before normal selection. */
  clarification_parent_id?: string;
}

export interface AssessmentSession {
  id: string;
  user_id: string;
  path: EnginePath;
  status: "in_progress" | "completed" | "abandoned";
  question_count: number;
  created_at: string;
  updated_at: string;
}

export interface SessionAnswerRecord {
  id: string;
  session_id: string;
  question_id: string;
  value: AnswerValue;
  score_deltas: ScoreDelta;
  is_uncertain: boolean;
  created_at: string;
}

export interface EngineStepResult {
  finished: boolean;
  decision: EngineDecision;
  profile: UserProfile;
  next_question: Question | null;
  score_deltas?: ScoreDelta;
}

export interface StructuredReport {
  relationship_type: string;
  emotional_connection: string;
  strengths: string[];
  uncertainty_areas: string[];
  confidence_percent: number;
  confidence_label: "Low" | "Medium" | "High";
  suggested_next_steps: string[];
  dimension_scores: Record<string, number>;
  summary: string;
}

/** Compact session summary — sole input for final AI report (no full Q&A history). */
export interface AssessmentSummary {
  path: EnginePath;
  relationship_context: string;
  psychological_insights: string[];
  dimension_scores: Record<string, number>;
  confidence_percent: number;
  confidence_label: "Low" | "Medium" | "High";
  key_observations: string[];
  caution_areas: string[];
  dominant_themes: string[];
  questions_answered: number;
}
