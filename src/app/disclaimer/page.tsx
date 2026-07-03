"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AuthGuard } from "@/components/auth/auth-guard";
import { DisclaimerCard } from "@/components/marketing/disclaimer-card";
import { LandingNavbar } from "@/components/marketing/landing-navbar";
import { hasAcceptedDisclaimer } from "@/lib/disclaimer";

export default function DisclaimerPage() {
  const router = useRouter();

  useEffect(() => {
    if (hasAcceptedDisclaimer()) {
      router.replace("/analyze");
    }
  }, [router]);

  return (
    <AuthGuard redirectTo="/login?next=/disclaimer">
      <div className="landing-canvas relative min-h-screen overflow-hidden">
        <div className="dot-grid pointer-events-none absolute inset-0 -z-10" />
        <div className="page-glow pointer-events-none absolute inset-0 -z-10" />

        <div className="relative mx-auto w-full max-w-6xl px-4 sm:px-6">
          <LandingNavbar />

          <section className="flex min-h-[calc(100vh-5rem)] flex-col items-center justify-center py-12">
            <div className="flex w-full max-w-xl flex-col items-center text-center">
              <h1 className="text-heading-page">
                Before you <em className="text-display-accent">begin</em>
              </h1>
              <p className="text-lead mt-4 max-w-md">
                Please read and accept the disclaimer to continue your assessment.
              </p>
              <div className="mt-8 w-full">
                <DisclaimerCard continueHref="/analyze" />
              </div>
            </div>
          </section>
        </div>
      </div>
    </AuthGuard>
  );
}
