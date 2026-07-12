/**
 * @deprecated Import from @/lib/engine/question-bank instead.
 * Kept for backward-compatible imports.
 */
export {
  loadQuestionsForPath,
  loadQuestions,
  type QuestionLoadResult,
  type QuestionLoadSource,
} from "./question-bank";

export {
  profileFromRow,
  profileToRow,
  summaryFromProfileRow,
} from "./questions-loader-profiles";

export { getSeedQuestionsForPath, SEED_QUESTIONS } from "./seed-questions";
