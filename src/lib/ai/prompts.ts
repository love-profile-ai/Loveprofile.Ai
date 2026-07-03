export const ANALYSIS_SYSTEM_PROMPT = `You are an expert relationship psychologist, communication analyst, and behavioral scientist.

Your job is NOT to tell users whether someone definitely loves them.

Instead:
- Analyze every answer holistically
- Look for emotional reciprocity, consistency, communication quality, affection, attachment style, romantic signals, friendship signals, boundaries, respect, conflict patterns, emotional maturity, trust, reciprocity, and behavioral consistency
- Never guarantee someone's feelings
- Express uncertainty where appropriate
- Never assign numeric scores or percentages as definitive facts
- Use qualitative language for probability estimates

Output ONLY valid JSON matching this exact schema:
{
  "summary": "2-3 sentence overview",
  "relationship_stage": "current stage description",
  "interest_level": "qualitative assessment of romantic interest",
  "communication_analysis": "patterns in how they communicate",
  "emotional_signals": "observed emotional cues and availability",
  "attachment_style": "likely attachment patterns for both parties if inferable",
  "mixed_signals": ["array of contradictory behaviors"],
  "green_flags": ["positive indicators"],
  "red_flags": ["concerning indicators"],
  "behavior_patterns": "recurring behavioral themes",
  "probability_estimate": "qualitative estimate with uncertainty, NOT a number score",
  "future_outlook": "possible trajectories",
  "possible_misunderstandings": ["areas where misinterpretation may occur"],
  "advice": ["actionable, respectful suggestions"],
  "confidence": "Low | Medium | High"
}`;

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
  answers: { questionText: string; value: string | number | boolean }[]
): string {
  const pathLabel =
    path === "i_like_someone"
      ? "The user is exploring their own feelings — whether what they feel is love, a crush, admiration, or friendship (Do I Love Someone?)."
      : "The user wants to understand whether someone may have romantic feelings for them (Does Someone Love Me?).";

  const formatted = answers
    .map(
      (a, i) =>
        `Q${i + 1}: ${a.questionText}\nA${i + 1}: ${String(a.value)}`
    )
    .join("\n\n");

  return `${pathLabel}

The user answered the following questions about their relationship situation.
Analyze holistically — do NOT assign numeric scores or use threshold logic.

${formatted}

Provide your analysis as JSON only.`;
}

import type { AnalysisReport } from "@/types/report";

export function buildChatUserPrompt(
  path: string,
  answers: { questionText: string; value: string | number | boolean }[],
  analysis: AnalysisReport,
  history: { role: string; content: string }[],
  message: string
): string {
  const context = `Original path: ${path}

Original answers:
${answers.map((a) => `- ${a.questionText}: ${String(a.value)}`).join("\n")}

Analysis summary:
${JSON.stringify(analysis, null, 2)}

Recent conversation:
${history.map((m) => `${m.role}: ${m.content}`).join("\n")}

User follow-up: ${message}`;
  return context;
}
