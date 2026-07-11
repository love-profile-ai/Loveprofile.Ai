"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { LoginForm } from "@/components/auth/login-form";
import { LandingNavbar } from "@/components/marketing/landing-navbar";
import { FadeInView } from "@/components/motion/fade-in-view";
import { createClient } from "@/lib/supabase/client";
import { SITE_NAME } from "@/lib/site";
import { Loader2, Lock, Shield, Sparkles } from "lucide-react";

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

      {/* Animated background orbs */}
      <motion.div
        className="pointer-events-none absolute -left-32 top-32 size-96 rounded-full bg-primary/12 blur-3xl"
        animate={{ x: [0, 30, 0], y: [0, -20, 0] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="pointer-events-none absolute -right-24 bottom-24 size-80 rounded-full bg-lavender/12 blur-3xl"
        animate={{ x: [0, -25, 0], y: [0, 15, 0] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      />

      <LandingNavbar />

      <div className="relative mx-auto flex min-h-[calc(100vh-6rem)] w-full max-w-lg flex-col items-center justify-center px-4 py-16 sm:px-6">
        <FadeInView className="mb-8 text-center">
          <p className="text-label">Trust</p>
          <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            Welcome to {SITE_NAME}
          </h1>
          <p className="text-lead mx-auto mt-4 max-w-sm">
            Your private space for relationship reflection. Sign in to save
            reports — or continue as guest instantly.
          </p>
        </FadeInView>

        <FadeInView delay={0.1} className="w-full">
          <LoginForm />
        </FadeInView>

        <FadeInView delay={0.2} className="mt-8 flex flex-wrap justify-center gap-6 text-xs font-semibold text-foreground/48">
          <span className="inline-flex items-center gap-1.5">
            <Shield className="size-3.5 text-teal" />
            Encrypted auth
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Lock className="size-3.5 text-teal" />
            Private by default
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Sparkles className="size-3.5 text-gold" />
            No password needed
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
