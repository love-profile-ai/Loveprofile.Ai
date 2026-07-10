import type { AssessmentSummary } from "@/types/adaptive-engine";
import type { AnalysisReport } from "@/types/report";
import {
  generateReportFromSummary,
  formatAnalysisError,
} from "@/lib/ai/openai";
import {
  finalizeAssessmentSummary,
} from "@/lib/engine/assessment-summary";
import type { UserProfile } from "@/types/adaptive-engine";
import {
  generateStructuredReport,
  toAnalysisReport,
} from "@/lib/engine/generateReport";

export async function buildFinalReport(
  summary: AssessmentSummary,
  profile: UserProfile
): Promise<{
  analysis: AnalysisReport;
  structured: ReturnType<typeof generateStructuredReport>;
  finalSummary: AssessmentSummary;
}> {
  const finalSummary = finalizeAssessmentSummary(summary, profile);
  const structured = generateStructuredReport(summary.path, profile, []);

  try {
    const analysis = await generateReportFromSummary(finalSummary);
    return { analysis, structured, finalSummary };
  } catch (error) {
    console.error("AI report from summary failed, using structured fallback:", formatAnalysisError(error));
    const analysis = toAnalysisReport(structured);
    return { analysis, structured, finalSummary };
  }
}
