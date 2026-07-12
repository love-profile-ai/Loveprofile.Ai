"use client";

import { create } from "zustand";
import type {
  AssessmentSummary,
  AssessmentPhase,
  EnginePath,
  Question,
  SessionAnswerRecord,
  UserProfile,
} from "@/types/adaptive-engine";
import { createEmptyProfile } from "@/lib/engine/profile-utils";
import { getSeedQuestionsForPath } from "@/lib/engine/seed-questions";
import { processAnswer, serializeAnswerValue } from "@/lib/engine/runner";
import {
  getAssessmentPhase,
  getFirstFoundationQuestion,
  getAdaptiveQuestionAfterFoundation,
  getFoundationQuestions,
  isFoundationQuestionId,
  processFoundationAnswer,
} from "@/lib/engine/foundation-phase";
import {
  createEmptySummary,
  updateAssessmentSummary,
  finalizeAssessmentSummary,
} from "@/lib/engine/assessment-summary";
import { fromEnginePath, toEnginePath } from "@/lib/engine/map-path";
import type { AnalysisPath } from "@/types/questionnaire";
import { saveLocalReport } from "@/lib/local-report";

function toLegacyAnswers(
  path: EnginePath,
  records: SessionAnswerRecord[],
  adaptiveQuestions: Question[]
) {
  const lookup = new Map<string, Question>();
  for (const q of getFoundationQuestions(path)) lookup.set(q.id, q);
  for (const q of adaptiveQuestions) lookup.set(q.id, q);

  return records.map((a) => {
    const q = lookup.get(a.question_id);
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
}

/** Single source of truth for what's on screen — prevents out-of-sync flags. */
export type AssessmentStatus =
  | "asking"
  | "submitting"
  | "generating-report"
  | "done";

interface AdaptiveSessionState {
  sessionId: string | null;
  path: EnginePath | null;
  localMode: boolean;
  status: AssessmentStatus;
  currentQuestion: Question | null;
  profile: UserProfile;
  assessmentSummary: AssessmentSummary | null;
  answers: SessionAnswerRecord[];
  questions: Question[];
  extraQuestions: Question[];
  questionNumber: number;
  confidence: number;
  phase: AssessmentPhase;
  error: string | null;
  reportId: string | null;

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
  status: "asking",
  currentQuestion: null,
  profile: createEmptyProfile(),
  assessmentSummary: null,
  answers: [],
  questions: [],
  extraQuestions: [],
  questionNumber: 1,
  confidence: 0,
  phase: "foundation",
  error: null,
  reportId: null,

  initSession: (sessionId, path, localMode, firstQuestion, profile, assessmentSummary) => {
    const enginePath = toEnginePath(path);
    const emptyProfile = profile ?? createEmptyProfile();
    const question =
      firstQuestion ?? getFirstFoundationQuestion(enginePath);

    if (localMode) {
      const localQuestions = getSeedQuestionsForPath(enginePath);
      console.warn(
        `WARNING: Local mode uses bundled seed questions (${localQuestions.length} for ${enginePath}).`
      );
      set({
        sessionId,
        path: enginePath,
        localMode,
        status: "asking",
        currentQuestion: question,
        profile: emptyProfile,
        assessmentSummary: assessmentSummary ?? createEmptySummary(enginePath),
        answers: [],
        questions: localQuestions,
        extraQuestions: [],
        questionNumber: 1,
        confidence: emptyProfile.confidence_score,
        phase: getAssessmentPhase(emptyProfile, enginePath),
        error: null,
        reportId: null,
      });
      return;
    }

    set({
      sessionId,
      path: enginePath,
      localMode,
      status: "asking",
      currentQuestion: question,
      profile: emptyProfile,
      assessmentSummary: assessmentSummary ?? createEmptySummary(enginePath),
      answers: [],
      questions: [],
      extraQuestions: [],
      questionNumber: 1,
      confidence: emptyProfile.confidence_score,
      phase: getAssessmentPhase(emptyProfile, enginePath),
      error: null,
      reportId: null,
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
      status,
    } = state;

    if (
      !sessionId ||
      !currentQuestion ||
      !path ||
      !assessmentSummary ||
      status !== "asking"
    ) {
      return { finished: false };
    }

    // Enter submitting — question stays visible but button disabled
    set({ status: "submitting", error: null });
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

        const newAnswer: SessionAnswerRecord = {
          id: crypto.randomUUID(),
          session_id: sessionId,
          question_id: currentQuestion.id,
          value,
          score_deltas: data.scoreDeltas ?? {},
          is_uncertain: false,
          created_at: new Date().toISOString(),
        };

        if (data.finished) {
          // Finished: jump straight to generating-report — never update currentQuestion
          set({
            status: "generating-report",
            profile: data.profile,
            assessmentSummary: data.assessmentSummary ?? assessmentSummary,
            confidence: data.confidence,
            questionNumber: data.questionNumber,
            phase: data.phase ?? "adaptive",
            answers: [...answers, newAnswer],
            // currentQuestion intentionally left as-is; UI won't render it
          });

          const reportRes = await fetch(`/api/session/${sessionId}/report`);
          const reportData = await reportRes.json();
          if (!reportRes.ok) {
            throw new Error(reportData.error ?? "Failed to generate report");
          }

          set({ status: "done", reportId: reportData.reportId });
          return { finished: true, reportId: reportData.reportId };
        }

        // Continue: only now advance to the next question
        set({
          status: "asking",
          currentQuestion: data.nextQuestion,
          profile: data.profile,
          assessmentSummary: data.assessmentSummary ?? assessmentSummary,
          confidence: data.confidence,
          questionNumber: data.questionNumber,
          phase: data.phase ?? "adaptive",
          answers: [...answers, newAnswer],
        });
        return { finished: false };
      }

      // Local mode
      const allQuestions = [...questions, ...extraQuestions];

      if (isFoundationQuestionId(currentQuestion.id)) {
        const foundationResult = processFoundationAnswer({
          path,
          question: currentQuestion,
          value,
          profile,
          answers,
        });

        const updatedSummary = updateAssessmentSummary(
          assessmentSummary,
          currentQuestion,
          value,
          foundationResult.profile,
          foundationResult.score_deltas,
          foundationResult.newAnswer.is_uncertain
        );

        const updatedAnswers = [...answers, foundationResult.newAnswer];

        if (
          !foundationResult.foundationComplete &&
          foundationResult.nextFoundationQuestion
        ) {
          set({
            status: "asking",
            currentQuestion: foundationResult.nextFoundationQuestion,
            profile: foundationResult.profile,
            assessmentSummary: updatedSummary,
            answers: updatedAnswers,
            confidence: foundationResult.profile.confidence_score,
            questionNumber: state.questionNumber + 1,
            phase: "foundation",
          });
          return { finished: false };
        }

        const transition = await getAdaptiveQuestionAfterFoundation({
          profile: foundationResult.profile,
          answers: updatedAnswers,
          questions: allQuestions,
        });

        if (transition.finished || !transition.nextQuestion) {
          set({
            status: "generating-report",
            profile: foundationResult.profile,
            answers: updatedAnswers,
            assessmentSummary: updatedSummary,
            confidence: foundationResult.profile.confidence_score,
            phase: "adaptive",
          });

          const finalized = finalizeAssessmentSummary(
            updatedSummary,
            foundationResult.profile
          );
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
          saveLocalReport({
            id: reportId,
            title: reportData.title ?? "Relationship Reflection",
            path: fromEnginePath(path),
            answers: toLegacyAnswers(path, updatedAnswers, allQuestions),
            analysis: reportData.analysis,
            assessment_summary: finalized,
          });

          set({ status: "done", reportId });
          return { finished: true, reportId };
        }

        set({
          status: "asking",
          currentQuestion: transition.nextQuestion,
          profile: foundationResult.profile,
          assessmentSummary: updatedSummary,
          answers: updatedAnswers,
          confidence: foundationResult.profile.confidence_score,
          questionNumber: state.questionNumber + 1,
          phase: "adaptive",
        });
        return { finished: false };
      }

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
          status: "generating-report",
          profile: result.profile,
          answers: [...answers, result.newAnswer],
          assessmentSummary: updatedSummary,
          confidence: result.profile.confidence_score,
          extraQuestions: nextExtra,
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
        const legacyAnswers = toLegacyAnswers(
          path,
          [...answers, result.newAnswer],
          allQuestions
        );

        saveLocalReport({
          id: reportId,
          title: reportData.title ?? "Relationship Reflection",
          path: fromEnginePath(path),
          answers: legacyAnswers,
          analysis: reportData.analysis,
          assessment_summary: finalized,
        });

        set({ status: "done", reportId });
        return { finished: true, reportId };
      }

      set({
        status: "asking",
        currentQuestion: result.next_question,
        profile: result.profile,
        assessmentSummary: updatedSummary,
        answers: [...answers, result.newAnswer],
        confidence: result.profile.confidence_score,
        questionNumber: state.questionNumber + 1,
        phase: "adaptive",
        extraQuestions: nextExtra,
      });
      return { finished: false };
    } catch (err) {
      set({
        status: "asking",
        error: err instanceof Error ? err.message : "Something went wrong",
      });
      return { finished: false };
    }
  },

  reset: () =>
    set({
      sessionId: null,
      path: null,
      localMode: false,
      status: "asking",
      currentQuestion: null,
      profile: createEmptyProfile(),
      assessmentSummary: null,
      answers: [],
      questions: [],
      extraQuestions: [],
      questionNumber: 1,
      confidence: 0,
      phase: "foundation",
      error: null,
      reportId: null,
    }),
}));
