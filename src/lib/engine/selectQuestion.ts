import type {
  EngineDecision,
  Question,
  SessionAnswerRecord,
  UserProfile,
} from "@/types/adaptive-engine";
import { getDimensionUncertainty } from "./profile-utils";
import { isQuestionRelevant } from "./relevance";

export interface SelectQuestionInput {
  questions: Question[];
  profile: UserProfile;
  answers: SessionAnswerRecord[];
  decision: EngineDecision;
  /** Force a clarification for this parent question id. */
  clarification_parent_id?: string;
}

/**
 * Rank candidates by priority × uncertainty × weight.
 * Returns null when no eligible question remains.
 */
export function selectNextQuestion(
  input: SelectQuestionInput
): Question | null {
  const { questions, profile, answers, decision, clarification_parent_id } =
    input;

  if (decision.should_end) return null;

  const asked = new Set(profile.asked_question_ids);

  if (clarification_parent_id) {
    const clarification = questions.find(
      (q) =>
        q.is_clarification &&
        q.parent_question_id === clarification_parent_id &&
        q.is_active !== false &&
        !asked.has(q.id)
    );
    if (clarification) return clarification;
  }

  const eligible = questions.filter(
    (q) =>
      q.is_active !== false &&
      !q.is_clarification &&
      !asked.has(q.id) &&
      isQuestionRelevant(q, profile, answers)
  );

  if (!eligible.length) return null;

  const priorityDims = decision.priority_dimensions;

  const scored = eligible.map((q) => {
    const uncertainty = getDimensionUncertainty(
      profile,
      q.psychological_dimension
    );
    const dimBoost = priorityDims.includes(q.psychological_dimension) ? 1.5 : 1;
    const starterBoost = q.is_starter && asked.size < 2 ? 1.25 : 1;
    const rank = q.priority * uncertainty * q.weight * dimBoost * starterBoost;
    return { question: q, rank };
  });

  scored.sort((a, b) => b.rank - a.rank);
  return scored[0]?.question ?? null;
}

/** Build a ranked candidate pool for the LLM selector. */
export function buildCandidatePool(
  input: SelectQuestionInput,
  limit = 15
): Question[] {
  const { questions, profile, answers, decision, clarification_parent_id } =
    input;

  if (decision.should_end) return [];

  const asked = new Set(profile.asked_question_ids);

  if (clarification_parent_id) {
    const clarification = questions.find(
      (q) =>
        q.is_clarification &&
        q.parent_question_id === clarification_parent_id &&
        q.is_active !== false &&
        !asked.has(q.id)
    );
    return clarification ? [clarification] : [];
  }

  const eligible = questions.filter(
    (q) =>
      q.is_active !== false &&
      !q.is_clarification &&
      !asked.has(q.id) &&
      isQuestionRelevant(q, profile, answers)
  );

  const priorityDims = decision.priority_dimensions;

  const scored = eligible.map((q) => {
    const uncertainty = getDimensionUncertainty(
      profile,
      q.psychological_dimension
    );
    const dimBoost = priorityDims.includes(q.psychological_dimension) ? 1.5 : 1;
    const starterBoost = q.is_starter && asked.size < 2 ? 1.25 : 1;
    const rank = q.priority * uncertainty * q.weight * dimBoost * starterBoost;
    return { question: q, rank };
  });

  scored.sort((a, b) => b.rank - a.rank);
  return scored.slice(0, limit).map((s) => s.question);
}

/** Pick the first starter question for a new session. */
export function selectFirstQuestion(
  questions: Question[],
  profile: UserProfile
): Question | null {
  const asked = new Set(profile.asked_question_ids);
  const starters = questions
    .filter(
      (q) =>
        q.is_active !== false &&
        q.is_starter &&
        !q.is_clarification &&
        !asked.has(q.id)
    )
    .sort((a, b) => b.priority - a.priority);

  if (starters.length) return starters[0];

  return selectNextQuestion({
    questions,
    profile,
    answers: [],
    decision: {
      should_end: false,
      reason: "continue",
      priority_dimensions: ["love", "attachment"],
    },
  });
}
