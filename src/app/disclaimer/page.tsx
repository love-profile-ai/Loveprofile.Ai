"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
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
    <div className="landing-canvas">
      <div className="dot-grid pointer-events-none absolute inset-0 -z-10" />
      <div className="page-glow pointer-events-none absolute inset-0 -z-10" />

      <LandingNavbar />

      <div className="relative mx-auto w-full max-w-6xl px-4 sm:px-6">
        <section className="grid min-h-[calc(100vh-7rem)] items-center gap-10 py-12 lg:grid-cols-[0.85fr_1.15fr]">
          <div className="max-w-xl text-center lg:text-left">
            <p className="text-label">Step one</p>
            <h1 className="text-heading-page">
              A calm boundary before your <em className="text-display-accent">reflection.</em>
            </h1>
            <p className="text-lead mt-5">
              Signal is designed for thoughtful self-reflection. Read the short
              note, acknowledge it, and then begin your private assessment.
            </p>
            <div className="mt-8 grid gap-3 text-sm font-semibold text-foreground/62 sm:grid-cols-3 lg:grid-cols-1">
              {["Educational", "Private", "Not medical advice"].map((item) => (
                <span key={item} className="rounded-full border border-primary/12 bg-white/45 px-4 py-3 backdrop-blur-xl dark:bg-white/[0.055]">
                  {item}
                </span>
              ))}
            </div>
          </div>
          <div>
            <DisclaimerCard continueHref="/analyze" />
          </div>
        </section>
      </div>
    </div>
  );
}
