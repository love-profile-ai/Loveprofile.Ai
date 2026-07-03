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
import { saveLocalReport } from "@/lib/local-report";
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

        if (auth.ok) {
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
        }

        const localRes = await fetch("/api/analyze/local", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId,
            path,
            answers: updatedAnswers,
          }),
        });

        if (!localRes.ok) {
          const data = await localRes.json().catch(() => ({}));
          throw new Error(
            (data as { error?: string }).error ??
              (auth.ok
                ? "Analysis failed."
                : `${auth.error} Could not generate a report.`)
          );
        }

        const { analysis } = await localRes.json();
        const reportId = crypto.randomUUID();
        saveLocalReport({
          id: reportId,
          title: "Relationship Analysis",
          path,
          answers: updatedAnswers,
          analysis,
        });
        router.push(`/report/local/${reportId}`);
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
        <Loader2 className="mb-4 size-10 animate-spin text-primary" />
        <h2 className="font-display text-2xl font-bold">Analyzing your responses</h2>
        <p className="text-lead mt-3 max-w-md">
          Reading your answers and building your personalized report.
        </p>
      </div>
    );
  }

  if (!question) return null;

  return (
    <div className="mt-8">
      <ProgressBar current={progress.current} total={progress.total} />

      <AnimatePresence mode="wait">
        <motion.div
          key={currentId}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.25 }}
          className="mt-10"
        >
          <h2 className="text-question">
            {question.text}
          </h2>

          <div className="mt-8 glass-card p-5 sm:p-6">
            <QuestionInput
              key={currentId}
              question={question}
              value={currentValue}
              onChange={setCurrentValue}
            />
          </div>

          {!canContinue && (
            <p className="mt-4 text-sm font-medium text-primary/70">
              Please select an answer before continuing.
            </p>
          )}

          {error && (
            <p className="mt-4 text-sm text-destructive">{error}</p>
          )}

          <div className="mt-8 flex justify-end">
            <Button
              size="lg"
              className="btn-cta text-btn-label rounded-full px-8 tracking-wide"
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
