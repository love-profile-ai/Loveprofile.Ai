import type {
  EnginePath,
  SessionAnswerRecord,
  StructuredReport,
  UserProfile,
} from "@/types/adaptive-engine";
import { getDimensionScore } from "./profile-utils";

function confidenceLabel(score: number): "Low" | "Medium" | "High" {
  if (score >= 70) return "High";
  if (score >= 40) return "Medium";
  return "Low";
}

function inferRelationshipType(
  path: EnginePath,
  profile: UserProfile
): string {
  const love = getDimensionScore(profile, "love");
  const crush = getDimensionScore(profile, "crush");
  const attachment = getDimensionScore(profile, "attachment");
  const trust = getDimensionScore(profile, "trust");

  if (path === "do_i_love_someone") {
    if (love >= 65 && attachment >= 55) return "Deep romantic attachment";
    if (love >= 50 && crush >= 45) return "Growing romantic feelings";
    if (crush >= 55 && love < 45) return "Strong crush or infatuation";
    if (attachment >= 50 && love < 40) return "Close bond — friendship or admiration";
    if (love < 30 && crush < 30) return "Limited romantic signal so far";
    return "Mixed feelings — still clarifying";
  }

  const theirLove = love;
  const theirAttach = attachment;
  if (theirLove >= 65 && trust >= 55) return "Strong signs of romantic interest";
  if (theirLove >= 45 && theirAttach >= 50) return "Warm connection with romantic potential";
  if (theirAttach >= 50 && theirLove < 40) return "Caring friendship — romance unclear";
  if (trust < 35) return "Inconsistent care signals";
  return "Ambiguous signals — more observation needed";
}

function buildStrengths(profile: UserProfile): string[] {
  const strengths: string[] = [];
  const checks: [string, number][] = [
    ["Emotional warmth in your answers", getDimensionScore(profile, "love")],
    ["Excitement and spark", getDimensionScore(profile, "crush")],
    ["A genuine friendship foundation", getDimensionScore(profile, "friendship")],
    ["Trust foundation", getDimensionScore(profile, "trust")],
    ["Emotional closeness", getDimensionScore(profile, "attachment")],
    ["Readiness for sustained commitment", getDimensionScore(profile, "commitment")],
    ["Open communication", getDimensionScore(profile, "communication")],
    ["Future-oriented thinking", getDimensionScore(profile, "future")],
    ["Balanced mutual effort", getDimensionScore(profile, "reciprocity")],
  ];

  for (const [label, score] of checks) {
    if (score >= 55) strengths.push(label);
  }

  return strengths.length
    ? strengths
    : ["You are reflecting honestly — that itself is a strength"];
}

function buildUncertaintyAreas(profile: UserProfile): string[] {
  const areas: string[] = [];
  const dims: [string, ReturnType<typeof getDimensionScore>][] = [
    ["How strong romantic love feels", getDimensionScore(profile, "love")],
    ["Trust and emotional safety", getDimensionScore(profile, "trust")],
    ["Friendship beyond romantic chemistry", getDimensionScore(profile, "friendship")],
    ["Commitment beyond immediate feelings", getDimensionScore(profile, "commitment")],
    ["Whether effort is genuinely reciprocal", getDimensionScore(profile, "reciprocity")],
    ["Long-term compatibility", getDimensionScore(profile, "future")],
    ["Physical vs emotional attraction balance", Math.abs(
      getDimensionScore(profile, "physical_attraction") -
        getDimensionScore(profile, "emotional_attraction")
    )],
    ["Communication clarity", getDimensionScore(profile, "communication")],
  ];

  for (const [label, score] of dims) {
    if (typeof score === "number" && score < 45) areas.push(label);
  }

  const certaintyGaps = Object.entries(profile.dimension_certainty)
    .filter(([, c]) => (c ?? 0) < 0.5)
    .map(([d]) => `${d.replace(/_/g, " ")} still needs more clarity`);

  return [...areas, ...certaintyGaps].slice(0, 5);
}

function buildNextSteps(
  path: EnginePath,
  profile: UserProfile,
  uncertainties: string[]
): string[] {
  const steps: string[] = [];

  if (getDimensionScore(profile, "communication") < 50) {
    steps.push("Notice how honest and easy conversation feels over the next week");
  }
  if (getDimensionScore(profile, "trust") < 50) {
    steps.push("Pay attention to consistency — words matching actions over time");
  }
  if (uncertainties.length) {
    steps.push(`Sit with the uncertainty around ${uncertainties[0].toLowerCase()} without forcing a label`);
  }
  if (path === "do_i_love_someone") {
    steps.push("Journal how you feel after time together versus time apart");
  } else {
    steps.push("Observe whether their effort toward you is steady, not just occasional");
  }
  steps.push("Talk to someone you trust if feelings become overwhelming");

  return steps.slice(0, 4);
}

export function generateStructuredReport(
  path: EnginePath,
  profile: UserProfile,
  _answers: SessionAnswerRecord[]
): StructuredReport {
  const relationship_type = inferRelationshipType(path, profile);
  const love = getDimensionScore(profile, "love");
  const emotional = getDimensionScore(profile, "emotional_attraction");
  const attachment = getDimensionScore(profile, "attachment");

  const emotional_connection =
    emotional >= 55 || attachment >= 55
      ? "Your answers suggest a meaningful emotional bond — warmth, care, or attachment is present."
      : love >= 45
        ? "There are romantic signals, but emotional depth still seems to be forming or mixed."
        : "Emotional connection reads as light or early-stage based on what you shared.";

  const strengths = buildStrengths(profile);
  const uncertainty_areas = buildUncertaintyAreas(profile);
  const suggested_next_steps = buildNextSteps(path, profile, uncertainty_areas);

  const confidence_percent = Math.round(profile.confidence_score);
  const confidence_label = confidenceLabel(confidence_percent);

  const dimension_scores: Record<string, number> = {
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

  const summary = `${relationship_type}. ${emotional_connection} Confidence in this read: ${confidence_percent}% (${confidence_label}). This reflects your answers only — not a definitive verdict.`;

  return {
    relationship_type,
    emotional_connection,
    strengths,
    uncertainty_areas,
    confidence_percent,
    confidence_label,
    suggested_next_steps,
    dimension_scores,
    summary,
  };
}

/** Convert structured report to existing AnalysisReport shape for the dashboard UI. */
export function toAnalysisReport(
  structured: StructuredReport
): import("@/types/report").AnalysisReport {
  const ai_summary = [
    structured.emotional_connection,
    structured.strengths.length
      ? `What stands out: ${structured.strengths.slice(0, 3).join(". ")}.`
      : null,
    structured.uncertainty_areas.length
      ? `Still unfolding: ${structured.uncertainty_areas.slice(0, 2).join("; ")}.`
      : null,
  ]
    .filter(Boolean)
    .join(" ");

  return {
    summary: structured.summary,
    ai_summary: ai_summary || structured.summary,
    confidence: structured.confidence_label,
    what_we_noticed: [
      structured.emotional_connection,
      `Relationship type: ${structured.relationship_type}`,
      ...structured.uncertainty_areas.slice(0, 2).map((u) => `Still unclear: ${u}`),
    ],
    gentle_next_steps: structured.suggested_next_steps,
    looking_ahead:
      structured.confidence_percent >= 70
        ? "You have enough clarity to reflect with intention — let patterns confirm over time."
        : "More real-world observation will sharpen this picture. Stay patient with ambiguity.",
  };
}
