import { NextResponse } from "next/server";
import { generateAnalysis, formatAnalysisError } from "@/lib/ai/openai";
import { analyzeRequestSchema } from "@/lib/ai/schemas";
import { rateLimit } from "@/lib/rate-limit";
import {
  containsPromptInjection,
  sanitizeAnswers,
} from "@/lib/sanitize";

export const maxDuration = 60;

/** Generate analysis without Supabase auth — used when auth providers are disabled. */
export async function POST(request: Request) {
  try {
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      request.headers.get("x-real-ip") ??
      "unknown";

    const limit = rateLimit(`analyze-local:${ip}`, 5, 60 * 60 * 1000);
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

    const { path, answers } = parsed.data;
    const sanitized = sanitizeAnswers(answers);

    for (const a of sanitized) {
      if (typeof a.value === "string" && containsPromptInjection(a.value)) {
        return NextResponse.json(
          { error: "Invalid input detected" },
          { status: 400 }
        );
      }
    }

    const analysis = await generateAnalysis(path, sanitized as typeof answers);

    return NextResponse.json({ analysis, local: true });
  } catch (error) {
    console.error("Local analyze error:", error);
    const message =
      error instanceof Error && error.message.includes("timeout")
        ? "Analysis timed out"
        : formatAnalysisError(error);
    return NextResponse.json(
      { error: message },
      {
        status:
          error instanceof Error && error.message.includes("timeout") ? 504 : 500,
      }
    );
  }
}
