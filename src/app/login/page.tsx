"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { LoginForm } from "@/components/auth/login-form";
import { LandingNavbar } from "@/components/marketing/landing-navbar";
import { FadeInView } from "@/components/motion/fade-in-view";
import { PageBackdrop } from "@/components/motion/page-backdrop";
import { PremiumLoader } from "@/components/motion/premium-loader";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { SITE_NAME } from "@/lib/site";
import { Clock, Lock, PartyPopper, Shield, Sparkles } from "lucide-react";

function PendingBanner({ email }: { email: string | null }) {
  const sql = email
    ? `UPDATE public.profiles\nSET role = 'admin',\n    approval_status = 'approved',\n    approved_at = now()\nWHERE email = '${email}';`
    : null;

  return (
    <div className="premium-card mb-6 w-full p-6 text-center">
      <div className="mx-auto flex size-14 items-center justify-center rounded-full border border-gold/25 bg-gold/12 text-gold">
        <Clock className="size-6" />
      </div>
      <p className="text-label mt-4">Almost in</p>
      <h2 className="font-display mt-2 text-2xl font-semibold">Admin approval pending</h2>
      <p className="text-lead mx-auto mt-3 max-w-sm">
        Sign-in worked. Your account ({email ?? "signed-in user"}) is waiting for
        admin approval before you can use the full website.
      </p>
      {email && (
        <div className="mt-5 rounded-2xl border border-primary/15 bg-primary/5 px-4 py-3 text-left text-sm font-medium text-foreground/70">
          <p className="font-semibold text-foreground/80">Site owner? Approve yourself in Supabase</p>
          <p className="mt-2">
            Open{" "}
            <Link
              href="https://supabase.com/dashboard/project/moeeekjnzupjrnvxbrqw/sql/new"
              target="_blank"
              className="text-primary underline"
            >
              Supabase SQL Editor
            </Link>
            , run this, then click Check again:
          </p>
          <pre className="mt-3 overflow-x-auto rounded-xl bg-background/60 p-3 text-left font-mono text-xs">
            {sql}
          </pre>
        </div>
      )}
      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:justify-center">
        <Button className="btn-cta" onClick={() => window.location.reload()}>
          Check again
        </Button>
        <Link href="/admin">
          <Button variant="outline" className="w-full">
            Open admin
          </Button>
        </Link>
      </div>
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
  const [userEmail, setUserEmail] = useState<string | null>(null);

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

      setUserEmail(session.user.email ?? null);

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
      <div className="landing-canvas luxury-grain min-h-screen">
        <PageBackdrop />
        <PremiumLoader className="min-h-screen" label="Checking your session" />
      </div>
    );
  }

  return (
    <div className="landing-canvas luxury-grain">
      <PageBackdrop intensity="medium" />
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
            <PendingBanner email={userEmail} />
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
        <div className="landing-canvas luxury-grain min-h-screen">
          <PageBackdrop />
          <PremiumLoader className="min-h-screen" />
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
