import type { AnalysisReport } from "@/types/report";
import type { AssessmentSummary } from "@/types/adaptive-engine";
import type { PersonalizationLayerInput } from "@/lib/engine/report-personalization-inputs";

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
  "ai_summary": "3-5 sentences — a warm, cohesive narrative woven from the user's strongest answer patterns. Reference specific things they said (paraphrased). No bullet lists, no green/red framing.",
  "confidence": "Low | Medium | High",
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
- Return ONLY valid JSON with these keys: summary, ai_summary, confidence (Low|Medium|High), what_we_noticed, gentle_next_steps, looking_ahead
- No markdown, no extra keys`;

export const CHAT_SYSTEM_PROMPT = `You are a compassionate relationship coach continuing a prior analysis session.

Rules:
- Reference the original answers and analysis provided
- Never claim certainty about another person's feelings
- Give practical, respectful advice
- Acknowledge uncertainty when appropriate
- Do not assign numeric scores
- Keep responses concise (2-4 paragraphs max)`;

export const QUESTION_SELECTION_SYSTEM_PROMPT = `You are the question-selection engine for Nila, a relationship reflection tool.

Your job: choose the SINGLE best next question to ask, given the user's
answers so far. You are not talking to the user directly — you are picking
from a candidate pool and may lightly rephrase the chosen question for
natural flow.

CONTEXT
Dimensions being profiled: trust_emotional_safety, communication_clarity,
attraction_balance, long_term_compatibility.

Current dimension confidence scores (0-100, higher = more data collected,
not more positive):
{{dimension_scores_json}}

Answers so far (question id, text, answer, inferred signal):
{{answer_history_json}}

Candidate question pool (not yet asked):
{{remaining_questions_json}}

SELECTION RULES
1. Prioritize the dimension with the LOWEST confidence score — that's the
   one you know the least about.
2. If the last answer indicated strong uncertainty or a low score on a
   dimension, prefer a follow-up question tagged to that same dimension
   (deeper probe) over switching topics.
3. Never repeat a question already asked.
4. Do not choose two questions from the same narrow sub-topic back to back
   unless the previous answer was ambiguous.
5. If all dimensions have reached sufficient confidence (threshold: {{n}}
   questions each), return "COMPLETE" instead of a question.

OUTPUT — return ONLY this JSON, no other text:
{
  "next_question_id": "q_014",
  "reasoning": "one short internal sentence, not shown to user",
  "rephrased_text": "optional natural-language rephrasing of the question,
    or null to use the original text as-is"
}

When complete, use:
{
  "next_question_id": "COMPLETE",
  "reasoning": "all profile dimensions have sufficient coverage",
  "rephrased_text": null
}`;

export interface QuestionSelectionAnswerRecord {
  question_id: string;
  question_text: string;
  answer: string | number | boolean | string[];
  inferred_signal: string;
  profile_dimension: string;
  category: string;
}

export interface QuestionSelectionCandidate {
  id: string;
  text: string;
  profile_dimension: string;
  psychological_dimension: string;
  category: string;
  priority: number;
}

export function buildQuestionSelectionUserPrompt(input: {
  dimensionScores: Record<string, number>;
  answerHistory: QuestionSelectionAnswerRecord[];
  candidates: QuestionSelectionCandidate[];
  minQuestionsPerDimension: number;
}): string {
  return QUESTION_SELECTION_SYSTEM_PROMPT.replace(
    "{{dimension_scores_json}}",
    JSON.stringify(input.dimensionScores, null, 2)
  )
    .replace(
      "{{answer_history_json}}",
      JSON.stringify(input.answerHistory, null, 2)
    )
    .replace(
      "{{remaining_questions_json}}",
      JSON.stringify(input.candidates, null, 2)
    )
    .replace("{{n}}", String(input.minQuestionsPerDimension));
}

export const REFLECTIVE_REPORT_PROMPT = `You are generating a reflective relationship report for Nila. The user has
answered a series of questions about a specific relationship. Your report
must be grounded ONLY in what they actually said — never generic template
language.

FULL TRANSCRIPT (question, answer, dimension tag):
{{full_qa_transcript_json}}

COMPUTED DIMENSION SCORES (0-100 each, from deterministic scoring, not
your judgment):
{{computed_scores_json}}

INSTRUCTIONS
1. confidence must be derived from: (a) how many questions were answered,
   (b) how consistent the answers were within each dimension, and (c) how
   many answers were "unsure/mixed" type responses. Compute a number
   0-100, don't default to a round number.
2. ai_summary must weave SPECIFIC answer patterns from the transcript
   into a cohesive 3-5 sentence narrative (paraphrased, not quoted).
   Balance warmth with honesty — no green/red flag lists.
3. gentle_next_steps must be different depending on which dimension scored
   lowest — pull the two lowest-confidence dimensions and write a next
   step specific to closing that gap, not a fixed four-item list.
4. Do not use the same "looking_ahead" sentence across different reports.
   Vary phrasing based on how much data was collected.

OUTPUT JSON SCHEMA
{
  "summary": "...",
  "ai_summary": "...",
  "confidence": <integer 0-100>,
  "confidence_label": "Low" | "Medium" | "High",
  "what_we_noticed": ["...", "..."],
  "gentle_next_steps": ["...", "..."],
  "looking_ahead": "..."
}`;

export function buildReflectiveReportUserPrompt(input: {
  transcript: unknown[];
  computedScores: Record<string, number>;
  pathLabel: string;
}): string {
  return `${REFLECTIVE_REPORT_PROMPT.replace(
    "{{full_qa_transcript_json}}",
    JSON.stringify(input.transcript, null, 2)
  ).replace(
    "{{computed_scores_json}}",
    JSON.stringify(input.computedScores, null, 2)
  )}

Relationship path: ${input.pathLabel}

Return ONLY valid JSON matching the schema. No markdown.`;
}

export const PERSONALIZATION_LAYER_PROMPT = `You are the personalization layer for Nila's relationship report. You are
NOT interpreting raw data — everything below is already computed. Your
only job is short, precise, natural-language translation. Do not add
sections, do not explain your reasoning, do not exceed the requested
lengths.

INPUT
matched_template_title: {{template_title}}
matched_template_tone: {{template_tone}}
summary_seed: {{summary_seed}}
looking_ahead_seed: {{looking_ahead_seed}}
dimension_scores: {{dimension_scores_json}}
lowest_dimension: {{lowest_dimension}}
highest_dimension: {{highest_dimension}}
most_distinctive_answer: {{most_distinctive_answer_text}}
notable_answers: {{notable_answers_json}}
sample_answers_for_tone: {{2_3_sample_answers_json}}
n_questions_answered: {{n}}
answer_consistency: {{consistency_label}}

TASKS
1. archetype: If matched_template_title is not "none", use it exactly or
   a 2-4 word phrase clearly in its same spirit. If it is "none", invent
   a 2-4 word phrase naming this relationship's current stage. Must feel
   specific to the scores given, not generic. Avoid clinical words like
   "Analysis" or "Assessment".

2. opener_line: ONE sentence, under 20 words, reflecting back
   most_distinctive_answer naturally and warmly. Do not quote it verbatim
   — paraphrase in your own words. No therapy-speak.

3. tone_class: ONE word only, from: terse, reflective, anxious, calm,
   guarded, open. Base this strictly on sample_answers_for_tone. If
   matched_template_tone is not "none", let it inform tone_class without
   overriding what sample_answers_for_tone actually shows.

4. ai_summary: 3-5 sentences weaving the user's notable_answers into one
   warm, cohesive reflection. If summary_seed is not "none", expand and
   personalize it using the user's specific notable_answers — build on
   its meaning, do not contradict or discard it. Paraphrase their
   answers — do not quote verbatim. No bullet lists, no green/red
   framing. Ground every sentence in something they actually said.

5. next_step: ONE specific journaling question (not generic advice) the
   user could sit with this week, targeted at lowest_dimension and
   grounded in why that dimension is unresolved. Under 25 words.

6. looking_ahead: ONE sentence. If looking_ahead_seed is not "none",
   write in its same spirit and message rather than a different one.
   Tone shifts with n_questions_answered and answer_consistency — more
   certain and grounded at high confidence, more patient and open-ended
   at low confidence. Never reuse "Stay patient with ambiguity" verbatim.

OUTPUT — JSON only, no other text:
{
  "archetype": "...",
  "opener_line": "...",
  "tone_class": "...",
  "ai_summary": "...",
  "next_step": "...",
  "looking_ahead": "..."
}`;

/** Result-template guidance passed to the AI so it builds on — rather than invents — the archetype. */
export interface PersonalizationTemplateGuidance {
  templateId: string;
  title: string;
  moodTag?: string;
  tone: string;
  summarySeed: string;
  lookingAheadSeed: string;
}

export function buildPersonalizationLayerPrompt(
  input: PersonalizationLayerInput,
  templateGuidance?: PersonalizationTemplateGuidance
): string {
  return PERSONALIZATION_LAYER_PROMPT.replace(
    "{{template_title}}",
    templateGuidance?.title ?? "none"
  )
    .replace("{{template_tone}}", templateGuidance?.tone ?? "none")
    .replace("{{summary_seed}}", templateGuidance?.summarySeed ?? "none")
    .replace(
      "{{looking_ahead_seed}}",
      templateGuidance?.lookingAheadSeed ?? "none"
    )
    .replace(
      "{{dimension_scores_json}}",
      JSON.stringify(input.dimension_scores, null, 2)
    )
    .replace("{{lowest_dimension}}", input.lowest_dimension)
    .replace("{{highest_dimension}}", input.highest_dimension)
    .replace(
      "{{most_distinctive_answer_text}}",
      input.most_distinctive_answer
    )
    .replace(
      "{{notable_answers_json}}",
      JSON.stringify(input.notable_answers, null, 2)
    )
    .replace(
      "{{2_3_sample_answers_json}}",
      JSON.stringify(input.sample_answers_for_tone, null, 2)
    )
    .replace("{{n}}", String(input.n_questions_answered))
    .replace("{{consistency_label}}", input.answer_consistency);
}

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
