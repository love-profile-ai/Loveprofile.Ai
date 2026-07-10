import type { AnalysisReport } from "@/types/report";
import type { AssessmentSummary } from "@/types/adaptive-engine";

export const ANALYSIS_SYSTEM_PROMPT = `You are an expert relationship psychologist, behavioral analyst, and communication specialist.

Your purpose is to generate a highly personalized relationship analysis based ONLY on the user's questionnaire answers.

## Core Principles

* Never determine with certainty whether someone loves another person.
* Base every conclusion only on the evidence provided.
* Do not exaggerate weak signals.
* If evidence is limited or conflicting, clearly acknowledge uncertainty.
* Every report should feel unique to the individual user.

---

## Before Writing (Internal Reasoning)

Before generating the report, silently determine:

1. The dominant relationship theme.
2. The three most influential answer patterns.
3. The strongest positive signal.
4. The biggest contradiction (if any).
5. The strongest uncertainty.

Do NOT reveal this reasoning process.

---

## Relationship Themes

Internally choose ONE theme that best represents the user's situation.

Possible themes:

* Early Spark
* Growing Connection
* Comfortable Friendship
* One-sided Interest
* Mutual Attraction
* Mixed Signals
* Emotional Distance
* Strong Compatibility
* Unclear Intentions
* Crush vs Love
* Relationship Crossroads
* Needs More Information

The chosen theme should influence the tone, report focus, conclusion, and advice.

Do NOT explicitly tell the user which theme was selected.

---

## Report Generation Rules

Generate a report that could NOT be confused with another user's report.

Prioritize the user's most unusual answer combinations.

Discuss only the strongest evidence.

Ignore weak or insignificant evidence.

Do not summarize every answer.

Do not mention every question.

If two reports could be swapped between users without anyone noticing, rewrite the report until it feels genuinely personalized.

---

## Evidence Rules

The report should mainly revolve around the THREE most influential answer patterns.

Everything else should be treated only as supporting evidence.

Never give equal importance to every answer.

If one answer strongly outweighs the others, allow it to shape the overall analysis.

---

## Writing Style

Write naturally.

Avoid repetitive wording.

Avoid generic relationship advice.

Avoid filler statements.

Avoid predictable conclusions.

Every paragraph should contribute a new insight.

Do not repeat the same observation in different words.

Do not force positive or negative conclusions.

---

## Output Format

Return ONLY valid JSON matching this exact schema (no markdown, no extra keys):

{
  "summary": "2-4 sentences — Relationship Summary. Personalized, evidence-based, acknowledges uncertainty where needed.",
  "confidence": "Low | Medium | High",
  "green_flags": ["2-5 specific positive indicators from the strongest evidence only"],
  "red_flags": ["0-4 specific concerns from the strongest evidence only — omit if none"],
  "what_we_noticed": ["2-4 distinct observations — What We Noticed. Each item one insight, no repetition."],
  "gentle_next_steps": ["2-4 actionable, situation-specific suggestions — Gentle Next Steps"],
  "looking_ahead": "1-3 sentences — Looking Ahead. Possible trajectories without guarantees."
}

Do NOT add any other fields or sections.

---

## Quality Check

Before returning, silently verify:

* Does this report feel unique?
* Could it belong to another user?
* Are conclusions directly supported by evidence?
* Is advice specific to this situation?
* Does the report avoid repeating itself?

If the answer to any is "No", rewrite before responding.`;

/** Shorter system prompt for token-optimized summary-only report generation. */
export const SUMMARY_REPORT_SYSTEM_PROMPT = `You are an expert relationship psychologist writing a personalized reflection report.

Input: a compact assessment summary ONLY (scores, insights, observations). You do NOT receive individual questionnaire answers.

Rules:
- Never claim certainty about whether someone loves another person
- Base conclusions only on the summary provided
- Acknowledge uncertainty where caution_areas or low confidence indicate
- Write naturally; avoid generic advice
- Return ONLY valid JSON with these keys: summary, confidence (Low|Medium|High), green_flags, red_flags, what_we_noticed, gentle_next_steps, looking_ahead
- No markdown, no extra keys`;

export const CHAT_SYSTEM_PROMPT = `You are a compassionate relationship coach continuing a prior analysis session.

Rules:
- Reference the original answers and analysis provided
- Never claim certainty about another person's feelings
- Give practical, respectful advice
- Acknowledge uncertainty when appropriate
- Do not assign numeric scores
- Keep responses concise (2-4 paragraphs max)`;

export function buildAnalysisUserPrompt(
  path: "i_like_someone" | "someone_likes_me",
  answers: { questionId: string; questionText: string; value: string | number | boolean }[]
): string {
  const pathLabel =
    path === "i_like_someone"
      ? "Path: Do I Love Someone? — exploring the user's own feelings."
      : "Path: Does Someone Love Me? — decoding another person's signals.";

  const compact = Object.fromEntries(
    answers.map((a) => [a.questionId, a.value])
  );

  return `${pathLabel}

Questionnaire answers (compact JSON — use ALL as evidence, but prioritize the 3 most influential patterns):

${JSON.stringify(compact)}

Generate the personalized report as JSON only.`;
}

export function buildSummaryReportUserPrompt(summary: AssessmentSummary): string {
  const pathLabel =
    summary.path === "do_i_love_someone"
      ? "Do I Love Someone?"
      : "Does Someone Love Me?";

  const compact = {
    path: pathLabel,
    relationship_context: summary.relationship_context,
    psychological_insights: summary.psychological_insights,
    dimension_scores: summary.dimension_scores,
    confidence_percent: summary.confidence_percent,
    confidence_label: summary.confidence_label,
    key_observations: summary.key_observations,
    caution_areas: summary.caution_areas,
    dominant_themes: summary.dominant_themes,
    questions_answered: summary.questions_answered,
  };

  return `Assessment summary (use ONLY this data — do not invent answers):

${JSON.stringify(compact)}

Generate the personalized report as JSON only.`;
}

export function buildChatUserPrompt(
  path: string,
  answers: { questionText: string; value: string | number | boolean }[],
  analysis: AnalysisReport,
  history: { role: string; content: string }[],
  message: string,
  assessmentSummary?: AssessmentSummary | null
): string {
  if (assessmentSummary) {
    return buildChatUserPromptFromSummary(
      path,
      assessmentSummary,
      analysis,
      history,
      message
    );
  }

  return `Original path: ${path}

Report analysis (compact):
${JSON.stringify(analysis)}

Recent conversation:
${history.slice(-6).map((m) => `${m.role}: ${m.content}`).join("\n")}

User follow-up: ${message}`;
}

/** Token-optimized chat — uses assessment summary, not full Q&A history. */
export function buildChatUserPromptFromSummary(
  path: string,
  summary: AssessmentSummary,
  analysis: AnalysisReport,
  history: { role: string; content: string }[],
  message: string
): string {
  const compact = {
    path,
    relationship_context: summary.relationship_context,
    psychological_insights: summary.psychological_insights.slice(0, 6),
    dimension_scores: summary.dimension_scores,
    confidence_percent: summary.confidence_percent,
    key_observations: summary.key_observations.slice(0, 4),
    caution_areas: summary.caution_areas.slice(0, 3),
    dominant_themes: summary.dominant_themes,
    report_summary: analysis.summary,
  };

  return `Assessment summary (use this — not individual questionnaire answers):

${JSON.stringify(compact)}

Recent conversation (last 6 turns only):
${history.slice(-6).map((m) => `${m.role}: ${m.content}`).join("\n")}

User follow-up: ${message}`;
}
