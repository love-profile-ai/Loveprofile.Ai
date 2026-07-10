"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { DisclaimerGuard } from "@/components/marketing/disclaimer-guard";
import { AnalyzePathSection } from "@/components/marketing/analyze-path-section";
import { AppHeader } from "@/components/shared/app-header";
import { ensureAuth } from "@/hooks/use-auth";
import { createLocalSession } from "@/lib/local-session";
import type { AnalysisPath } from "@/types/questionnaire";

export default function AnalyzePage() {
  const router = useRouter();
  const [loading, setLoading] = useState<AnalysisPath | null>(null);

  async function startAnalysis(path: AnalysisPath) {
    setLoading(path);
    const auth = await ensureAuth();

    if (!auth.ok) {
      const localId = crypto.randomUUID();
      createLocalSession(localId, path);
      router.push(`/analyze/${localId}?path=${path}&local=1`);
      setLoading(null);
      return;
    }

    try {
      const res = await fetch("/api/session/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path }),
      });
      if (res.ok) {
        const data = await res.json();
        sessionStorage.setItem(
          `adaptive-bootstrap:${data.sessionId}`,
          JSON.stringify({
            question: data.question,
            profile: data.profile,
            assessment_summary: data.assessment_summary,
          })
        );
        router.push(`/analyze/${data.sessionId}?path=${path}`);
        setLoading(null);
        return;
      }
    } catch {
      // Fall through to local session
    }

    const localId = crypto.randomUUID();
    createLocalSession(localId, path);
    router.push(`/analyze/${localId}?path=${path}&local=1`);
    setLoading(null);
  }

  return (
    <DisclaimerGuard>
      <div className="landing-canvas relative min-h-screen overflow-hidden">
        <div className="dot-grid pointer-events-none absolute inset-0 -z-10" />
        <div className="page-glow pointer-events-none absolute inset-0 -z-10" />
        <div className="mx-auto w-full max-w-5xl px-4 sm:px-6">
          <AppHeader />
        </div>
        <AnalyzePathSection loading={loading} onStart={startAnalysis} />
      </div>
    </DisclaimerGuard>
  );
}
