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
import {
  findBestMatch,
  hashAnswerSeed,
  pickVariant,
} from "@/lib/engine/result-template-matcher";
import { reportFromTemplate } from "@/lib/engine/report-from-template";

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
    // Match a result template before calling the AI so the archetype and
    // tone are grounded in deterministic scoring, not invented per-call.
    const seed = hashAnswerSeed(answers);
    const template = findBestMatch({ profile, answers });
    const summarySeed = pickVariant(template.summary_variants, seed, 0);
    const lookingAheadSeed = pickVariant(template.looking_ahead_variants, seed, 1);

    try {
      const analysis = await generatePersonalizedReport({
        path: summary.path,
        profile,
        answers,
        questions,
        structured,
        templateGuidance: {
          templateId: template.id,
          title: template.title,
          moodTag: template.mood_tag,
          tone: template.tone,
          summarySeed,
          lookingAheadSeed,
        },
      });
      return { analysis, structured, finalSummary };
    } catch (error) {
      console.error(
        "Personalization layer failed, using template fallback:",
        formatAnalysisError(error)
      );
      // Same seed => same picks, so this fallback is answer-unique too,
      // and produces a complete, valid report with no AI involved.
      const analysis = reportFromTemplate(template, seed, structured);
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
