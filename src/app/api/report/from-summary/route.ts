import { NextResponse } from "next/server";
import { z } from "zod";
import type { AssessmentSummary } from "@/types/adaptive-engine";
import { resolveEnginePath } from "@/lib/engine/map-path";
import {
  finalizeAssessmentSummary,
} from "@/lib/engine/assessment-summary";
import {
  generateReportFromSummary,
  formatAnalysisError,
} from "@/lib/ai/openai";
import {
  generateStructuredReport,
  toAnalysisReport,
} from "@/lib/engine/generateReport";
import { createEmptyProfile } from "@/lib/engine/profile-utils";
import { rateLimit } from "@/lib/rate-limit";

const bodySchema = z.object({
  path: z.string(),
  summary: z.custom<AssessmentSummary>(),
});

export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "anon";
    const limit = rateLimit(`report-summary:${ip}`, 10, 60 * 60 * 1000);
    if (!limit.success) {
      return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
    }

    const body = await request.json();
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const enginePath = resolveEnginePath(parsed.data.path);
    if (!enginePath) {
      return NextResponse.json({ error: "Invalid path" }, { status: 400 });
    }

    const finalized = finalizeAssessmentSummary(
      parsed.data.summary,
      profileFromSummary(parsed.data.summary)
    );

    let analysis;
    try {
      analysis = await generateReportFromSummary(finalized);
    } catch (aiError) {
      console.error("AI report from summary failed, using structured fallback:", aiError);
      const structured = generateStructuredReport(
        enginePath,
        profileFromSummary(finalized),
        []
      );
      analysis = toAnalysisReport(structured);
    }

    return NextResponse.json({
      analysis,
      summary: finalized,
      title:
        finalized.dominant_themes[0] ??
        (enginePath === "do_i_love_someone"
          ? "Relationship Reflection"
          : "Signals Reflection"),
    });
  } catch (error) {
    console.error("Report from summary error:", error);
    return NextResponse.json(
      { error: formatAnalysisError(error) },
      { status: 500 }
    );
  }
}

function profileFromSummary(summary: AssessmentSummary) {
  const scores = summary.dimension_scores;
  return {
    ...createEmptyProfile(),
    love_score: scores.love ?? 0,
    crush_score: scores.crush ?? 0,
    friendship_score: scores.friendship ?? 0,
    trust_score: scores.trust ?? 0,
    attachment_score: scores.attachment ?? 0,
    commitment_score: scores.commitment ?? 0,
    future_score: scores.future ?? 0,
    communication_score: scores.communication ?? 0,
    jealousy_score: scores.jealousy ?? 0,
    physical_attraction_score: scores.physical_attraction ?? 0,
    emotional_attraction_score: scores.emotional_attraction ?? 0,
    reciprocity_score: scores.reciprocity ?? 0,
    confidence_score: summary.confidence_percent,
    asked_question_ids: Array.from({ length: summary.questions_answered }, (_, i) =>
      String(i)
    ),
  };
}
