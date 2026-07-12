import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

import type { AnswerValue, SessionAnswerRecord } from "@/types/adaptive-engine";

import { fromEnginePath } from "@/lib/engine/map-path";

import { loadQuestions, profileFromRow, summaryFromProfileRow } from "@/lib/engine/question-bank";

import { buildFinalReport } from "@/lib/engine/build-final-report";



export const maxDuration = 60;



export async function GET(

  _request: Request,

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



  const { data: session, error: sessionError } = await supabase

    .from("assessment_sessions")

    .select("*")

    .eq("id", sessionId)

    .eq("user_id", user.id)

    .single();



  if (sessionError || !session) {

    return NextResponse.json({ error: "Session not found" }, { status: 404 });

  }



  const { data: profileRow } = await supabase

    .from("assessment_profiles")

    .select("*")

    .eq("session_id", sessionId)

    .single();



  if (!profileRow) {

    return NextResponse.json({ error: "Profile not found" }, { status: 404 });

  }



  const profile = profileFromRow(profileRow as Record<string, unknown>);

  const storedSummary = summaryFromProfileRow(

    profileRow as Record<string, unknown>,

    session.path

  );



  const { data: answerRows } = await supabase

    .from("assessment_answers")

    .select("*")

    .eq("session_id", sessionId)

    .order("created_at", { ascending: true });



  const questions = await loadQuestions(session.path);

  const questionTextMap = new Map<string, { text: string; type: string }>();

  for (const row of answerRows ?? []) {

    const q = questions.find((item) => item.id === row.question_id);

    if (q) questionTextMap.set(row.question_id, { text: q.question_text, type: q.type });

  }



  const answers: SessionAnswerRecord[] = (answerRows ?? []).map((row) => ({

    id: row.id,

    session_id: row.session_id,

    question_id: row.question_id,

    value: row.value as AnswerValue,

    score_deltas: row.score_deltas as SessionAnswerRecord["score_deltas"],

    is_uncertain: row.is_uncertain,

    created_at: row.created_at,

  }));



  const { analysis, structured, finalSummary } = await buildFinalReport({
    summary: storedSummary,
    profile,
    answers,
    questions,
  });



  const legacyAnswers = (answerRows ?? []).map((row) => {

    const q = questionTextMap.get(row.question_id);

    const raw = (row.value as AnswerValue).raw;

    return {

      questionId: row.question_id,

      questionText: q?.text ?? row.question_id,

      type: q?.type ?? "single_select",

      value: raw as string | number | boolean,

    };

  });



  const { data: existingReport } = await supabase

    .from("reports")

    .select("id")

    .eq("assessment_session_id", sessionId)

    .maybeSingle();



  let reportId = existingReport?.id;



  if (!reportId) {

    const { data: report, error: insertError } = await supabase

      .from("reports")

      .insert({

        user_id: user.id,

        assessment_session_id: sessionId,

        path: fromEnginePath(session.path),

        answers: legacyAnswers,

        analysis,

        assessment_summary: finalSummary,

        title: finalSummary.dominant_themes[0] ?? structured.relationship_type,

      })

      .select("id")

      .single();



    if (insertError || !report) {

      return NextResponse.json(

        { error: "Failed to save report" },

        { status: 500 }

      );

    }

    reportId = report.id;

  }



  return NextResponse.json({

    reportId,

    structured,

    assessment_summary: finalSummary,

    analysis,

    profile,

  });

}


