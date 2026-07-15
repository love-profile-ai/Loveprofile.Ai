"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ensureAuth,
  signInWithEmail,
  signInWithGoogle,
} from "@/hooks/use-auth";
import { ArrowRight, Loader2, Mail, Shield, Sparkles } from "lucide-react";
import { SITE_NAME } from "@/lib/site";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/disclaimer";
  const autoStart = searchParams.get("start") === "1";
  const callbackError = searchParams.get("error");

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState<string | null>(null);
  const [emailSent, setEmailSent] = useState(false);
  const [error, setError] = useState<string | null>(
    callbackError ? decodeURIComponent(callbackError) : null
  );

  useEffect(() => {
    if (!autoStart || loading) return;

    let cancelled = false;
    async function autoGuest() {
      setLoading("guest");
      setError(null);
      const result = await ensureAuth();
      if (cancelled) return;
      setLoading(null);
      if (result.ok) {
        router.push(next);
      } else {
        setError(result.error);
      }
    }

    autoGuest();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoStart]);

  async function handleGuestContinue() {
    setLoading("guest");
    setError(null);
    const result = await ensureAuth();
    setLoading(null);
    if (result.ok) {
      router.push(next);
    } else {
      setError(result.error);
    }
  }

  async function handleGoogle() {
    setLoading("google");
    setError(null);
    const result = await signInWithGoogle(next);
    if (!result.ok) {
      setError(result.error);
      setLoading(null);
    }
    // OAuth success redirects away — keep loading state visible.
  }

  async function handleEmail(e: React.FormEvent) {
    e.preventDefault();
    setLoading("email");
    setError(null);
    const result = await signInWithEmail(email, next);
    setLoading(null);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    if (result.method === "guest") {
      router.push(next);
      return;
    }
    setEmailSent(true);
  }

  return (
    <div className="premium-card w-full overflow-hidden p-6 sm:p-8 lg:p-10">
      <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/8 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.2em] text-primary">
          <Sparkles className="size-3.5" />
          {autoStart ? "Preparing your space" : `Welcome to ${SITE_NAME}`}
        </div>

        <h1 className="font-display text-4xl font-semibold tracking-[-0.035em] text-foreground">
          {autoStart ? "Getting started" : "Continue your reflection"}
        </h1>
        <p className="mt-3 text-sm font-medium leading-7 text-foreground/62">
          {autoStart
            ? "We are setting up a private guest session. This usually takes a moment."
            : "Choose the quickest path in. You can save your reports later."}
        </p>

        <div className="mt-8 space-y-3">
          <Button
            type="button"
            className="btn-cta h-12 w-full"
            disabled={!!loading}
            onClick={handleGuestContinue}
          >
            {loading === "guest" ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Starting private session
              </>
            ) : (
              <>
                Continue as guest
                <ArrowRight className="ml-1 size-4" />
              </>
            )}
          </Button>

          <Button
            type="button"
            variant="outline"
            className="h-12 w-full"
            disabled={!!loading}
            onClick={handleGoogle}
          >
            {loading === "google" ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              "Continue with Google"
            )}
          </Button>

          <div className="relative py-3">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-primary/12" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="rounded-full bg-card/80 px-3 font-bold tracking-[0.18em] text-foreground/42 backdrop-blur-xl">
                or use email
              </span>
            </div>
          </div>

          {!emailSent ? (
            <form onSubmit={handleEmail} className="space-y-3">
              <div className="relative">
                <Mail className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-primary/60" />
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email for magic link"
                  className="premium-input pl-11"
                  required
                />
              </div>
              <Button
                type="submit"
                variant="outline"
                className="h-12 w-full"
                disabled={!!loading}
              >
                {loading === "email" ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  "Send secure link"
                )}
              </Button>
            </form>
          ) : (
            <p className="rounded-2xl border border-primary/15 bg-primary/8 px-4 py-3 text-sm font-semibold text-foreground/75">
              Check your email for a sign-in link.
            </p>
          )}
        </div>

        {error && (
          <p className="mt-4 rounded-2xl border border-destructive/25 bg-destructive/8 px-4 py-3 text-sm font-semibold text-destructive">
            {error}
          </p>
        )}

        <div className="mt-7 flex flex-col gap-3 text-sm font-medium text-foreground/52 sm:flex-row sm:items-center sm:justify-between">
          <span className="inline-flex items-center gap-1.5">
            <Shield className="size-4 text-primary/70" />
            Encrypted auth via Supabase
          </span>
          <Link href="/" className="font-semibold text-primary hover:underline">
            Back to home
          </Link>
        </div>
    </div>
  );
}
