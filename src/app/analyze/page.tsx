"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { motion } from "framer-motion";
import { DisclaimerGuard } from "@/components/marketing/disclaimer-guard";
import { AppHeader } from "@/components/shared/app-header";
import { PageShell } from "@/components/shared/page-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ensureAuth } from "@/hooks/use-auth";
import { createLocalSession } from "@/lib/local-session";
import { Heart, Eye, Loader2 } from "lucide-react";
import type { AnalysisPath } from "@/types/questionnaire";

export default function AnalyzePage() {
  const router = useRouter();
  const [loading, setLoading] = useState<AnalysisPath | null>(null);

  async function startAnalysis(path: AnalysisPath) {
    setLoading(path);
    const localId = crypto.randomUUID();
    const auth = await ensureAuth();

    if (auth.ok) {
      try {
        const res = await fetch("/api/reports", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ path }),
        });
        if (res.ok) {
          const { sessionId } = await res.json();
          router.push(`/analyze/${sessionId}?path=${path}`);
          setLoading(null);
          return;
        }
      } catch {
        // Fall through to local session
      }
    }

    createLocalSession(localId, path);
    router.push(`/analyze/${localId}?path=${path}&local=1`);
    setLoading(null);
  }

  return (
    <DisclaimerGuard>
      <PageShell className="pb-16 pt-2">
        <AppHeader />
        <main className="py-10 sm:py-14">
          <Link href="/" className="text-label text-primary/70 hover:text-primary">
            ← Back
          </Link>

          <h1 className="text-heading-page mt-8">
            What&apos;s your <em className="text-display-accent">situation?</em>
          </h1>
          <p className="text-lead mt-4 max-w-xl">
            Choose the path that best describes you. Questions will adapt to your
            answer.
          </p>

          <div className="mt-10 grid gap-5 sm:grid-cols-2">
            <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.99 }}>
              <Card
                className="glass-card group h-full cursor-pointer transition-all hover:border-primary/35 hover:shadow-xl hover:shadow-primary/15"
                onClick={() => !loading && startAnalysis("i_like_someone")}
              >
                <CardHeader>
                  <span className="mb-3 flex size-11 items-center justify-center rounded-xl bg-primary/10">
                    <Heart className="size-5 text-primary" />
                  </span>
                  <CardTitle className="font-display text-xl font-bold">
                    Do I love someone?
                  </CardTitle>
                  <CardDescription className="text-base font-medium text-foreground/65">
                    Explore your own feelings — love, crush, admiration, or friendship
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    className="btn-cta text-btn-label rounded-full px-6"
                    disabled={!!loading}
                    onClick={(e) => {
                      e.stopPropagation();
                      startAnalysis("i_like_someone");
                    }}
                  >
                    {loading === "i_like_someone" ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      "Start"
                    )}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.99 }}>
              <Card
                className="glass-card group h-full cursor-pointer transition-all hover:border-primary/35 hover:shadow-xl hover:shadow-primary/15"
                onClick={() => !loading && startAnalysis("someone_likes_me")}
              >
                <CardHeader>
                  <span className="mb-3 flex size-11 items-center justify-center rounded-xl bg-primary/10">
                    <Eye className="size-5 text-primary" />
                  </span>
                  <CardTitle className="font-display text-xl font-bold">
                    Does someone love me?
                  </CardTitle>
                  <CardDescription className="text-base font-medium text-foreground/65">
                    Decode their signals, behavior, and emotional connection
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    className="btn-cta text-btn-label rounded-full px-6"
                    disabled={!!loading}
                    onClick={(e) => {
                      e.stopPropagation();
                      startAnalysis("someone_likes_me");
                    }}
                  >
                    {loading === "someone_likes_me" ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      "Start"
                    )}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          <p className="text-meta-footer mt-12 text-center">
            ~17 Questions · ~5 Minutes · Auto-saved
          </p>
        </main>
      </PageShell>
    </DisclaimerGuard>
  );
}
