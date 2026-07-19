import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

import type {

  AnswerResponse,

  AnswerValue,

  EngineDecision,

  SessionAnswerRecord,

} from "@/types/adaptive-engine";

import {

  loadQuestions,

  profileFromRow,

  profileToRow,

  summaryFromProfileRow,

} from "@/lib/engine/question-bank";

import { processAnswer, serializeAnswerValue } from "@/lib/engine/runner";

import { updateAssessmentSummary } from "@/lib/engine/assessment-summary";

import { evaluateRules } from "@/lib/engine/rules";
import { STATIC_QUESTIONNAIRE_ONLY } from "@/lib/engine/constants";
import { resolveNextQuestion } from "@/lib/engine/selectQuestionLlm";

import {

  getAssessmentPhase,

  isFoundationQuestionId,

  processFoundationAnswer,

  resolveQuestionForSession,

  getSessionQuestionBank,

} from "@/lib/engine/foundation-phase";



const CONTINUE_DECISION: EngineDecision = {

  should_end: false,

  reason: "continue",

  priority_dimensions: [],

};



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



  const adaptiveQuestions = await loadQuestions(session.path);
  const questionBank = getSessionQuestionBank(session.path, adaptiveQuestions);

  const question = resolveQuestionForSession(
    session.path,
    questionId,
    adaptiveQuestions,
    body.question
  );



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



  if (isFoundationQuestionId(questionId)) {

    let foundationResult;

    try {

      foundationResult = processFoundationAnswer({

        path: session.path,

        question,

        value,

        profile,

        answers,

      });

    } catch (error) {

      const message =

        error instanceof Error ? error.message : "Invalid foundation answer";

      return NextResponse.json({ error: message }, { status: 400 });

    }



    assessment_summary = updateAssessmentSummary(

      assessment_summary,

      question,

      value,

      foundationResult.profile,

      foundationResult.score_deltas,

      foundationResult.newAnswer.is_uncertain

    );



    const { error: answerError } = await supabase.from("assessment_answers").insert({

      session_id: sessionId,

      question_id: questionId,

      value,

      score_deltas: foundationResult.score_deltas,

      is_uncertain: foundationResult.newAnswer.is_uncertain,

    });



    if (answerError) {
      console.error("Failed to insert assessment answer:", answerError);
      return NextResponse.json(
        {
          error: "Failed to save answer",
          detail:
            process.env.NODE_ENV === "development"
              ? answerError.message
              : undefined,
        },
        { status: 500 }
      );
    }



    const { error: profileUpdateError } = await supabase

      .from("assessment_profiles")

      .update(profileToRow(foundationResult.profile, assessment_summary))

      .eq("session_id", sessionId);



    if (profileUpdateError) {

      return NextResponse.json(

        { error: "Failed to update assessment profile" },

        { status: 500 }

      );

    }



    const newCount = (session.question_count ?? 0) + 1;

    const updatedAnswers = [...answers, foundationResult.newAnswer];

    const phase = getAssessmentPhase(foundationResult.profile, session.path);



    if (!foundationResult.foundationComplete && foundationResult.nextFoundationQuestion) {

      await supabase

        .from("assessment_sessions")

        .update({ question_count: newCount })

        .eq("id", sessionId);



      const response = {

        finished: false,

        nextQuestion: foundationResult.nextFoundationQuestion,

        decision: CONTINUE_DECISION,

        profile: foundationResult.profile,

        assessmentSummary: assessment_summary,

        confidence: foundationResult.profile.confidence_score,

        questionNumber: newCount + 1,

        phase,

        scoreDeltas: foundationResult.score_deltas,

      } satisfies AnswerResponse;



      return NextResponse.json(response);

    }

    if (STATIC_QUESTIONNAIRE_ONLY) {
      const decision: EngineDecision = {
        should_end: true,
        reason: "static_questionnaire_complete",
        priority_dimensions: [],
      };

      await supabase
        .from("assessment_sessions")
        .update({ status: "completed", question_count: newCount })
        .eq("id", sessionId);

      return NextResponse.json({
        finished: true,
        sessionId,
        decision,
        profile: foundationResult.profile,
        assessmentSummary: assessment_summary,
        confidence: foundationResult.profile.confidence_score,
        questionNumber: newCount,
        phase: "foundation" as const,
        scoreDeltas: foundationResult.score_deltas,
      } satisfies AnswerResponse);
    }

    const decision = evaluateRules(foundationResult.profile);

    const selection = await resolveNextQuestion({

      questions: questionBank,

      profile: foundationResult.profile,

      answers: updatedAnswers,

      decision,

    });



    const finished = decision.should_end || selection.question === null;



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

        decision,

        profile: foundationResult.profile,

        assessmentSummary: assessment_summary,

        confidence: foundationResult.profile.confidence_score,

        questionNumber: newCount,

        phase: "adaptive" as const,

        scoreDeltas: foundationResult.score_deltas,

      } satisfies AnswerResponse;



      return NextResponse.json(response);

    }



    if (!selection.question) {

      return NextResponse.json(

        { error: "Adaptive engine returned an invalid continuation state" },

        { status: 500 }

      );

    }



    const response = {

      finished: false,

      nextQuestion: selection.question,

      decision,

      profile: foundationResult.profile,

      assessmentSummary: assessment_summary,

      confidence: foundationResult.profile.confidence_score,

      questionNumber: newCount + 1,

      phase: "adaptive" as const,

      scoreDeltas: foundationResult.score_deltas,

    } satisfies AnswerResponse;



    return NextResponse.json(response);

  }



  const result = await processAnswer({

    question,

    value,

    profile,

    answers,

    questions: questionBank,

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
    console.error("Failed to insert assessment answer:", answerError);
    return NextResponse.json(
      {
        error: "Failed to save answer",
        detail:
          process.env.NODE_ENV === "development"
            ? answerError.message
            : undefined,
      },
      { status: 500 }
    );
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



  const phase = getAssessmentPhase(result.profile, session.path);



  if (finished) {

    const response = {

      finished: true,

      sessionId,

      decision: result.decision,

      profile: result.profile,

      assessmentSummary: assessment_summary,

      confidence: result.profile.confidence_score,

      questionNumber: newCount,

      phase,

      scoreDeltas: result.score_deltas,

    } satisfies AnswerResponse;



    return NextResponse.json(response);

  }



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

    phase,

    scoreDeltas: result.score_deltas,

  } satisfies AnswerResponse;



  return NextResponse.json(response);

}

