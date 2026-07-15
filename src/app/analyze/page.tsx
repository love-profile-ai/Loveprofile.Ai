"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { AuthGuard } from "@/components/auth/auth-guard";
import { DisclaimerGuard } from "@/components/marketing/disclaimer-guard";
import { AnalyzePathSection } from "@/components/marketing/analyze-path-section";
import { AppHeader } from "@/components/shared/app-header";
import { ensureAuth } from "@/hooks/use-auth";
import type { AnalysisPath } from "@/types/questionnaire";

function AnalyzeContent() {
  const router = useRouter();
  const [loading, setLoading] = useState<AnalysisPath | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function startAnalysis(path: AnalysisPath) {
    setLoading(path);
    setError(null);
    const auth = await ensureAuth();

    if (!auth.ok) {
      router.push(`/login?next=${encodeURIComponent("/analyze")}`);
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

      const data = (await res.json().catch(() => ({}))) as { error?: string };
      setError(data.error ?? "Could not start your session. Please try again.");
    } catch {
      setError("Could not start your session. Please try again.");
    }

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
        {error && (
          <div className="mx-auto max-w-5xl px-4 sm:px-6">
            <p className="mt-4 rounded-2xl border border-destructive/25 bg-destructive/8 px-4 py-3 text-sm font-semibold text-destructive">
              {error}
            </p>
          </div>
        )}
        <AnalyzePathSection loading={loading} onStart={startAnalysis} />
      </div>
    </DisclaimerGuard>
  );
}

export default function AnalyzePage() {
  return (
    <AuthGuard redirectTo="/login">
      <AnalyzeContent />
    </AuthGuard>
  );
}
