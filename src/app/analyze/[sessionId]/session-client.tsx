"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { use, useEffect, useState } from "react";
import { AuthGuard } from "@/components/auth/auth-guard";
import { DisclaimerGuard } from "@/components/marketing/disclaimer-guard";
import { AdaptiveQuestionEngine } from "@/components/questionnaire/adaptive-question-engine";
import { AppHeader } from "@/components/shared/app-header";
import { PageShell } from "@/components/shared/page-shell";
import { Skeleton } from "@/components/ui/skeleton";
import type { AnalysisPath } from "@/types/questionnaire";
import type { Question, UserProfile, AssessmentSummary } from "@/types/adaptive-engine";

const BOOTSTRAP_PREFIX = "adaptive-bootstrap:";

export default function SessionPageClient({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  return (
    <AuthGuard redirectTo="/login">
      <SessionContent params={params} />
    </AuthGuard>
  );
}

function SessionContent({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const path = searchParams.get("path") as AnalysisPath;
  const isLocal = searchParams.get("local") === "1";

  const [ready, setReady] = useState(false);
  const [bootstrap, setBootstrap] = useState<{
    question?: Question;
    profile?: UserProfile;
    assessment_summary?: AssessmentSummary;
  }>({});

  useEffect(() => {
    if (isLocal) {
      router.replace("/login?next=%2Fanalyze");
      return;
    }

    const raw = sessionStorage.getItem(`${BOOTSTRAP_PREFIX}${sessionId}`);
    if (raw) {
      try {
        setBootstrap(JSON.parse(raw));
      } catch {
        setBootstrap({});
      }
      sessionStorage.removeItem(`${BOOTSTRAP_PREFIX}${sessionId}`);
    }
    setReady(true);
  }, [sessionId, isLocal, router]);

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
      <PageShell className="pb-16 pt-2" dotGrid={false}>
        <AppHeader />
        <main className="py-6 sm:py-10">
          <Link
            href="/analyze"
            className="text-label text-primary/70 hover:text-primary"
          >
            ← Back
          </Link>

          {!ready ? (
            <div className="mt-8 space-y-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-12 w-3/4" />
              <Skeleton className="glass-card h-32 w-full" />
            </div>
          ) : (
            <AdaptiveQuestionEngine
              sessionId={sessionId}
              path={path}
              localMode={false}
              initialQuestion={bootstrap.question}
              initialProfile={bootstrap.profile}
              initialSummary={bootstrap.assessment_summary}
            />
          )}
        </main>
      </PageShell>
    </DisclaimerGuard>
  );
}
