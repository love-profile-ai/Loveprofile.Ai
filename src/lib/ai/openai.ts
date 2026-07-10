import {
  ANALYSIS_SYSTEM_PROMPT,
  CHAT_SYSTEM_PROMPT,
  SUMMARY_REPORT_SYSTEM_PROMPT,
  buildAnalysisUserPrompt,
  buildChatUserPrompt,
  buildSummaryReportUserPrompt,
} from "./prompts";
import { createOpenRouterClient, OPENROUTER_MODEL } from "./openrouter";
import { analysisReportSchema } from "./schemas";
import type { AnalysisReport } from "@/types/report";
import type { Answer, AnalysisPath } from "@/types/questionnaire";
import type { AssessmentSummary } from "@/types/adaptive-engine";

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
