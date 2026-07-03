import type { Question, QuestionSet, Answer, AnalysisPath } from "@/types/questionnaire";
import iLikeSomeone from "./paths/i-like-someone.json";
import someoneLikesMe from "./paths/someone-likes-me.json";

const sets: Record<AnalysisPath, QuestionSet> = {
  i_like_someone: iLikeSomeone as QuestionSet,
  someone_likes_me: someoneLikesMe as QuestionSet,
};

export function getQuestionSet(path: AnalysisPath): QuestionSet {
  return sets[path];
}

export function getQuestion(path: AnalysisPath, id: string): Question | undefined {
  return getQuestionSet(path).questions.find((q) => q.id === id);
}

export function getFirstQuestion(path: AnalysisPath): Question {
  const set = getQuestionSet(path);
  return set.questions[0];
}

export function getNextQuestionId(
  path: AnalysisPath,
  currentId: string,
  answerValue: string | number | boolean
): string | null {
  const question = getQuestion(path, currentId);
  if (!question) return null;

  if (question.type === "multiple_choice" && question.options) {
    const selected = question.options.find(
      (o) => o.value === String(answerValue)
    );
    if (selected?.next) return selected.next;
  }

  if (question.next) return question.next;

  const set = getQuestionSet(path);
  const idx = set.questions.findIndex((q) => q.id === currentId);
  if (idx === -1 || idx === set.questions.length - 1) return null;
  return set.questions[idx + 1].id;
}

export function getProgress(path: AnalysisPath, currentId: string): {
  current: number;
  total: number;
} {
  const set = getQuestionSet(path);
  const idx = set.questions.findIndex((q) => q.id === currentId);
  return { current: idx + 1, total: set.questions.length };
}

export function isComplete(
  path: AnalysisPath,
  currentId: string,
  answerValue: string | number | boolean
): boolean {
  return getNextQuestionId(path, currentId, answerValue) === null;
}

export function buildAnswer(
  path: AnalysisPath,
  questionId: string,
  value: string | number | boolean
): Answer {
  const question = getQuestion(path, questionId);
  if (!question) throw new Error("Question not found");
  return {
    questionId,
    questionText: question.text,
    type: question.type,
    value,
  };
}
