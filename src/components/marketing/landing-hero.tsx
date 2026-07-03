"use client";

import { LandingFloatingCards } from "@/components/marketing/landing-floating-cards";
import { LandingNavbar } from "@/components/marketing/landing-navbar";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function LandingHero() {
  return (
    <div className="landing-canvas relative min-h-screen overflow-hidden">
      <div className="dot-grid pointer-events-none absolute inset-0 -z-10" />
      <div className="page-glow pointer-events-none absolute inset-0 -z-10" />

      <div className="relative mx-auto w-full max-w-6xl px-4 sm:px-6">
        <LandingNavbar />

        <section className="relative flex min-h-[calc(100vh-5rem)] flex-col items-center justify-center py-12 lg:py-16">
          <LandingFloatingCards />

          <div className="relative z-10 flex w-full max-w-2xl flex-col items-center text-center">
            <div className="hero-logo mb-8 flex size-16 items-center justify-center rounded-2xl sm:size-[4.5rem]">
              <span className="flex size-10 items-center justify-center rounded-full bg-primary/10">
                <svg viewBox="0 0 24 24" className="size-5 fill-primary text-primary" aria-hidden>
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                </svg>
              </span>
            </div>

            <h1 className="font-display text-[2.5rem] font-bold leading-[1.08] tracking-[-0.03em] text-foreground sm:text-5xl md:text-[3.25rem]">
              Understand, reflect, and connect
              <span className="mt-1 block text-[2rem] font-bold text-foreground/45 sm:text-4xl md:text-[2.75rem]">
                all in one place
              </span>
            </h1>

            <p className="text-lead mt-5 max-w-md" id="how-it-works">
              Thoughtful questions about how you communicate, trust, and connect.
              Personalized reflections, just for you.
            </p>

            <Link href="/login" className="mt-10">
              <Button
                size="lg"
                className="btn-cta text-btn-label h-12 rounded-full px-8 text-base shadow-lg"
              >
                Get started
                <ArrowRight className="ml-2 size-4" />
              </Button>
            </Link>

            <p className="text-meta-footer mt-8">
              ~17 Questions · ~5 Minutes · Auto-saved
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
