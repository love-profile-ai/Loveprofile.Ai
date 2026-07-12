import type { EnginePath, AssessmentSummary, UserProfile } from "@/types/adaptive-engine";
import { createEmptySummary, summaryFromRow } from "./assessment-summary";

export function profileFromRow(row: Record<string, unknown>): UserProfile {
  return {
    love_score: Number(row.love_score ?? 0),
    crush_score: Number(row.crush_score ?? 0),
    friendship_score: Number(row.friendship_score ?? 0),
    trust_score: Number(row.trust_score ?? 0),
    attachment_score: Number(row.attachment_score ?? 0),
    commitment_score: Number(row.commitment_score ?? 0),
    future_score: Number(row.future_score ?? 0),
    communication_score: Number(row.communication_score ?? 0),
    jealousy_score: Number(row.jealousy_score ?? 0),
    physical_attraction_score: Number(row.physical_attraction_score ?? 0),
    emotional_attraction_score: Number(row.emotional_attraction_score ?? 0),
    reciprocity_score: Number(row.reciprocity_score ?? 0),
    confidence_score: Number(row.confidence_score ?? 0),
    dimension_certainty:
      (row.dimension_certainty as UserProfile["dimension_certainty"]) ?? {},
    asked_question_ids: (row.asked_question_ids as string[]) ?? [],
  };
}

export function profileToRow(
  profile: UserProfile,
  assessment_summary?: AssessmentSummary
) {
  return {
    love_score: profile.love_score,
    crush_score: profile.crush_score,
    friendship_score: profile.friendship_score,
    trust_score: profile.trust_score,
    attachment_score: profile.attachment_score,
    commitment_score: profile.commitment_score,
    future_score: profile.future_score,
    communication_score: profile.communication_score,
    jealousy_score: profile.jealousy_score,
    physical_attraction_score: profile.physical_attraction_score,
    emotional_attraction_score: profile.emotional_attraction_score,
    reciprocity_score: profile.reciprocity_score,
    confidence_score: profile.confidence_score,
    dimension_certainty: profile.dimension_certainty,
    asked_question_ids: profile.asked_question_ids,
    ...(assessment_summary ? { assessment_summary } : {}),
  };
}

export function summaryFromProfileRow(
  row: Record<string, unknown>,
  path: EnginePath
): AssessmentSummary {
  return summaryFromRow(row, path);
}
