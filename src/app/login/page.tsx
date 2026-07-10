"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { LoginForm } from "@/components/auth/login-form";
import { LandingNavbar } from "@/components/marketing/landing-navbar";
import { createClient } from "@/lib/supabase/client";
import { SITE_NAME } from "@/lib/site";
import { CheckCircle2, Loader2 } from "lucide-react";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/disclaimer";

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) router.replace(next);
    });
  }, [router, next]);

  return (
    <div className="landing-canvas">
      <div className="dot-grid pointer-events-none absolute inset-0 -z-10" />
      <div className="page-glow pointer-events-none absolute inset-0 -z-10" />

      <LandingNavbar />

      <div className="relative mx-auto w-full max-w-6xl px-4 sm:px-6">
        <section className="grid min-h-[calc(100vh-7rem)] items-center gap-10 py-12 lg:grid-cols-[0.85fr_1.15fr]">
          <div className="max-w-xl text-center lg:text-left">
            <p className="text-label">Your private space</p>
            <h1 className="text-heading-page">
              Sign in when you&apos;re ready — or{" "}
              <em className="text-display-accent">start as guest.</em>
            </h1>
            <p className="text-lead mt-5">
              {SITE_NAME} works without an account. Sign in only when you want
              saved reports across devices.
            </p>
            <div className="mt-8 space-y-3">
              {[
                "Continue as guest instantly",
                "Google sign-in with PKCE security",
                "Email magic link — no password",
              ].map((item) => (
                <div
                  key={item}
                  className="flex items-center gap-3 rounded-2xl border border-primary/12 bg-white/45 px-4 py-3 text-sm font-semibold text-foreground/70 backdrop-blur-xl dark:bg-white/[0.055]"
                >
                  <CheckCircle2 className="size-4 shrink-0 text-primary" />
                  {item}
                </div>
              ))}
            </div>
          </div>
          <LoginForm />
        </section>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <Loader2 className="size-8 animate-spin text-primary" />
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
