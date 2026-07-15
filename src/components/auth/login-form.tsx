"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { signInWithEmail, signInWithGoogle } from "@/hooks/use-auth";
import { Loader2, Mail, Shield, Sparkles } from "lucide-react";
import { SITE_NAME } from "@/lib/site";

export function LoginForm() {
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/disclaimer";
  const callbackError = searchParams.get("error");

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState<string | null>(null);
  const [emailSent, setEmailSent] = useState(false);
  const [error, setError] = useState<string | null>(
    callbackError ? decodeURIComponent(callbackError) : null
  );

  async function handleGoogle() {
    setLoading("google");
    setError(null);
    const result = await signInWithGoogle(next);
    if (!result.ok) {
      setError(result.error);
      setLoading(null);
    }
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
    setEmailSent(true);
  }

  return (
    <div className="premium-card w-full overflow-hidden p-6 sm:p-8 lg:p-10">
      <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/8 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.2em] text-primary">
        <Sparkles className="size-3.5" />
        {`Welcome to ${SITE_NAME}`}
      </div>

      <h1 className="font-display text-4xl font-semibold tracking-[-0.035em] text-foreground">
        Sign in to continue
      </h1>
      <p className="mt-3 text-sm font-medium leading-7 text-foreground/62">
        Use Google or a secure email link to access your private reflection space.
      </p>

      <div className="mt-8 space-y-3">
        <Button
          type="button"
          className="btn-cta h-12 w-full"
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
