import type {
  Question,
  SessionAnswerRecord,
  UserProfile,
} from "@/types/adaptive-engine";
import { ALL_DIMENSIONS } from "@/types/adaptive-engine";
import { getDimensionScore } from "./profile-utils";
import {
  getProfileDimensionConfidenceScores,
  toProfileDimension,
  type ProfileDimension,
} from "./profile-dimensions";

export interface QaTranscriptEntry {
  question_id: string;
  question: string;
  answer: string | number | boolean | string[];
  dimension: string;
  profile_dimension: ProfileDimension;
  category: string;
  is_uncertain: boolean;
}

function formatAnswerValue(
  raw: SessionAnswerRecord["value"]["raw"]
): string | number | boolean | string[] {
  if (Array.isArray(raw)) return raw;
  return raw;
}

/** Full Q&A transcript for reflective report generation. */
export function buildFullQaTranscript(
  answers: SessionAnswerRecord[],
  questions: Question[]
): QaTranscriptEntry[] {
  const byId = new Map(questions.map((q) => [q.id, q]));

  return answers.map((record) => {
    const question = byId.get(record.question_id);
    const dimension = question?.psychological_dimension ?? "unknown";

    return {
      question_id: record.question_id,
      question: question?.question_text ?? record.question_id,
      answer: formatAnswerValue(record.value.raw),
      dimension,
      profile_dimension: question
        ? toProfileDimension(question.psychological_dimension)
        : "trust_emotional_safety",
      category: question?.category ?? "general",
      is_uncertain: record.is_uncertain,
    };
  });
}

/** Deterministic dimension scores (0–100) plus profile-level aggregates. */
export function buildComputedDimensionScores(
  profile: UserProfile
): Record<string, number> {
  const psychological = Object.fromEntries(
    ALL_DIMENSIONS.map((d) => [d, Math.round(getDimensionScore(profile, d))])
  ) as Record<string, number>;

  const profileConfidence = getProfileDimensionConfidenceScores(profile);

  const profileScores = Object.fromEntries(
    (Object.entries(profileConfidence) as [ProfileDimension, number][]).map(
      ([key, certainty]) => {
        const dims =
          key === "trust_emotional_safety"
            ? (["trust", "attachment", "jealousy"] as const)
            : key === "communication_clarity"
              ? (["communication"] as const)
              : key === "attraction_balance"
                ? (["love", "crush", "physical_attraction", "emotional_attraction"] as const)
                : (["future", "commitment", "reciprocity", "friendship"] as const);

        const avg =
          dims.reduce((sum, d) => sum + getDimensionScore(profile, d), 0) /
          dims.length;

        return [`profile_${key}`, Math.round(avg)];
      }
    )
  );

  return {
    ...psychological,
    ...profileScores,
    ...Object.fromEntries(
      Object.entries(profileConfidence).map(([key, value]) => [
        `confidence_${key}`,
        value,
      ])
    ),
    session_confidence_score: Math.round(profile.confidence_score),
  };
}
