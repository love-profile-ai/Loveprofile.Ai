import type {
  AnswerValue,
  EnginePath,
  EngineStepResult,
  Question,
  SessionAnswerRecord,
  UserProfile,
} from "@/types/adaptive-engine";
import { evaluateRules } from "./rules";
import { selectNextQuestion } from "./selectQuestion";
import { resolveFollowUp } from "./followUp";
import { updateProfile } from "./updateProfile";

const PATH_LABELS: Record<EnginePath, string> = {
  do_i_love_someone: "Do I Love Someone?",
  does_someone_love_me: "Does Someone Love Me?",
};

export interface ProcessAnswerInput {
  question: Question;
  value: AnswerValue;
  profile: UserProfile;
  answers: SessionAnswerRecord[];
  questions: Question[];
  /** AI-generated clarifications appended per session */
  extraQuestions?: Question[];
}

/**
 * Pure orchestration after one answer — no DB side effects.
 */
export async function processAnswer(
  input: ProcessAnswerInput
): Promise<EngineStepResult & { newAnswer: SessionAnswerRecord; extraQuestion?: Question }> {
  const { question, value, profile, answers, extraQuestions = [] } = input;
  const allQuestions = [...input.questions, ...extraQuestions];

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

  const updatedAnswers = [...answers, newAnswer];
  const askedSet = new Set(updatedProfile.asked_question_ids);

  let extraQuestion: Question | undefined;
  let clarificationParentId: string | undefined;

  const followUp = await resolveFollowUp(
    question,
    value,
    allQuestions,
    askedSet,
    PATH_LABELS[question.path]
  );

  if (followUp && !askedSet.has(followUp.id)) {
    if (!allQuestions.some((q) => q.id === followUp.id)) {
      extraQuestion = followUp;
    }
    clarificationParentId = question.id;
  }

  const decision = evaluateRules(updatedProfile);

  const next_question = selectNextQuestion({
    questions: extraQuestion ? [...allQuestions, extraQuestion] : allQuestions,
    profile: updatedProfile,
    answers: updatedAnswers,
    decision,
    clarification_parent_id: clarificationParentId,
  });

  const finished = decision.should_end || next_question === null;

  return {
    finished,
    decision,
    profile: updatedProfile,
    next_question: finished ? null : next_question,
    score_deltas,
    newAnswer,
    extraQuestion,
  };
}

export function serializeAnswerValue(
  raw: string | number | boolean | string[]
): AnswerValue {
  return { raw };
}
