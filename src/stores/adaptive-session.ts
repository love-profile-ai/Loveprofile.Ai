"use client";

import { create } from "zustand";
import type {
  AssessmentSummary,
  EnginePath,
  Question,
  SessionAnswerRecord,
  UserProfile,
} from "@/types/adaptive-engine";
import { createEmptyProfile } from "@/lib/engine/profile-utils";
import { getSeedQuestionsForPath } from "@/lib/engine/seed-questions";
import { selectFirstQuestion } from "@/lib/engine/selectQuestion";
import { processAnswer, serializeAnswerValue } from "@/lib/engine/runner";
import {
  createEmptySummary,
  updateAssessmentSummary,
  finalizeAssessmentSummary,
} from "@/lib/engine/assessment-summary";
import { fromEnginePath, toEnginePath } from "@/lib/engine/map-path";
import type { AnalysisPath } from "@/types/questionnaire";
import { saveLocalReport } from "@/lib/local-report";

interface AdaptiveSessionState {
  sessionId: string | null;
  path: EnginePath | null;
  localMode: boolean;
  currentQuestion: Question | null;
  profile: UserProfile;
  assessmentSummary: AssessmentSummary | null;
  answers: SessionAnswerRecord[];
  questions: Question[];
  extraQuestions: Question[];
  questionNumber: number;
  confidence: number;
  finished: boolean;
  loading: boolean;
  generating: boolean;
  error: string | null;

  initSession: (
    sessionId: string,
    path: AnalysisPath,
    localMode: boolean,
    firstQuestion?: Question,
    profile?: UserProfile,
    assessmentSummary?: AssessmentSummary
  ) => void;
  submitAnswer: (value: string | number | boolean | string[]) => Promise<{
    finished: boolean;
    reportId?: string;
  }>;
  reset: () => void;
}

export const useAdaptiveSession = create<AdaptiveSessionState>((set, get) => ({
  sessionId: null,
  path: null,
  localMode: false,
  currentQuestion: null,
  profile: createEmptyProfile(),
  assessmentSummary: null,
  answers: [],
  questions: [],
  extraQuestions: [],
  questionNumber: 1,
  confidence: 0,
  finished: false,
  loading: false,
  generating: false,
  error: null,

  initSession: (sessionId, path, localMode, firstQuestion, profile, assessmentSummary) => {
    const enginePath = toEnginePath(path);
    const questions = getSeedQuestionsForPath(enginePath);
    const emptyProfile = profile ?? createEmptyProfile();
    const question =
      firstQuestion ?? selectFirstQuestion(questions, emptyProfile);

    set({
      sessionId,
      path: enginePath,
      localMode,
      currentQuestion: question,
      profile: emptyProfile,
      assessmentSummary: assessmentSummary ?? createEmptySummary(enginePath),
      answers: [],
      questions,
      extraQuestions: [],
      questionNumber: 1,
      confidence: emptyProfile.confidence_score,
      finished: false,
      loading: false,
      generating: false,
      error: null,
    });
  },

  submitAnswer: async (rawValue) => {
    const state = get();
    const {
      sessionId,
      currentQuestion,
      profile,
      assessmentSummary,
      answers,
      questions,
      extraQuestions,
      localMode,
      path,
    } = state;

    if (!sessionId || !currentQuestion || !path || !assessmentSummary) {
      return { finished: false };
    }

    set({ loading: true, error: null });
    const value = serializeAnswerValue(rawValue);

    try {
      if (!localMode) {
        const res = await fetch(`/api/session/${sessionId}/answer`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            question_id: currentQuestion.id,
            value: rawValue,
          }),
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error ?? "Failed to submit answer");
        }

        if (data.finished) {
          set({
            generating: true,
            loading: false,
            finished: true,
            assessmentSummary: data.assessment_summary ?? assessmentSummary,
          });
          const reportRes = await fetch(`/api/session/${sessionId}/report`);
          const reportData = await reportRes.json();
          if (!reportRes.ok) {
            throw new Error(reportData.error ?? "Failed to generate report");
          }
          set({ generating: false, loading: false });
          return { finished: true, reportId: reportData.reportId };
        }

        set({
          currentQuestion: data.question,
          profile: data.profile,
          assessmentSummary: data.assessment_summary ?? assessmentSummary,
          confidence: data.confidence,
          questionNumber: data.questionNumber,
          answers: [
            ...answers,
            {
              id: crypto.randomUUID(),
              session_id: sessionId,
              question_id: currentQuestion.id,
              value,
              score_deltas: data.score_deltas ?? {},
              is_uncertain: false,
              created_at: new Date().toISOString(),
            },
          ],
          loading: false,
        });
        return { finished: false };
      }

      const allQuestions = [...questions, ...extraQuestions];
      const result = await processAnswer({
        question: currentQuestion,
        value,
        profile,
        answers,
        questions: allQuestions,
        extraQuestions,
      });

      const updatedSummary = updateAssessmentSummary(
        assessmentSummary,
        currentQuestion,
        value,
        result.profile,
        result.score_deltas ?? {},
        result.newAnswer.is_uncertain
      );

      const nextExtra = result.extraQuestion
        ? [...extraQuestions, result.extraQuestion]
        : extraQuestions;

      if (result.finished) {
        set({
          generating: true,
          profile: result.profile,
          answers: [...answers, result.newAnswer],
          assessmentSummary: updatedSummary,
          confidence: result.profile.confidence_score,
          extraQuestions: nextExtra,
          loading: false,
          finished: true,
        });

        const finalized = finalizeAssessmentSummary(updatedSummary, result.profile);
        const reportRes = await fetch("/api/report/from-summary", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            path: fromEnginePath(path),
            summary: finalized,
          }),
        });
        const reportData = await reportRes.json();
        if (!reportRes.ok) {
          throw new Error(reportData.error ?? "Failed to generate report");
        }

        const reportId = crypto.randomUUID();
        const legacyAnswers = [...answers, result.newAnswer].map((a) => {
          const q = allQuestions.find((item) => item.id === a.question_id);
          const qType = q?.type ?? "single_select";
          const legacyType =
            qType === "slider"
              ? "scale"
              : qType === "multi_select"
                ? "multiple_choice"
                : "multiple_choice";
          return {
            questionId: a.question_id,
            questionText: q?.question_text ?? a.question_id,
            type: legacyType as import("@/types/questionnaire").QuestionType,
            value: a.value.raw as string | number | boolean,
          };
        });

        saveLocalReport({
          id: reportId,
          title: reportData.title ?? "Relationship Reflection",
          path: fromEnginePath(path),
          answers: legacyAnswers,
          analysis: reportData.analysis,
          assessment_summary: finalized,
        });

        set({ generating: false });
        return { finished: true, reportId };
      }

      set({
        currentQuestion: result.next_question,
        profile: result.profile,
        assessmentSummary: updatedSummary,
        answers: [...answers, result.newAnswer],
        confidence: result.profile.confidence_score,
        questionNumber: state.questionNumber + 1,
        extraQuestions: nextExtra,
        loading: false,
      });
      return { finished: false };
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : "Something went wrong",
        loading: false,
        generating: false,
      });
      return { finished: false };
    }
  },

  reset: () =>
    set({
      sessionId: null,
      path: null,
      localMode: false,
      currentQuestion: null,
      profile: createEmptyProfile(),
      assessmentSummary: null,
      answers: [],
      questions: [],
      extraQuestions: [],
      questionNumber: 1,
      confidence: 0,
      finished: false,
      loading: false,
      generating: false,
      error: null,
    }),
}));
