import type {
  AnswerValue,
  AssessmentPhase,
  EngineDecision,
  EnginePath,
  Question,
  ScoreDelta,
  SessionAnswerRecord,
  UserProfile,
} from "@/types/adaptive-engine";
import { updateProfile } from "./updateProfile";
import { evaluateRules } from "./rules";
import { resolveNextQuestion } from "./selectQuestionLlm";
import { getSeedQuestionsForPath } from "./seed-questions";
import {
  FOUNDATION_QUESTION_COUNT,
  getFoundationQuestionById,
  getFoundationQuestions,
  getFirstFoundationQuestion,
  isFoundationQuestionId,
} from "./foundation-questions";

function mergeQuestionsById(...pools: Question[][]): Question[] {
  const byId = new Map<string, Question>();
  for (const pool of pools) {
    for (const question of pool) {
      byId.set(question.id, question);
    }
  }
  return [...byId.values()];
}

/** DB rows + bundled seed/content so clarifications and follow-ups always resolve. */
export function getSessionQuestionBank(
  path: EnginePath,
  adaptiveQuestions: Question[]
): Question[] {
  return mergeQuestionsById(getSeedQuestionsForPath(path), adaptiveQuestions);
}

function isValidClientQuestion(
  candidate: unknown,
  path: EnginePath,
  questionId: string
): candidate is Question {
  if (!candidate || typeof candidate !== "object") return false;
  const q = candidate as Question;
  return (
    q.id === questionId &&
    q.path === path &&
    typeof q.question_text === "string" &&
    (q.type === "single_select" ||
      q.type === "slider" ||
      q.type === "multi_select")
  );
}

export interface FoundationStepResult {
  profile: UserProfile;
  score_deltas: ScoreDelta;
  newAnswer: SessionAnswerRecord;
  foundationComplete: boolean;
  nextFoundationQuestion: Question | null;
}

export function countFoundationAnswers(
  profile: UserProfile,
  path: EnginePath
): number {
  const foundationIds = new Set(getFoundationQuestions(path).map((q) => q.id));
  return profile.asked_question_ids.filter((id) => foundationIds.has(id)).length;
}

export function isInFoundationPhase(
  profile: UserProfile,
  path: EnginePath
): boolean {
  return countFoundationAnswers(profile, path) < FOUNDATION_QUESTION_COUNT;
}

export function getAssessmentPhase(
  profile: UserProfile,
  path: EnginePath
): AssessmentPhase {
  return isInFoundationPhase(profile, path) ? "foundation" : "adaptive";
}

/** Next unanswered foundation question in fixed order, or null when complete. */
export function getNextFoundationQuestion(
  profile: UserProfile,
  path: EnginePath
): Question | null {
  const asked = new Set(profile.asked_question_ids);
  return getFoundationQuestions(path).find((q) => !asked.has(q.id)) ?? null;
}

/**
 * Process one foundation answer — updates profile only.
 * Does not invoke the adaptive question engine.
 */
export function processFoundationAnswer(input: {
  path: EnginePath;
  question: Question;
  value: AnswerValue;
  profile: UserProfile;
  answers: SessionAnswerRecord[];
}): FoundationStepResult {
  const { path, question, value, profile } = input;

  if (!question.is_foundation || !isFoundationQuestionId(question.id)) {
    throw new Error("Not a foundation question");
  }

  const nextExpected = getNextFoundationQuestion(profile, path);
  if (!nextExpected || nextExpected.id !== question.id) {
    throw new Error("Foundation questions must be answered in fixed order");
  }

  const { profile: updatedProfile, score_deltas, uncertain } = updateProfile(
    profile,
    question,
    value
  );

  const newAnswer: SessionAnswerRecord = {
    id: crypto.randomUUID(),
    session_id: "",
    question_id: question.id,
    value,
    score_deltas,
    is_uncertain: uncertain,
    created_at: new Date().toISOString(),
  };

  const foundationComplete =
    countFoundationAnswers(updatedProfile, path) >= FOUNDATION_QUESTION_COUNT;

  const nextFoundationQuestion = foundationComplete
    ? null
    : getNextFoundationQuestion(updatedProfile, path);

  return {
    profile: updatedProfile,
    score_deltas,
    newAnswer,
    foundationComplete,
    nextFoundationQuestion,
  };
}

export function resolveQuestionForSession(
  path: EnginePath,
  questionId: string,
  adaptiveQuestions: Question[],
  clientQuestion?: unknown
): Question | null {
  if (isFoundationQuestionId(questionId)) {
    return getFoundationQuestionById(path, questionId);
  }

  const bank = getSessionQuestionBank(path, adaptiveQuestions);
  const fromBank = bank.find((q) => q.id === questionId);
  if (fromBank) return fromBank;

  if (isValidClientQuestion(clientQuestion, path, questionId)) {
    return clientQuestion;
  }

  return null;
}

export async function getAdaptiveQuestionAfterFoundation(input: {
  profile: UserProfile;
  answers: SessionAnswerRecord[];
  questions: Question[];
}): Promise<{
  decision: EngineDecision;
  nextQuestion: Question | null;
  finished: boolean;
}> {
  const decision = evaluateRules(input.profile);
  const selection = await resolveNextQuestion({
    questions: input.questions,
    profile: input.profile,
    answers: input.answers,
    decision,
  });

  const finished = decision.should_end || selection.question === null;

  return {
    decision,
    nextQuestion: selection.question,
    finished,
  };
}

export {
  FOUNDATION_QUESTION_COUNT,
  getFoundationQuestions,
  getFirstFoundationQuestion,
  getFoundationQuestionById,
  isFoundationQuestionId,
};
