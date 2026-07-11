import type {
  AnswerValue,
  AssessmentSummary,
  EnginePath,
  Question,
  ScoreDelta,
  UserProfile,
} from "@/types/adaptive-engine";
import { getDimensionScore } from "./profile-utils";
import { generateStructuredReport } from "./generateReport";

const MAX_INSIGHTS = 10;
const MAX_OBSERVATIONS = 6;
const MAX_CAUTIONS = 4;
const MAX_THEMES = 5;

function confidenceLabel(score: number): AssessmentSummary["confidence_label"] {
  if (score >= 70) return "High";
  if (score >= 40) return "Medium";
  return "Low";
}

function formatAnswerValue(value: AnswerValue): string {
  const raw = value.raw;
  if (Array.isArray(raw)) return raw.join(", ");
  return String(raw);
}

function dimensionScoresFromProfile(profile: UserProfile): Record<string, number> {
  return {
    love: getDimensionScore(profile, "love"),
    crush: getDimensionScore(profile, "crush"),
    friendship: getDimensionScore(profile, "friendship"),
    trust: getDimensionScore(profile, "trust"),
    attachment: getDimensionScore(profile, "attachment"),
    commitment: getDimensionScore(profile, "commitment"),
    future: getDimensionScore(profile, "future"),
    communication: getDimensionScore(profile, "communication"),
    jealousy: getDimensionScore(profile, "jealousy"),
    physical_attraction: getDimensionScore(profile, "physical_attraction"),
    emotional_attraction: getDimensionScore(profile, "emotional_attraction"),
    reciprocity: getDimensionScore(profile, "reciprocity"),
  };
}

function deriveInsight(
  question: Question,
  value: AnswerValue,
  deltas: ScoreDelta,
  uncertain: boolean
): string | null {
  const dim = question.psychological_dimension.replace(/_/g, " ");
  const answer = formatAnswerValue(value);

  if (question.category === "foundation" && question.id.includes("role")) {
    return `Relationship context: ${answer}`;
  }

  const strongDelta = Object.entries(deltas)
    .filter(([k, v]) => k !== "confidence" && typeof v === "number" && Math.abs(v) >= 8)
    .map(([k, v]) => `${k.replace(/_/g, " ")} ${v > 0 ? "+" : ""}${v}`);

  if (uncertain) {
    return `${dim}: answered "${answer}" with uncertainty — needs clarification`;
  }

  if (strongDelta.length) {
    return `${dim}: "${answer}" (${strongDelta.slice(0, 2).join(", ")})`;
  }

  if (question.type === "slider" && typeof value.raw === "number") {
    return `${dim}: rated ${value.raw}/10`;
  }

  return `${dim}: ${answer}`;
}

function deriveObservation(
  question: Question,
  value: AnswerValue,
  uncertain: boolean
): string | null {
  if (uncertain) return `Uncertain response on ${question.psychological_dimension.replace(/_/g, " ")}`;
  if (question.is_clarification) {
    return `Clarified: ${formatAnswerValue(value)}`;
  }
  return null;
}

function deriveCaution(
  question: Question,
  value: AnswerValue,
  deltas: ScoreDelta,
  uncertain: boolean
): string | null {
  if (uncertain) {
    return `${question.psychological_dimension.replace(/_/g, " ")} remains unclear`;
  }
  const negative = Object.entries(deltas).find(
    ([k, v]) => k !== "confidence" && typeof v === "number" && v <= -8
  );
  if (negative) {
    return `Low signal on ${negative[0].replace(/_/g, " ")} after "${formatAnswerValue(value)}"`;
  }
  return null;
}

function inferTheme(question: Question, deltas: ScoreDelta): string | null {
  const love = deltas.love ?? 0;
  const crush = deltas.crush ?? 0;
  const trust = deltas.trust ?? 0;
  if (love >= 10 || crush >= 10) return "Romantic interest signals";
  if (trust >= 10) return "Trust and emotional safety";
  if (deltas.attachment && deltas.attachment >= 10) return "Attachment and closeness";
  if (deltas.friendship && deltas.friendship >= 10) return "Friendship foundation";
  if (deltas.commitment && deltas.commitment >= 10) return "Commitment readiness";
  if (deltas.reciprocity && deltas.reciprocity >= 10) return "Reciprocity and balanced effort";
  if (question.psychological_dimension === "communication") return "Communication patterns";
  if (question.psychological_dimension === "future") return "Future orientation";
  return null;
}

function trimUnique(items: string[], max: number): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of items) {
    const key = item.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(item);
    if (out.length >= max) break;
  }
  return out;
}

export function createEmptySummary(path: EnginePath): AssessmentSummary {
  return {
    path,
    relationship_context: "",
    psychological_insights: [],
    dimension_scores: {},
    confidence_percent: 0,
    confidence_label: "Low",
    key_observations: [],
    caution_areas: [],
    dominant_themes: [],
    questions_answered: 0,
  };
}

export function updateAssessmentSummary(
  current: AssessmentSummary,
  question: Question,
  value: AnswerValue,
  profile: UserProfile,
  scoreDeltas: ScoreDelta,
  uncertain: boolean
): AssessmentSummary {
  const insight = deriveInsight(question, value, scoreDeltas, uncertain);
  const observation = deriveObservation(question, value, uncertain);
  const caution = deriveCaution(question, value, scoreDeltas, uncertain);
  const theme = inferTheme(question, scoreDeltas);

  let relationship_context = current.relationship_context;
  if (question.category === "foundation" && !relationship_context && insight) {
    relationship_context = insight;
  }

  const confidence_percent = Math.round(profile.confidence_score);

  return {
    path: current.path,
    relationship_context,
    psychological_insights: trimUnique(
      insight ? [...current.psychological_insights, insight] : current.psychological_insights,
      MAX_INSIGHTS
    ),
    dimension_scores: dimensionScoresFromProfile(profile),
    confidence_percent,
    confidence_label: confidenceLabel(confidence_percent),
    key_observations: trimUnique(
      observation
        ? [...current.key_observations, observation]
        : current.key_observations,
      MAX_OBSERVATIONS
    ),
    caution_areas: trimUnique(
      caution ? [...current.caution_areas, caution] : current.caution_areas,
      MAX_CAUTIONS
    ),
    dominant_themes: trimUnique(
      theme ? [...current.dominant_themes, theme] : current.dominant_themes,
      MAX_THEMES
    ),
    questions_answered: profile.asked_question_ids.length,
  };
}

/** Final compact payload sent to AI — scores + insights only, no raw Q&A. */
export function finalizeAssessmentSummary(
  summary: AssessmentSummary,
  profile: UserProfile
): AssessmentSummary {
  const structured = generateStructuredReport(summary.path, profile, []);

  const caution_areas = trimUnique(
    [
      ...summary.caution_areas,
      ...structured.uncertainty_areas.slice(0, 2),
    ],
    MAX_CAUTIONS
  );

  const psychological_insights = trimUnique(
    [
      ...summary.psychological_insights,
      `Overall read: ${structured.relationship_type}`,
      structured.emotional_connection,
    ],
    MAX_INSIGHTS
  );

  const confidence_percent = Math.round(profile.confidence_score);

  return {
    path: summary.path,
    relationship_context:
      summary.relationship_context ||
      (summary.path === "do_i_love_someone"
        ? "Exploring your own feelings toward someone"
        : "Decoding whether someone may have romantic feelings for you"),
    psychological_insights,
    dimension_scores: dimensionScoresFromProfile(profile),
    confidence_percent,
    confidence_label: confidenceLabel(confidence_percent),
    key_observations: trimUnique(
      summary.key_observations.length
        ? summary.key_observations
        : structured.strengths.slice(0, 3),
      MAX_OBSERVATIONS
    ),
    caution_areas,
    dominant_themes: trimUnique(
      summary.dominant_themes.length
        ? summary.dominant_themes
        : [structured.relationship_type],
      MAX_THEMES
    ),
    questions_answered: profile.asked_question_ids.length,
  };
}

export function summaryFromRow(row: Record<string, unknown>, path: EnginePath): AssessmentSummary {
  const raw = row.assessment_summary;
  if (raw && typeof raw === "object" && Object.keys(raw as object).length > 0) {
    return raw as AssessmentSummary;
  }
  return createEmptySummary(path);
}
