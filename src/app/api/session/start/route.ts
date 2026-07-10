import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { resolveEnginePath } from "@/lib/engine/map-path";
import { createEmptyProfile } from "@/lib/engine/profile-utils";
import { loadQuestionsForPath, profileToRow, summaryFromProfileRow } from "@/lib/engine/questions-loader";
import { selectFirstQuestion } from "@/lib/engine/selectQuestion";
import { createEmptySummary } from "@/lib/engine/assessment-summary";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const enginePath = resolveEnginePath(body.path ?? "");

  if (!enginePath) {
    return NextResponse.json({ error: "Invalid path" }, { status: 400 });
  }

  const questions = await loadQuestionsForPath(enginePath);
  const profile = createEmptyProfile();
  const assessment_summary = createEmptySummary(enginePath);
  const firstQuestion = selectFirstQuestion(questions, profile);

  if (!firstQuestion) {
    return NextResponse.json(
      { error: "No questions available for this path" },
      { status: 500 }
    );
  }

  const { data: session, error: sessionError } = await supabase
    .from("assessment_sessions")
    .insert({
      user_id: user.id,
      path: enginePath,
      status: "in_progress",
      question_count: 0,
    })
    .select("id")
    .single();

  if (sessionError || !session) {
    return NextResponse.json(
      { error: "Failed to create session" },
      { status: 500 }
    );
  }

  const { error: profileError } = await supabase
    .from("assessment_profiles")
    .insert({
      session_id: session.id,
      ...profileToRow(profile, assessment_summary),
    });

  if (profileError) {
    return NextResponse.json(
      { error: "Failed to initialize profile" },
      { status: 500 }
    );
  }

  return NextResponse.json({
    sessionId: session.id,
    path: enginePath,
    question: firstQuestion,
    profile,
    assessment_summary,
    confidence: profile.confidence_score,
    questionNumber: 1,
  });
}
