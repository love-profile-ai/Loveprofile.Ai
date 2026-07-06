import type { AnalysisReport, ConfidenceLevel } from "@/types/report";
import { analysisReportSchema } from "./schemas";

/** Maps legacy stored reports to the current 7-section shape. */
export function normalizeReport(raw: unknown): AnalysisReport {
  const parsed = analysisReportSchema.safeParse(raw);
  if (parsed.success) return parsed.data;

  const legacy = raw as Record<string, unknown>;
  const confidence = (legacy.confidence as ConfidenceLevel) ?? "Medium";

  const whatWeNoticed = [
    legacy.interest_level,
    legacy.communication_analysis,
    legacy.emotional_signals,
    Array.isArray(legacy.mixed_signals) && legacy.mixed_signals.length
      ? `Mixed signals: ${(legacy.mixed_signals as string[]).join("; ")}`
      : null,
  ].filter((v): v is string => typeof v === "string" && v.length > 0);

  return {
    summary: String(legacy.summary ?? "Your relationship analysis."),
    confidence,
    green_flags: Array.isArray(legacy.green_flags)
      ? (legacy.green_flags as string[])
      : [],
    red_flags: Array.isArray(legacy.red_flags)
      ? (legacy.red_flags as string[])
      : [],
    what_we_noticed:
      whatWeNoticed.length > 0
        ? whatWeNoticed
        : ["Patterns in your answers suggest a connection worth reflecting on."],
    gentle_next_steps: Array.isArray(legacy.advice)
      ? (legacy.advice as string[])
      : Array.isArray(legacy.gentle_next_steps)
        ? (legacy.gentle_next_steps as string[])
        : ["Take time to notice how you feel after spending time together."],
    looking_ahead: String(
      legacy.looking_ahead ?? legacy.future_outlook ?? "Stay curious and patient as the situation unfolds."
    ),
  };
}
