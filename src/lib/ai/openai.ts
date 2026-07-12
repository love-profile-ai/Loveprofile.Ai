import { z } from "zod";
import {
  ANALYSIS_SYSTEM_PROMPT,
  CHAT_SYSTEM_PROMPT,
  SUMMARY_REPORT_SYSTEM_PROMPT,
  buildAnalysisUserPrompt,
  buildChatUserPrompt,
  buildPersonalizationLayerPrompt,
  buildReflectiveReportUserPrompt,
  buildSummaryReportUserPrompt,
} from "./prompts";
import { createOpenRouterClient, OPENROUTER_MODEL } from "./openrouter";
import {
  analysisReportSchema,
  personalizationLayerSchema,
  reflectiveReportSchema,
} from "./schemas";
import type { AnalysisReport, ConfidenceLevel } from "@/types/report";
import type { Answer, AnalysisPath } from "@/types/questionnaire";
import type {
  AssessmentSummary,
  EnginePath,
  Question,
  SessionAnswerRecord,
  StructuredReport,
  UserProfile,
} from "@/types/adaptive-engine";
import {
  buildPersonalizationLayerInput,
  personalizationFallbackFromStructured,
} from "@/lib/engine/report-personalization-inputs";
import {
  buildComputedDimensionScores,
  buildFullQaTranscript,
} from "@/lib/engine/report-inputs";

function parseJsonFromModel(text: string): unknown {
  const trimmed = text.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  const jsonText = fenced ? fenced[1].trim() : trimmed;
  return JSON.parse(jsonText);
}

export async function generateAnalysis(
  path: AnalysisPath,
  answers: Answer[]
): Promise<AnalysisReport> {
  const client = createOpenRouterClient();
  const userPrompt = buildAnalysisUserPrompt(path, answers);

  const completion = await client.chat.completions.create({
    model: OPENROUTER_MODEL,
    messages: [
      { role: "system", content: ANALYSIS_SYSTEM_PROMPT },
      { role: "user", content: userPrompt },
    ],
    temperature: 0.4,
  });

  const raw = completion.choices[0]?.message?.content?.trim();
  if (!raw) {
    throw new Error("Empty response from OpenRouter");
  }

  const parsed = parseJsonFromModel(raw);
  return analysisReportSchema.parse(parsed);
}

function reflectiveToAnalysisReport(
  parsed: z.infer<typeof reflectiveReportSchema>
): AnalysisReport {
  return {
    summary: parsed.summary,
    ai_summary: parsed.ai_summary,
    confidence: parsed.confidence_label,
    what_we_noticed: parsed.what_we_noticed,
    gentle_next_steps: parsed.gentle_next_steps,
    looking_ahead: parsed.looking_ahead,
  };
}

function personalizationToAnalysisReport(
  parsed: z.infer<typeof personalizationLayerSchema>,
  confidenceLabel: ConfidenceLevel,
  dimensions: { highest: string; lowest: string }
): AnalysisReport {
  return {
    summary: `${parsed.archetype}. ${parsed.opener_line}`,
    ai_summary: parsed.ai_summary,
    confidence: confidenceLabel,
    what_we_noticed: [
      `Stage: ${parsed.archetype}`,
      `Tone in your answers: ${parsed.tone_class}`,
      `Strongest signal: ${dimensions.highest}`,
      `Still unfolding: ${dimensions.lowest}`,
    ],
    gentle_next_steps: [parsed.next_step],
    looking_ahead: parsed.looking_ahead,
  };
}

function isPersonalizationEnabled(): boolean {
  return Boolean(process.env.OPENROUTER_API_KEY);
}

/** Thin AI layer: translates pre-computed scores into report prose. */
export async function generatePersonalizedReport(input: {
  path: EnginePath;
  profile: UserProfile;
  answers: SessionAnswerRecord[];
  questions: Question[];
  structured: StructuredReport;
}): Promise<AnalysisReport> {
  if (!isPersonalizationEnabled()) {
    return personalizationFallbackFromStructured(input.structured);
  }

  const layerInput = buildPersonalizationLayerInput({
    path: input.path,
    profile: input.profile,
    answers: input.answers,
    questions: input.questions,
  });

  const client = createOpenRouterClient();
  const completion = await client.chat.completions.create({
    model: OPENROUTER_MODEL,
    messages: [{ role: "user", content: buildPersonalizationLayerPrompt(layerInput) }],
    temperature: 0.35,
    max_tokens: 800,
    response_format: { type: "json_object" },
  });

  const raw = completion.choices[0]?.message?.content?.trim();
  if (!raw) {
    throw new Error("Empty response from OpenRouter");
  }

  const parsed = personalizationLayerSchema.parse(parseJsonFromModel(raw));
  return personalizationToAnalysisReport(parsed, input.structured.confidence_label, {
    highest: layerInput.highest_dimension,
    lowest: layerInput.lowest_dimension,
  });
}

/** Grounded report from full Q&A transcript + deterministic scores. */
export async function generateReportFromTranscript(input: {
  path: AssessmentSummary["path"];
  profile: UserProfile;
  answers: SessionAnswerRecord[];
  questions: Question[];
}): Promise<{ analysis: AnalysisReport; confidencePercent: number }> {
  const client = createOpenRouterClient();
  const pathLabel =
    input.path === "do_i_love_someone"
      ? "Do I Love Someone?"
      : "Does Someone Love Me?";

  const userPrompt = buildReflectiveReportUserPrompt({
    transcript: buildFullQaTranscript(input.answers, input.questions),
    computedScores: buildComputedDimensionScores(input.profile),
    pathLabel,
  });

  const completion = await client.chat.completions.create({
    model: OPENROUTER_MODEL,
    messages: [{ role: "user", content: userPrompt }],
    temperature: 0.45,
    max_tokens: 1600,
    response_format: { type: "json_object" },
  });

  const raw = completion.choices[0]?.message?.content?.trim();
  if (!raw) {
    throw new Error("Empty response from OpenRouter");
  }

  const parsed = reflectiveReportSchema.parse(parseJsonFromModel(raw));
  return {
    analysis: reflectiveToAnalysisReport(parsed),
    confidencePercent: Math.round(parsed.confidence),
  };
}

/** Token-optimized: one AI call using compact assessment summary only. */
export async function generateReportFromSummary(
  summary: AssessmentSummary
): Promise<AnalysisReport> {
  const client = createOpenRouterClient();
  const userPrompt = buildSummaryReportUserPrompt(summary);

  const completion = await client.chat.completions.create({
    model: OPENROUTER_MODEL,
    messages: [
      { role: "system", content: SUMMARY_REPORT_SYSTEM_PROMPT },
      { role: "user", content: userPrompt },
    ],
    temperature: 0.4,
    max_tokens: 1200,
  });

  const raw = completion.choices[0]?.message?.content?.trim();
  if (!raw) {
    throw new Error("Empty response from OpenRouter");
  }

  const parsed = parseJsonFromModel(raw);
  return analysisReportSchema.parse(parsed);
}

export async function generateChatResponse(
  path: string,
  answers: Answer[],
  analysis: AnalysisReport,
  history: { role: "user" | "assistant"; content: string }[],
  message: string,
  assessmentSummary?: import("@/types/adaptive-engine").AssessmentSummary | null
): Promise<string> {
  const client = createOpenRouterClient();
  const userPrompt = buildChatUserPrompt(
    path,
    answers,
    analysis,
    history,
    message,
    assessmentSummary
  );

  const completion = await client.chat.completions.create({
    model: OPENROUTER_MODEL,
    messages: [
      { role: "system", content: CHAT_SYSTEM_PROMPT },
      { role: "user", content: userPrompt },
    ],
    temperature: 0.6,
  });

  return (
    completion.choices[0]?.message?.content?.trim() ??
    "Sorry, I couldn't respond right now."
  );
}

export async function* streamChatResponse(
  path: string,
  answers: Answer[],
  analysis: AnalysisReport,
  history: { role: "user" | "assistant"; content: string }[],
  message: string,
  assessmentSummary?: import("@/types/adaptive-engine").AssessmentSummary | null
): AsyncGenerator<string> {
  const client = createOpenRouterClient();
  const userPrompt = buildChatUserPrompt(
    path,
    answers,
    analysis,
    history,
    message,
    assessmentSummary
  );

  const stream = await client.chat.completions.create({
    model: OPENROUTER_MODEL,
    messages: [
      { role: "system", content: CHAT_SYSTEM_PROMPT },
      { role: "user", content: userPrompt },
    ],
    temperature: 0.6,
    stream: true,
  });

  for await (const chunk of stream) {
    const text = chunk.choices[0]?.delta?.content;
    if (text) yield text;
  }
}

export function formatAnalysisError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  if (message.includes("OPENROUTER_API_KEY")) {
    return "AI is not configured. Add OPENROUTER_API_KEY to .env.local.";
  }
  if (message.includes("401") || message.toLowerCase().includes("unauthorized")) {
    return "Invalid OpenRouter API key.";
  }
  if (message.includes("402") || message.toLowerCase().includes("insufficient")) {
    return "OpenRouter credits exhausted. Add credits and try again.";
  }
  return message || "Analysis failed. Please try again.";
}
