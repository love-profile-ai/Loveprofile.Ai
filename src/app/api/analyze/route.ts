import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateAnalysis, formatAnalysisError } from "@/lib/ai/openai";
import { analyzeRequestSchema } from "@/lib/ai/schemas";
import { rateLimit } from "@/lib/rate-limit";
import {
  containsPromptInjection,
  sanitizeAnswers,
} from "@/lib/sanitize";

export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const limit = rateLimit(`analyze:${user.id}`, 5, 60 * 60 * 1000);
    if (!limit.success) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Try again later." },
        { status: 429 }
      );
    }

    const body = await request.json();
    const parsed = analyzeRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { sessionId, path, answers } = parsed.data;
    const sanitized = sanitizeAnswers(answers);

    for (const a of sanitized) {
      if (
        typeof a.value === "string" &&
        containsPromptInjection(a.value)
      ) {
        return NextResponse.json(
          { error: "Invalid input detected" },
          { status: 400 }
        );
      }
    }

    const analysis = await generateAnalysis(path, sanitized as typeof answers);

    const { data: report, error: insertError } = await supabase
      .from("reports")
      .insert({
        user_id: user.id,
        session_id: sessionId ?? null,
        path,
        answers: sanitized,
        analysis,
        title: "Relationship Analysis",
      })
      .select("id, analysis")
      .single();

    if (insertError) {
      console.error("Report insert error:", insertError);
      return NextResponse.json(
        { error: "Failed to save report" },
        { status: 500 }
      );
    }

    if (sessionId) {
      await supabase
        .from("analysis_sessions")
        .update({ status: "completed", answers: sanitized })
        .eq("id", sessionId)
        .eq("user_id", user.id);
    }

    return NextResponse.json({
      reportId: report.id,
      analysis: report.analysis,
    });
  } catch (error) {
    console.error("Analyze error:", error);
    const message =
      error instanceof Error && error.message.includes("timeout")
        ? "Analysis timed out"
        : formatAnalysisError(error);
    return NextResponse.json(
      { error: message },
      { status: error instanceof Error && error.message.includes("timeout") ? 504 : 500 }
    );
  }
}
