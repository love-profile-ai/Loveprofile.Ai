import type { ResultTemplate } from "@/content/result-templates-gap-fill";
import type { StructuredReport } from "@/types/adaptive-engine";
import type { AnalysisReport } from "@/types/report";
import { pickVariant } from "./result-template-matcher";

/**
 * Complete, AI-free report assembled directly from a matched template.
 * Used when the AI personalization call fails, times out, or is
 * disabled — must always produce a valid, complete AnalysisReport.
 */
export function reportFromTemplate(
  template: ResultTemplate,
  seed: number,
  structured: StructuredReport
): AnalysisReport {
  const summaryVariant = pickVariant(template.summary_variants, seed, 0);
  const lookingAhead = pickVariant(template.looking_ahead_variants, seed, 1);

  return {
    summary: `${template.title}. ${summaryVariant}`,
    ai_summary: summaryVariant,
    confidence: structured.confidence_label,
    what_we_noticed: [
      summaryVariant,
      `Current read: ${structured.relationship_type}`,
    ],
    gentle_next_steps: structured.suggested_next_steps.slice(0, 3),
    looking_ahead: lookingAhead,
  };
}
