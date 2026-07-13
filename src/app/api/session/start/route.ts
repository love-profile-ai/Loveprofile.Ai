import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

import { resolveEnginePath } from "@/lib/engine/map-path";

import { createEmptyProfile } from "@/lib/engine/profile-utils";

import { loadQuestions, profileFromRow, profileToRow, summaryFromProfileRow } from "@/lib/engine/question-bank";

import { createEmptySummary } from "@/lib/engine/assessment-summary";

import {

  getAssessmentPhase,

  getFirstFoundationQuestion,

} from "@/lib/engine/foundation-phase";



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



  const profile = createEmptyProfile();

  const assessment_summary = createEmptySummary(enginePath);

  const firstQuestion = getFirstFoundationQuestion(enginePath);



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

    phase: getAssessmentPhase(profile, enginePath),

  });

}

