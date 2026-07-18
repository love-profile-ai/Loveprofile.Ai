"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { LoginForm } from "@/components/auth/login-form";
import { LandingNavbar } from "@/components/marketing/landing-navbar";
import { FadeInView } from "@/components/motion/fade-in-view";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { SITE_NAME } from "@/lib/site";
import { Clock, Loader2, Lock, PartyPopper, Shield, Sparkles } from "lucide-react";

function PendingBanner() {
  return (
    <div className="premium-card mb-6 w-full p-6 text-center">
      <div className="mx-auto flex size-14 items-center justify-center rounded-full border border-gold/25 bg-gold/12 text-gold">
        <Clock className="size-6" />
      </div>
      <p className="text-label mt-4">Almost in</p>
      <h2 className="font-display mt-2 text-2xl font-semibold">Admin approval pending</h2>
      <p className="text-lead mx-auto mt-3 max-w-sm">
        You signed in successfully. An admin must approve your Google or email
        account before you can use the website. This page will unlock automatically
        after approval.
      </p>
      <Button className="btn-cta mt-5" onClick={() => window.location.reload()}>
        Check again
      </Button>
    </div>
  );
}

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/disclaimer";
  const pendingFromOAuth = searchParams.get("pending") === "1";
  const [checkingSession, setCheckingSession] = useState(true);
  const [pendingApproval, setPendingApproval] = useState(pendingFromOAuth);

  useEffect(() => {
    const supabase = createClient();

    async function checkSession() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        setCheckingSession(false);
        return;
      }

      try {
        const res = await fetch("/api/me/access");
        const access = await res.json();

        if (access.is_guest || access.approval_status === "guest_disabled") {
          await supabase.auth.signOut();
          setCheckingSession(false);
          return;
        }

        if (access.allowed) {
          router.replace(next);
          return;
        }

        if (access.authenticated && !access.allowed) {
          setPendingApproval(true);
        }
      } catch {
        // Stay on login if access check fails
      }

      setCheckingSession(false);
    }

    checkSession();
  }, [router, next]);

  if (checkingSession) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="landing-canvas">
      <div className="dot-grid pointer-events-none absolute inset-0 -z-10" />
      <div className="page-glow pointer-events-none absolute inset-0 -z-10" />

      <motion.div
        className="pointer-events-none absolute -left-32 top-32 size-96 rounded-full bg-primary/18 blur-3xl"
        animate={{ x: [0, 30, 0], y: [0, -20, 0] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="pointer-events-none absolute -right-24 bottom-24 size-80 rounded-full bg-lavender/18 blur-3xl"
        animate={{ x: [0, -25, 0], y: [0, 15, 0] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="pointer-events-none absolute left-1/2 top-1/3 size-64 -translate-x-1/2 rounded-full bg-coral/12 blur-3xl"
        animate={{ scale: [1, 1.08, 1] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />

      <LandingNavbar />

      <div className="relative mx-auto flex min-h-[calc(100vh-6rem)] w-full max-w-lg flex-col items-center justify-center px-4 py-16 sm:px-6">
        <FadeInView className="mb-8 text-center">
          <p className="text-label">Step 2 · Sign in</p>
          <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            Sign in to <span className="text-display-accent">continue</span>
          </h1>
          <p className="text-lead mx-auto mt-4 max-w-sm">
            After sign-in, an admin approves your account. Then you can accept the
            disclaimer and start your analysis.
          </p>
        </FadeInView>

        {pendingApproval ? (
          <FadeInView delay={0.1} className="w-full">
            <PendingBanner />
          </FadeInView>
        ) : (
          <FadeInView delay={0.1} className="w-full">
            <LoginForm />
          </FadeInView>
        )}

        <FadeInView delay={0.2} className="mt-8 flex flex-wrap justify-center gap-6 text-xs font-semibold text-foreground/48">
          <span className="inline-flex items-center gap-1.5">
            <PartyPopper className="size-3.5 text-coral" />
            Not a therapy session
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Shield className="size-3.5 text-teal" />
            Admin-approved only
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Lock className="size-3.5 text-teal" />
            Private by default
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Sparkles className="size-3.5 text-gold" />
            {SITE_NAME}
          </span>
        </FadeInView>
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
