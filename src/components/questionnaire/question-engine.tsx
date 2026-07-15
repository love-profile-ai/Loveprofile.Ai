"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ProgressBar } from "@/components/questionnaire/progress-bar";
import {
  QuestionInput,
  isAnswerValid,
} from "@/components/questionnaire/question-input";
import {
  buildAnswer,
  getFirstQuestion,
  getNextQuestionId,
  getProgress,
  getQuestion,
  isComplete,
} from "@/lib/questionnaire/engine";
import { ensureAuth } from "@/hooks/use-auth";
import { getLocalSession, saveLocalSession } from "@/lib/local-session";
import type { AnalysisPath, Answer } from "@/types/questionnaire";
import { Loader2 } from "lucide-react";

interface QuestionEngineProps {
  sessionId: string;
  path: AnalysisPath;
  initialAnswers?: Answer[];
  initialQuestionId?: string;
  localMode?: boolean;
}

export function QuestionEngine({
  sessionId,
  path,
  initialAnswers = [],
  initialQuestionId,
  localMode = false,
}: QuestionEngineProps) {
  const router = useRouter();
  const [answers, setAnswers] = useState<Answer[]>(initialAnswers);
  const [currentId, setCurrentId] = useState(
    initialQuestionId ?? getFirstQuestion(path).id
  );
  const [currentValue, setCurrentValue] = useState<
    string | number | boolean | undefined
  >();
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const question = getQuestion(path, currentId);
  const progress = getProgress(path, currentId);
  const canContinue = question ? isAnswerValid(question, currentValue) : false;

  function resetForQuestion(questionId: string, updatedAnswers: Answer[]) {
    const existing = updatedAnswers.find((a) => a.questionId === questionId);
    setCurrentValue(existing?.value);
  }

  const saveProgress = useCallback(
    async (updatedAnswers: Answer[], nextQuestionId: string | null) => {
      if (localMode) {
        const existing = getLocalSession(sessionId);
        saveLocalSession({
          id: sessionId,
          path,
          answers: updatedAnswers,
          current_question_id: nextQuestionId,
        });
        return;
      }

      const res = await fetch(`/api/sessions/${sessionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          current_question_id: nextQuestionId,
          answers: updatedAnswers,
        }),
      });

      if (!res.ok) {
        saveLocalSession({
          id: sessionId,
          path,
          answers: updatedAnswers,
          current_question_id: nextQuestionId,
        });
      }
    },
    [sessionId, path, localMode]
  );

  useEffect(() => {
    resetForQuestion(currentId, answers);
  }, [currentId, answers]);

  async function handleContinue() {
    if (!question || !isAnswerValid(question, currentValue)) return;

    setLoading(true);
    setError(null);

    const answer = buildAnswer(path, currentId, currentValue!);
    const updatedAnswers = [
      ...answers.filter((a) => a.questionId !== currentId),
      answer,
    ];
    setAnswers(updatedAnswers);

    if (isComplete(path, currentId, currentValue!)) {
      setAnalyzing(true);
      try {
        const auth = await ensureAuth();

        if (!auth.ok) {
          router.push(`/login?next=${encodeURIComponent(window.location.pathname + window.location.search)}`);
          setAnalyzing(false);
          setLoading(false);
          return;
        }

        const res = await fetch("/api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId,
            path,
            answers: updatedAnswers,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          router.push(`/report/${data.reportId}`);
          return;
        }

        if (res.status === 429) {
          const data = await res.json().catch(() => ({}));
          throw new Error(
            (data as { error?: string }).error ?? "Too many requests. Try again later."
          );
        }

        const data = await res.json().catch(() => ({}));
        throw new Error(
          (data as { error?: string }).error ?? "Analysis failed. Please try again."
        );
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
        setAnalyzing(false);
      } finally {
        setLoading(false);
      }
      return;
    }

    const nextId = getNextQuestionId(path, currentId, currentValue!);
    if (nextId) {
      setCurrentId(nextId);
      resetForQuestion(nextId, updatedAnswers);
      await saveProgress(updatedAnswers, nextId);
    }
    setLoading(false);
  }

  if (analyzing) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center">
        <div className="relative mb-8 flex size-24 items-center justify-center rounded-full border border-primary/15 bg-white/55 shadow-2xl shadow-primary/15 backdrop-blur-2xl dark:bg-white/[0.06]">
          <div className="absolute inset-0 animate-ping rounded-full bg-primary/10" />
          <Loader2 className="relative size-9 animate-spin text-primary" />
        </div>
        <h2 className="font-display text-3xl font-semibold tracking-[-0.02em]">
          Analyzing your responses
        </h2>
        <p className="text-lead mt-4 max-w-md">
          Reading your answers and building your personalized report.
        </p>
      </div>
    );
  }

  if (!question) return null;

  return (
    <div className="mx-auto mt-8 max-w-3xl">
      <ProgressBar current={progress.current} total={progress.total} />

      <AnimatePresence mode="wait">
        <motion.div
          key={currentId}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.32, ease: "easeOut" }}
          className="mt-10"
        >
          <p className="text-label">Question {progress.current}</p>
          <h2 className="text-question mt-3">{question.text}</h2>

          <div className="premium-card mt-8 p-4 sm:p-6">
            <QuestionInput
              key={currentId}
              question={question}
              value={currentValue}
              onChange={setCurrentValue}
            />
          </div>

          {!canContinue && (
            <p className="mt-4 rounded-2xl border border-primary/12 bg-primary/7 px-4 py-3 text-sm font-semibold text-primary/80">
              Please select an answer before continuing.
            </p>
          )}

          {error && (
            <p className="mt-4 rounded-2xl border border-destructive/20 bg-destructive/8 px-4 py-3 text-sm font-semibold text-destructive">{error}</p>
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
              ) : isComplete(path, currentId, currentValue!) ? (
                "Generate Report"
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
