import type {
  AssessmentSummary,
  Question,
  SessionAnswerRecord,
  UserProfile,
} from "@/types/adaptive-engine";
import type { AnalysisReport } from "@/types/report";
import {
  generatePersonalizedReport,
  generateReportFromSummary,
  formatAnalysisError,
} from "@/lib/ai/openai";
import { finalizeAssessmentSummary } from "@/lib/engine/assessment-summary";
import { generateStructuredReport, toAnalysisReport } from "@/lib/engine/generateReport";
import { personalizationFallbackFromStructured } from "@/lib/engine/report-personalization-inputs";

export interface BuildFinalReportInput {
  summary: AssessmentSummary;
  profile: UserProfile;
  answers?: SessionAnswerRecord[];
  questions?: Question[];
}

export async function buildFinalReport({
  summary,
  profile,
  answers = [],
  questions = [],
}: BuildFinalReportInput): Promise<{
  analysis: AnalysisReport;
  structured: ReturnType<typeof generateStructuredReport>;
  finalSummary: AssessmentSummary;
}> {
  const finalSummary = finalizeAssessmentSummary(summary, profile);
  const structured = generateStructuredReport(summary.path, profile, answers);

  const hasSessionData = answers.length > 0;

  if (hasSessionData) {
    try {
      const analysis = await generatePersonalizedReport({
        path: summary.path,
        profile,
        answers,
        questions,
        structured,
      });
      return { analysis, structured, finalSummary };
    } catch (error) {
      console.error(
        "Personalization layer failed, using structured fallback:",
        formatAnalysisError(error)
      );
      const analysis = personalizationFallbackFromStructured(structured);
      return { analysis, structured, finalSummary };
    }
  }

  try {
    const analysis = await generateReportFromSummary(finalSummary);
    return { analysis, structured, finalSummary };
  } catch (error) {
    console.error(
      "AI report from summary failed, using structured fallback:",
      formatAnalysisError(error)
    );
    const analysis = toAnalysisReport(structured);
    return { analysis, structured, finalSummary };
  }
}
