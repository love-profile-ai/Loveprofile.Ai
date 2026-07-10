"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  AdaptiveQuestionInput,
  isAdaptiveAnswerValid,
} from "@/components/questionnaire/adaptive-question-input";
import { AdaptiveProgressBar } from "@/components/questionnaire/adaptive-progress-bar";
import { useAdaptiveSession } from "@/stores/adaptive-session";
import type { AnalysisPath } from "@/types/questionnaire";
import type { Question, UserProfile, AssessmentSummary } from "@/types/adaptive-engine";
import { Loader2 } from "lucide-react";

interface AdaptiveQuestionEngineProps {
  sessionId: string;
  path: AnalysisPath;
  localMode?: boolean;
  initialQuestion?: Question;
  initialProfile?: UserProfile;
  initialSummary?: AssessmentSummary;
}

export function AdaptiveQuestionEngine({
  sessionId,
  path,
  localMode = false,
  initialQuestion,
  initialProfile,
  initialSummary,
}: AdaptiveQuestionEngineProps) {
  const router = useRouter();
  const [currentValue, setCurrentValue] = useState<
    string | number | string[] | undefined
  >();

  const {
    initSession,
    submitAnswer,
    currentQuestion,
    profile,
    confidence,
    questionNumber,
    loading,
    generating,
    error,
  } = useAdaptiveSession();

  useEffect(() => {
    initSession(sessionId, path, localMode, initialQuestion, initialProfile, initialSummary);
  }, [sessionId, path, localMode, initialQuestion, initialProfile, initialSummary, initSession]);

  useEffect(() => {
    setCurrentValue(undefined);
  }, [currentQuestion?.id]);

  async function handleContinue() {
    if (!currentQuestion || !isAdaptiveAnswerValid(currentQuestion, currentValue)) {
      return;
    }

    const result = await submitAnswer(currentValue!);
    if (result.finished && result.reportId) {
      router.push(
        localMode
          ? `/report/local/${result.reportId}`
          : `/report/${result.reportId}`
      );
    }
  }

  if (generating) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center">
        <div className="relative mb-8 flex size-24 items-center justify-center rounded-full border border-primary/15 bg-white/55 shadow-2xl shadow-primary/15 backdrop-blur-2xl dark:bg-white/[0.06]">
          <div className="absolute inset-0 animate-ping rounded-full bg-primary/10" />
          <Loader2 className="relative size-9 animate-spin text-primary" />
        </div>
        <h2 className="font-display text-3xl font-semibold tracking-[-0.02em]">
          Generating your report...
        </h2>
        <p className="text-lead mt-4 max-w-md">
          The engine reached {Math.round(confidence)}% confidence. Building your
          personalized reflection now.
        </p>
      </div>
    );
  }

  if (!currentQuestion) return null;

  const canContinue = isAdaptiveAnswerValid(currentQuestion, currentValue);

  return (
    <div className="mx-auto mt-8 max-w-3xl">
      <AdaptiveProgressBar
        questionNumber={questionNumber}
        confidence={confidence}
        dimensionCoverage={Object.keys(profile.dimension_certainty).length}
      />

      <AnimatePresence mode="wait">
        <motion.div
          key={currentQuestion.id}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.32, ease: "easeOut" }}
          className="mt-10"
        >
          <p className="text-label">
            Question {questionNumber}
            {currentQuestion.is_clarification ? " · Clarifying" : ""}
          </p>
          <h2 className="text-question mt-3">{currentQuestion.question_text}</h2>

          <div className="premium-card mt-8 p-4 sm:p-6">
            <AdaptiveQuestionInput
              question={currentQuestion}
              value={currentValue}
              onChange={setCurrentValue}
            />
          </div>

          {!canContinue && (
            <p className="mt-4 rounded-2xl border border-primary/12 bg-primary/7 px-4 py-3 text-sm font-semibold text-primary/80">
              Please answer before continuing — the next question adapts to what
              you share.
            </p>
          )}

          {error && (
            <p className="mt-4 rounded-2xl border border-destructive/20 bg-destructive/8 px-4 py-3 text-sm font-semibold text-destructive">
              {error}
            </p>
          )}

          <div className="mt-8 flex justify-end">
            <Button
              size="lg"
              className="btn-cta px-8"
              disabled={!canContinue || loading}
              onClick={handleContinue}
            >
              {loading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                "Continue"
              )}
            </Button>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
