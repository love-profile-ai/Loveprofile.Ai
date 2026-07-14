import type {
  Question,
  SessionAnswerRecord,
  UserProfile,
} from "@/types/adaptive-engine";
import {
  buildQuestionSelectionUserPrompt,
  type QuestionSelectionAnswerRecord,
  type QuestionSelectionCandidate,
} from "@/lib/ai/prompts";
import { createOpenRouterClient, OPENROUTER_MODEL } from "@/lib/ai/openrouter";
import {
  LLM_CANDIDATE_POOL_SIZE,
  MIN_QUESTIONS_BEFORE_EARLY_END,
  PROFILE_DIMENSION_MIN_QUESTIONS,
} from "./constants";
import {
  areProfileDimensionsSufficient,
  getProfileDimensionConfidenceScores,
  toProfileDimension,
} from "./profile-dimensions";
import {
  buildCandidatePool,
  selectNextQuestion,
  type SelectQuestionInput,
} from "./selectQuestion";

export interface LlmQuestionSelectionResult {
  question: Question | null;
  source: "llm" | "deterministic" | "clarification";
  reasoning?: string;
  rephrased?: boolean;
}

interface LlmSelectionPayload {
  next_question_id?: string;
  reasoning?: string;
  rephrased_text?: string | null;
}

function isLlmSelectorEnabled(): boolean {
  return process.env.ENABLE_LLM_QUESTION_SELECTOR === "true";
}

function formatAnswerValue(raw: SessionAnswerRecord["value"]["raw"]): string {
  if (Array.isArray(raw)) return raw.join(", ");
  return String(raw);
}

function inferSignal(
  record: SessionAnswerRecord,
  question: Question | undefined
): string {
  if (record.is_uncertain) return "uncertain";

  const dim = question?.psychological_dimension;
  if (!dim) return "neutral";

  const delta = record.score_deltas[dim] ?? 0;
  if (delta >= 6) return "strong_positive";
  if (delta >= 3) return "moderate_positive";
  if (delta <= -3) return "negative";
  if (delta < 0) return "weak";
  return "neutral";
}

function buildAnswerHistory(
  answers: SessionAnswerRecord[],
  questions: Question[]
): QuestionSelectionAnswerRecord[] {
  const byId = new Map(questions.map((q) => [q.id, q]));

  return answers.map((record) => {
    const question = byId.get(record.question_id);
    const profileDimension = question
      ? toProfileDimension(question.psychological_dimension)
      : "unknown";

    return {
      question_id: record.question_id,
      question_text: question?.question_text ?? record.question_id,
      answer: formatAnswerValue(record.value.raw),
      inferred_signal: inferSignal(record, question),
      profile_dimension: profileDimension,
      category: question?.category ?? "general",
    };
  });
}

function toCandidates(questions: Question[]): QuestionSelectionCandidate[] {
  return questions.map((q) => ({
    id: q.id,
    text: q.question_text,
    profile_dimension: toProfileDimension(q.psychological_dimension),
    psychological_dimension: q.psychological_dimension,
    category: q.category,
    priority: q.priority,
  }));
}

function applyRephrasing(
  question: Question,
  rephrasedText: string | null | undefined
): Question {
  if (!rephrasedText?.trim()) return question;
  return { ...question, question_text: rephrasedText.trim() };
}

async function selectViaLlm(
  input: SelectQuestionInput,
  pool: Question[]
): Promise<LlmSelectionPayload | null> {
  const client = createOpenRouterClient();
  const prompt = buildQuestionSelectionUserPrompt({
    dimensionScores: getProfileDimensionConfidenceScores(input.profile),
    answerHistory: buildAnswerHistory(input.answers, input.questions),
    candidates: toCandidates(pool),
    minQuestionsPerDimension: PROFILE_DIMENSION_MIN_QUESTIONS,
  });

  const response = await client.chat.completions.create({
    model: OPENROUTER_MODEL,
    temperature: 0.2,
    max_tokens: 280,
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
    response_format: { type: "json_object" },
  });

  const raw = response.choices[0]?.message?.content;
  if (!raw) return null;

  return JSON.parse(raw) as LlmSelectionPayload;
}

/**
 * Resolve the next question — LLM selector when enabled, deterministic fallback.
 */
export async function resolveNextQuestion(
  input: SelectQuestionInput
): Promise<LlmQuestionSelectionResult> {
  if (input.decision.should_end) {
    return { question: null, source: "deterministic" };
  }

  if (input.clarification_parent_id) {
    const question = selectNextQuestion(input);
    return { question, source: "clarification" };
  }

  const pool = buildCandidatePool(input, LLM_CANDIDATE_POOL_SIZE);
  if (!pool.length) {
    return { question: null, source: "deterministic" };
  }

  const profileCoverageComplete =
    input.profile.asked_question_ids.length >= MIN_QUESTIONS_BEFORE_EARLY_END &&
    areProfileDimensionsSufficient(
      input.profile.asked_question_ids,
      input.questions,
      PROFILE_DIMENSION_MIN_QUESTIONS
    );

  if (profileCoverageComplete) {
    return {
      question: null,
      source: "llm",
      reasoning: "profile_dimensions_sufficient",
    };
  }

  if (!isLlmSelectorEnabled()) {
    return {
      question: selectNextQuestion(input),
      source: "deterministic",
    };
  }

  try {
    const selection = await selectViaLlm(input, pool);
    if (!selection?.next_question_id) {
      return {
        question: selectNextQuestion(input),
        source: "deterministic",
      };
    }

    if (selection.next_question_id === "COMPLETE") {
      if (profileCoverageComplete) {
        return {
          question: null,
          source: "llm",
          reasoning: selection.reasoning,
        };
      }

      return {
        question: selectNextQuestion(input),
        source: "deterministic",
        reasoning: "llm_complete_rejected_insufficient_coverage",
      };
    }

    const chosen = pool.find((q) => q.id === selection.next_question_id);
    if (!chosen) {
      return {
        question: selectNextQuestion(input),
        source: "deterministic",
        reasoning: "llm_invalid_question_id",
      };
    }

    const rephrased = Boolean(selection.rephrased_text?.trim());
    return {
      question: applyRephrasing(chosen, selection.rephrased_text),
      source: "llm",
      reasoning: selection.reasoning,
      rephrased,
    };
  } catch {
    return {
      question: selectNextQuestion(input),
      source: "deterministic",
    };
  }
}
