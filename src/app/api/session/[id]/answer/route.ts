import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type {
  AnswerResponse,
  AnswerValue,
  SessionAnswerRecord,
} from "@/types/adaptive-engine";
import {
  loadQuestionsForPath,
  profileFromRow,
  profileToRow,
  summaryFromProfileRow,
} from "@/lib/engine/questions-loader";
import { processAnswer, serializeAnswerValue } from "@/lib/engine/runner";
import { updateAssessmentSummary } from "@/lib/engine/assessment-summary";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: sessionId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const questionId = body.question_id as string;
  const rawValue = body.value as string | number | boolean | string[];

  if (!questionId || rawValue === undefined) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const { data: session, error: sessionError } = await supabase
    .from("assessment_sessions")
    .select("*")
    .eq("id", sessionId)
    .eq("user_id", user.id)
    .single();

  if (sessionError || !session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  if (session.status === "completed") {
    return NextResponse.json({ error: "Session already completed" }, { status: 400 });
  }

  const { data: profileRow, error: profileError } = await supabase
    .from("assessment_profiles")
    .select("*")
    .eq("session_id", sessionId)
    .single();

  if (profileError || !profileRow) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  const questions = await loadQuestionsForPath(session.path);
  const question = questions.find((q) => q.id === questionId);

  if (!question) {
    return NextResponse.json({ error: "Question not found" }, { status: 404 });
  }

  const profile = profileFromRow(profileRow as Record<string, unknown>);
  let assessment_summary = summaryFromProfileRow(
    profileRow as Record<string, unknown>,
    session.path
  );

  if (profile.asked_question_ids.includes(questionId)) {
    return NextResponse.json({ error: "Question already answered" }, { status: 400 });
  }

  const { data: answerRows } = await supabase
    .from("assessment_answers")
    .select("*")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: true });

  const answers: SessionAnswerRecord[] = (answerRows ?? []).map((row) => ({
    id: row.id,
    session_id: row.session_id,
    question_id: row.question_id,
    value: row.value as AnswerValue,
    score_deltas: row.score_deltas as SessionAnswerRecord["score_deltas"],
    is_uncertain: row.is_uncertain,
    created_at: row.created_at,
  }));

  const value = serializeAnswerValue(rawValue);

  const result = await processAnswer({
    question,
    value,
    profile,
    answers,
    questions,
  });

  assessment_summary = updateAssessmentSummary(
    assessment_summary,
    question,
    value,
    result.profile,
    result.score_deltas ?? {},
    result.newAnswer.is_uncertain
  );

  const { error: answerError } = await supabase.from("assessment_answers").insert({
    session_id: sessionId,
    question_id: questionId,
    value,
    score_deltas: result.score_deltas ?? {},
    is_uncertain: result.newAnswer.is_uncertain,
  });

  if (answerError) {
    return NextResponse.json({ error: "Failed to save answer" }, { status: 500 });
  }

  const { error: profileUpdateError } = await supabase
    .from("assessment_profiles")
    .update(profileToRow(result.profile, assessment_summary))
    .eq("session_id", sessionId);

  if (profileUpdateError) {
    return NextResponse.json(
      { error: "Failed to update assessment profile" },
      { status: 500 }
    );
  }

  const newCount = (session.question_count ?? 0) + 1;
  const finished = result.finished || result.next_question === null;

  const { error: sessionUpdateError } = await supabase
    .from("assessment_sessions")
    .update({
      ...(finished ? { status: "completed" } : {}),
      question_count: newCount,
    })
    .eq("id", sessionId);

  if (sessionUpdateError) {
    return NextResponse.json(
      { error: "Failed to update assessment session" },
      { status: 500 }
    );
  }

  if (finished) {
    const response = {
      finished: true,
      sessionId,
      decision: result.decision,
      profile: result.profile,
      assessmentSummary: assessment_summary,
      confidence: result.profile.confidence_score,
      questionNumber: newCount,
      scoreDeltas: result.score_deltas,
    } satisfies AnswerResponse;

    return NextResponse.json(response);
  }

  // The finished branch above handles a null next question, so this branch can
  // only expose a real next question. A response never contains both signals.
  const nextQuestion = result.next_question;
  if (!nextQuestion) {
    return NextResponse.json(
      { error: "Engine returned an invalid continuation state" },
      { status: 500 }
    );
  }

  const response = {
    finished: false,
    nextQuestion,
    decision: result.decision,
    profile: result.profile,
    assessmentSummary: assessment_summary,
    confidence: result.profile.confidence_score,
    questionNumber: newCount + 1,
    scoreDeltas: result.score_deltas,
  } satisfies AnswerResponse;

  return NextResponse.json(response);
}
