"use client";

import dynamic from "next/dynamic";
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
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import type { AnalysisPath } from "@/types/questionnaire";
import type { Question, UserProfile, AssessmentSummary } from "@/types/adaptive-engine";
import { ChevronLeft, Loader2 } from "lucide-react";

const NilaOrb = dynamic(
  () => import("@/components/marketing/nila-orb").then((m) => m.NilaOrb),
  { ssr: false, loading: () => <div className="size-32 rounded-full bg-primary/10 animate-pulse-soft" /> }
);

const INSIGHT_MESSAGES = [
  "Finding emotional consistency…",
  "Comparing communication patterns…",
  "Mapping trust and closeness…",
  "Weaving your reflection together…",
  "Preparing your personalized report…",
];

interface AdaptiveQuestionEngineProps {
  sessionId: string;
  path: AnalysisPath;
  localMode?: boolean;
  initialQuestion?: Question;
  initialProfile?: UserProfile;
  initialSummary?: AssessmentSummary;
}

function GeneratingReportScreen({
  confidence,
  dimensionCoverage,
}: {
  confidence: number;
  dimensionCoverage: number;
}) {
  const reduced = useReducedMotion();
  const [msgIndex, setMsgIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (reduced) return;
    const msgTimer = setInterval(() => {
      setMsgIndex((i) => (i + 1) % INSIGHT_MESSAGES.length);
    }, 2800);
    const progTimer = setInterval(() => {
      setProgress((p) => Math.min(p + 2, 92));
    }, 120);
    return () => {
      clearInterval(msgTimer);
      clearInterval(progTimer);
    };
  }, [reduced]);

  return (
    <div className="flex flex-col items-center justify-center py-24 text-center sm:py-32">
      <div className="relative size-48 sm:size-56">
        <NilaOrb className="absolute inset-0 h-full w-full" />
      </div>

      <p className="text-label mt-10">Anticipation</p>
      <h2 className="font-display mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
        Building your report
      </h2>

      <AnimatePresence mode="wait">
        <motion.p
          key={msgIndex}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.4 }}
          className="text-lead mt-4 max-w-sm text-foreground/65"
        >
          {INSIGHT_MESSAGES[msgIndex]}
        </motion.p>
      </AnimatePresence>

      <div className="mt-8 w-full max-w-xs">
        <div className="h-1.5 overflow-hidden rounded-full bg-primary/12">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-primary via-lavender to-coral"
            style={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
        <p className="mt-3 text-xs font-semibold text-foreground/42">
          {Math.round(confidence)}% confidence · {dimensionCoverage} dimensions mapped
        </p>
        <p className="mt-1 text-xs font-medium text-foreground/38">
          Usually under a minute
        </p>
      </div>
    </div>
  );
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
    status,
    error,
    reportId,
  } = useAdaptiveSession();

  useEffect(() => {
    initSession(sessionId, path, localMode, initialQuestion, initialProfile, initialSummary);
  }, [sessionId, path, localMode, initialQuestion, initialProfile, initialSummary, initSession]);

  useEffect(() => {
    setCurrentValue(undefined);
  }, [currentQuestion?.id]);

  useEffect(() => {
    if (status === "done" && reportId) {
      router.push(
        localMode ? `/report/local/${reportId}` : `/report/${reportId}`
      );
    }
  }, [status, reportId, localMode, router]);

  async function handleContinue() {
    if (!currentQuestion || !isAdaptiveAnswerValid(currentQuestion, currentValue)) {
      return;
    }
    await submitAnswer(currentValue!);
  }

  if (status === "generating-report" || status === "done") {
    return (
      <GeneratingReportScreen
        confidence={confidence}
        dimensionCoverage={Object.keys(profile.dimension_certainty).length}
      />
    );
  }

  if (!currentQuestion) return null;

  const canContinue = isAdaptiveAnswerValid(currentQuestion, currentValue);
  const isSubmitting = status === "submitting";

  return (
    <div className="mx-auto mt-6 max-w-2xl px-1 sm:mt-10">
      <AdaptiveProgressBar
        questionNumber={questionNumber}
        confidence={confidence}
        dimensionCoverage={Object.keys(profile.dimension_certainty).length}
      />

      <AnimatePresence mode="wait">
        <motion.div
          key={currentQuestion.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -16 }}
          transition={{ duration: 0.38, ease: "easeOut" }}
          className="mt-10"
        >
          <p className="text-label">
            Reflection {questionNumber}
            {currentQuestion.is_clarification ? " · Clarifying" : ""}
          </p>
          <h2 className="text-question mt-4">{currentQuestion.question_text}</h2>

          <div className="mt-8">
            <AdaptiveQuestionInput
              question={currentQuestion}
              value={currentValue}
              onChange={setCurrentValue}
            />
          </div>

          {!canContinue && (
            <p className="mt-5 rounded-3xl border border-primary/12 bg-primary/6 px-5 py-4 text-sm font-semibold text-foreground/65">
              Choose an answer — the next question adapts to what you share.
            </p>
          )}

          {error && (
            <p className="mt-4 rounded-3xl border border-destructive/20 bg-destructive/8 px-5 py-4 text-sm font-semibold text-destructive">
              {error}
            </p>
          )}

          <div className="mt-10 flex items-center justify-between gap-4">
            <Button
              variant="ghost"
              size="lg"
              className="rounded-full text-foreground/50"
              disabled
            >
              <ChevronLeft className="mr-1 size-4" />
              Previous
            </Button>
            <Button
              size="lg"
              className="btn-cta h-14 rounded-full px-10"
              disabled={!canContinue || isSubmitting}
              onClick={handleContinue}
            >
              {isSubmitting ? (
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
