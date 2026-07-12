import type {
  PsychologicalDimension,
  Question,
  SessionAnswerRecord,
  UserProfile,
} from "@/types/adaptive-engine";
import { ALL_DIMENSIONS } from "@/types/adaptive-engine";
import {
  getDimensionCertainty,
  getDimensionScore,
} from "./profile-utils";
import { buildComputedDimensionScores } from "./report-inputs";
import { getFoundationQuestions } from "./foundation-phase";
import { toAnalysisReport } from "./generateReport";
import type { EnginePath } from "@/types/adaptive-engine";

const DIMENSION_LABELS: Record<PsychologicalDimension, string> = {
  love: "romantic love",
  crush: "excitement and spark",
  friendship: "friendship foundation",
  trust: "trust and emotional safety",
  attachment: "emotional attachment",
  commitment: "commitment",
  future: "long-term future",
  communication: "communication",
  jealousy: "jealousy and security",
  physical_attraction: "physical attraction",
  emotional_attraction: "emotional attraction",
  reciprocity: "mutual effort",
};

export type ConsistencyLabel = "high" | "medium" | "low";

export type NotableSignal = "positive" | "uncertain" | "negative";

export interface NotableAnswer {
  question: string;
  answer: string;
  dimension: string;
  signal: NotableSignal;
}

export interface PersonalizationLayerInput {
  dimension_scores: Record<string, number>;
  lowest_dimension: string;
  highest_dimension: string;
  most_distinctive_answer: string;
  notable_answers: NotableAnswer[];
  sample_answers_for_tone: { question: string; answer: string }[];
  n_questions_answered: number;
  answer_consistency: ConsistencyLabel;
}

function formatAnswer(raw: SessionAnswerRecord["value"]["raw"]): string {
  if (Array.isArray(raw)) return raw.join(", ");
  return String(raw);
}

function buildQuestionLookup(
  path: EnginePath,
  questions: Question[]
): Map<string, Question> {
  const map = new Map<string, Question>();
  for (const q of getFoundationQuestions(path)) map.set(q.id, q);
  for (const q of questions) map.set(q.id, q);
  return map;
}

function dimensionDeltaMagnitude(
  record: SessionAnswerRecord,
  dimension?: PsychologicalDimension
): number {
  if (!dimension) return 0;
  return Math.abs(record.score_deltas[dimension] ?? 0);
}

function classifySignal(
  record: SessionAnswerRecord,
  dimension: PsychologicalDimension
): NotableSignal {
  if (record.is_uncertain) return "uncertain";
  const delta = record.score_deltas[dimension] ?? 0;
  if (delta >= 4) return "positive";
  if (delta <= -2) return "negative";
  if (delta < 2) return "uncertain";
  return "positive";
}

function deriveConsistencyLabel(
  profile: UserProfile,
  answers: SessionAnswerRecord[]
): ConsistencyLabel {
  const n = answers.length;
  if (n === 0) return "low";

  const uncertainRatio =
    answers.filter((a) => a.is_uncertain).length / n;
  const measured = ALL_DIMENSIONS.filter(
    (d) => getDimensionCertainty(profile, d) > 0
  ).length;

  if (n >= 18 && uncertainRatio < 0.15 && measured >= 8) return "high";
  if (n >= 12 && uncertainRatio < 0.28 && measured >= 5) return "medium";
  return "low";
}

function pickExtremeDimension(
  profile: UserProfile,
  mode: "lowest" | "highest",
  by: "score" | "certainty"
): PsychologicalDimension {
  const ranked = ALL_DIMENSIONS.map((d) => ({
    d,
    value:
      by === "score"
        ? getDimensionScore(profile, d)
        : getDimensionCertainty(profile, d),
  })).sort((a, b) => (mode === "lowest" ? a.value - b.value : b.value - a.value));

  const touched = ranked.filter((r) =>
    by === "certainty"
      ? r.value > 0 || profile.asked_question_ids.length > 0
      : true
  );

  return (touched[0] ?? ranked[0]).d;
}

export function buildPersonalizationLayerInput(input: {
  path: EnginePath;
  profile: UserProfile;
  answers: SessionAnswerRecord[];
  questions: Question[];
}): PersonalizationLayerInput {
  const { path, profile, answers, questions } = input;
  const lookup = buildQuestionLookup(path, questions);

  const dimension_scores = buildComputedDimensionScores(profile);

  const lowestKey = pickExtremeDimension(profile, "lowest", "certainty");
  const highestKey = pickExtremeDimension(profile, "highest", "score");

  const scoredAnswers = answers.map((record) => {
    const question = lookup.get(record.question_id);
    const dimension = question?.psychological_dimension;
    return {
      record,
      question,
      dimension,
      magnitude: dimensionDeltaMagnitude(record, dimension),
      signal: dimension
        ? classifySignal(record, dimension)
        : ("uncertain" as NotableSignal),
    };
  });

  const distinctive = [...scoredAnswers].sort(
    (a, b) => b.magnitude - a.magnitude
  )[0];

  const most_distinctive_answer = distinctive?.question
    ? `On "${distinctive.question.question_text}", you answered "${formatAnswer(distinctive.record.value.raw)}".`
    : "Your answers show a mix of warmth and uncertainty.";

  const notablePool = scoredAnswers
    .filter((item) => item.question)
    .sort((a, b) => b.magnitude - a.magnitude);

  const positives = notablePool.filter((i) => i.signal === "positive").slice(0, 3);
  const negatives = notablePool.filter(
    (i) => i.signal === "negative" || i.signal === "uncertain"
  ).slice(0, 3);

  const notable_answers: NotableAnswer[] = [...positives, ...negatives]
    .slice(0, 5)
    .map((item) => ({
      question: item.question!.question_text,
      answer: formatAnswer(item.record.value.raw),
      dimension: DIMENSION_LABELS[item.dimension!] ?? item.dimension!,
      signal: item.signal,
    }));

  if (!notable_answers.length && answers.length) {
    const fallback = answers[answers.length - 1];
    const q = lookup.get(fallback.question_id);
    notable_answers.push({
      question: q?.question_text ?? fallback.question_id,
      answer: formatAnswer(fallback.value.raw),
      dimension: q
        ? DIMENSION_LABELS[q.psychological_dimension]
        : "this connection",
      signal: fallback.is_uncertain ? "uncertain" : "positive",
    });
  }

  const sample_answers_for_tone = answers.slice(-3).map((record) => {
    const q = lookup.get(record.question_id);
    return {
      question: q?.question_text ?? record.question_id,
      answer: formatAnswer(record.value.raw),
    };
  });

  return {
    dimension_scores,
    lowest_dimension: DIMENSION_LABELS[lowestKey],
    highest_dimension: DIMENSION_LABELS[highestKey],
    most_distinctive_answer,
    notable_answers,
    sample_answers_for_tone,
    n_questions_answered: answers.length,
    answer_consistency: deriveConsistencyLabel(profile, answers),
  };
}

export function personalizationFallbackFromStructured(
  structured: import("@/types/adaptive-engine").StructuredReport
): import("@/types/report").AnalysisReport {
  const report = toAnalysisReport(structured);
  return {
    ...report,
    what_we_noticed: [
      structured.emotional_connection,
      `Current read: ${structured.relationship_type}`,
    ],
    gentle_next_steps: structured.suggested_next_steps.slice(0, 3),
  };
}
