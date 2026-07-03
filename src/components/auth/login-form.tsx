"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ensureAuth,
  signInWithEmail,
  signInWithGoogle,
} from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/disclaimer";

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState<string | null>(null);
  const [emailSent, setEmailSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
  }

  async function handleEmail(e: React.FormEvent) {
    e.preventDefault();
    setLoading("email");
    setError(null);
    const result = await signInWithEmail(email, next);
    setLoading(null);
    if (result.ok) {
      setEmailSent(true);
    } else {
      setError(result.error);
    }
  }

  return (
    <div className="glass-card w-full max-w-md p-8">
      <h1 className="font-display text-2xl font-bold text-foreground">Welcome back</h1>
      <p className="mt-2 text-sm font-medium text-foreground/65">
        Sign in to start your relationship assessment.
      </p>

      <div className="mt-8 space-y-3">
        <Button
          type="button"
          variant="outline"
          className="text-btn-label h-11 w-full rounded-xl font-semibold"
          disabled={!!loading}
          onClick={handleGoogle}
        >
          {loading === "google" ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            "Continue with Google"
          )}
        </Button>

        {!emailSent ? (
          <form onSubmit={handleEmail} className="flex flex-col gap-2">
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email for magic link"
              className="h-11 rounded-xl font-medium"
              required
            />
            <Button
              type="submit"
              variant="outline"
              className="text-btn-label h-11 rounded-xl font-semibold"
              disabled={!!loading}
            >
              {loading === "email" ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                "Send email link"
              )}
            </Button>
          </form>
        ) : (
          <p className="rounded-xl bg-primary/10 px-4 py-3 text-sm font-medium text-foreground/75">
            Check your email for a sign-in link.
          </p>
        )}

        <div className="relative py-2">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-primary/15" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white/90 px-2 font-bold tracking-wider text-foreground/45 dark:bg-card/90">
              or
            </span>
          </div>
        </div>

        <Button
          type="button"
          className="btn-cta text-btn-label h-11 w-full rounded-xl font-semibold"
          disabled={!!loading}
          onClick={handleGuestContinue}
        >
          {loading === "guest" ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            "Continue as guest"
          )}
        </Button>
      </div>

      {error && (
        <p className="mt-4 rounded-xl border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm font-medium text-destructive">
          {error}
        </p>
      )}

      <p className="mt-6 text-center text-sm font-medium text-foreground/55">
        <Link href="/" className="text-primary hover:underline">
          ← Back to home
        </Link>
      </p>
    </div>
  );
}
