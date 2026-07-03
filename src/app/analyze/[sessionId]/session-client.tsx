"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { use, useEffect, useState } from "react";
import { DisclaimerGuard } from "@/components/marketing/disclaimer-guard";
import { QuestionEngine } from "@/components/questionnaire/question-engine";
import { AppHeader } from "@/components/shared/app-header";
import { PageShell } from "@/components/shared/page-shell";
import { Skeleton } from "@/components/ui/skeleton";
import { getLocalSession } from "@/lib/local-session";
import type { AnalysisPath, Answer } from "@/types/questionnaire";

export default function SessionPageClient({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = use(params);
  const searchParams = useSearchParams();
  const path = searchParams.get("path") as AnalysisPath;
  const isLocal = searchParams.get("local") === "1";

  const [session, setSession] = useState<{
    answers: Answer[];
    current_question_id: string | null;
  } | null>(null);

  useEffect(() => {
    if (isLocal) {
      const local = getLocalSession(sessionId);
      if (local) {
        setSession({
          answers: local.answers,
          current_question_id: local.current_question_id,
        });
      } else {
        setSession({ answers: [], current_question_id: null });
      }
      return;
    }

    fetch(`/api/sessions/${sessionId}`)
      .then((r) => {
        if (!r.ok) throw new Error("Not found");
        return r.json();
      })
      .then(setSession)
      .catch(() => {
        const local = getLocalSession(sessionId);
        setSession(
          local
            ? {
                answers: local.answers,
                current_question_id: local.current_question_id,
              }
            : { answers: [], current_question_id: null }
        );
      });
  }, [sessionId, isLocal]);

  if (!path) {
    return (
      <PageShell className="flex min-h-screen items-center justify-center">
        <p className="font-medium">
          Invalid session.{" "}
          <Link href="/analyze" className="text-primary hover:underline">
            Start over
          </Link>
        </p>
      </PageShell>
    );
  }

  return (
    <DisclaimerGuard>
      <PageShell className="pb-16 pt-2">
        <AppHeader />
        <main className="py-6 sm:py-10">
          <Link href="/analyze" className="text-label text-primary/70 hover:text-primary">
            ← Back
          </Link>

          {!session ? (
            <div className="mt-8 space-y-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-12 w-3/4" />
              <Skeleton className="glass-card h-32 w-full" />
            </div>
          ) : (
            <QuestionEngine
              sessionId={sessionId}
              path={path}
              initialAnswers={session.answers}
              initialQuestionId={session.current_question_id ?? undefined}
              localMode={isLocal || !!getLocalSession(sessionId)}
            />
          )}
        </main>
      </PageShell>
    </DisclaimerGuard>
  );
}
