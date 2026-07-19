"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { signInWithEmail } from "@/hooks/use-auth";
import { Loader2, Mail, Shield, Sparkles } from "lucide-react";
import { SITE_NAME } from "@/lib/site";

interface ProviderStatus {
  configured: boolean;
  googleEnabled: boolean;
  googleClientConfigured?: boolean;
  googleConfigured?: boolean;
  emailEnabled: boolean;
  googleCallbackUrl?: string;
  message?: string;
}

function friendlyAuthError(raw: string | null): string | null {
  if (!raw) return null;
  const lower = raw.toLowerCase();
  if (lower.includes("invalid_client") || lower.includes("oauth client was not found")) {
    return "Google OAuth is misconfigured in Supabase (invalid Client ID). Use email sign-in below, or fix it at /setup/google-oauth.";
  }
  if (lower.includes("guest access is disabled")) {
    return "Guest mode is off. Sign in with Google or email and wait for admin approval.";
  }
  if (lower.includes("missing sign-in code")) {
    return "Sign-in link could not be verified. Please click Send magic link again.";
  }
  if (lower.includes("rate limit") || lower.includes("too many")) {
    return "Too many sign-in emails were sent. Wait about 60 minutes and try again, or fix Google sign-in at /setup/google-oauth.";
  }
  return raw;
}

function suggestEmailFix(email: string): string | null {
  const trimmed = email.trim().toLowerCase();
  const typoMap: Record<string, string> = {
    "@gmial.com": "@gamil.com",
    "@gmai.com": "@gamil.com",
    "@gamil.co": "@gamil.com",
  };

  for (const [wrong, right] of Object.entries(typoMap)) {
    if (trimmed.endsWith(wrong)) {
      return trimmed.replace(wrong, right);
    }
  }
  return null;
}

export function LoginForm() {
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/disclaimer";
  const callbackError = searchParams.get("error");

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState<string | null>(null);
  const [emailSent, setEmailSent] = useState(false);
  const [providerStatus, setProviderStatus] = useState<ProviderStatus | null>(
    null
  );
  const [providerLoading, setProviderLoading] = useState(true);
  const [error, setError] = useState<string | null>(
    friendlyAuthError(callbackError ? decodeURIComponent(callbackError) : null)
  );

  useEffect(() => {
    fetch("/api/auth/provider-status")
      .then((res) => res.json())
      .then((data: ProviderStatus) => setProviderStatus(data))
      .catch(() => {
        setProviderStatus(null);
      })
      .finally(() => {
        setProviderLoading(false);
      });
  }, []);

  const googleReady = Boolean(
    providerStatus?.googleConfigured ??
      (providerStatus?.googleEnabled && providerStatus?.googleClientConfigured)
  );
  const googleEnabled = Boolean(providerStatus?.googleEnabled);
  const emailReady = Boolean(providerStatus?.emailEnabled);
  const anyAuthReady = providerStatus ? providerStatus.configured : false;
  const googleBlocked = providerLoading || Boolean(providerStatus && (!googleEnabled || !googleReady));

  const suggestedEmail = suggestEmailFix(email);

  function applySuggestedEmail() {
    const suggested = suggestEmailFix(email);
    if (!suggested) return;
    setEmail(suggested);
    setError(null);
  }

  function handleGoogle() {
    if (providerLoading) return;

    if (providerStatus && !googleEnabled) {
      setError("Google sign-in is not enabled in Supabase yet.");
      return;
    }

    if (providerStatus && googleEnabled && !googleReady) {
      setError(
        "Google OAuth is not configured correctly yet. Use email below, or fix it at /setup/google-oauth."
      );
      return;
    }

    setLoading("google");
    setError(null);
    window.location.assign(
      `/api/auth/google?next=${encodeURIComponent(next)}`
    );
  }

  async function handleEmail(e: React.FormEvent) {
    e.preventDefault();
    if (providerStatus && !emailReady) {
      setError("Email sign-in is not enabled in Supabase yet.");
      return;
    }

    const suggested = suggestEmailFix(email);
    if (suggested && suggested !== email.trim().toLowerCase()) {
      setError(`Did you mean ${suggested}? Tap "Use ${suggested}" below.`);
      return;
    }

    setLoading("email");
    setError(null);
    const result = await signInWithEmail(email.trim(), next);
    setLoading(null);
    if (!result.ok) {
      const normalized = result.error.toLowerCase();
      if (normalized.includes("invalid") && normalized.includes("email")) {
        const fix = suggestEmailFix(email);
        setError(
          fix
            ? `That email looks invalid. Did you mean ${fix}?`
            : "Please enter a valid email address."
        );
        return;
      }
      setError(result.error);
      return;
    }
    setEmailSent(true);
  }

  return (
    <div className="premium-card w-full overflow-hidden p-6 sm:p-8 lg:p-10">
      <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-primary/15 bg-gradient-to-r from-primary/12 via-lavender/10 to-coral/10 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.2em] text-primary">
        <Sparkles className="size-3.5" />
        {`${SITE_NAME} · members club`}
      </div>

      <h1 className="font-display text-4xl font-semibold tracking-[-0.035em] text-foreground">
        Sign in with Google or email
      </h1>
      <p className="mt-3 text-sm font-medium leading-7 text-foreground/62">
        Step 2 of 3: sign in here. After an admin approves your account, you can
        accept the disclaimer and use the full website.
      </p>

      <div className="mt-8 space-y-3">
        {providerStatus && !anyAuthReady && (
          <p className="rounded-2xl border border-gold/25 bg-gold/10 px-4 py-3 text-sm font-semibold text-foreground/75">
            {providerStatus.message}
          </p>
        )}

        {providerStatus && googleEnabled && !googleReady && (
          <p className="rounded-2xl border border-gold/25 bg-gold/10 px-4 py-3 text-sm font-semibold text-foreground/75">
            Google sign-in is misconfigured right now. Use your email below, or{" "}
            <Link href="/setup/google-oauth" className="text-primary underline">
              fix Google OAuth setup
            </Link>
            .
          </p>
        )}

        <Button
          type="button"
          className="btn-cta h-12 w-full"
          disabled={!!loading || googleBlocked}
          onClick={handleGoogle}
        >
          {loading === "google" ? (
            <Loader2 className="size-4 animate-spin" />
          ) : providerLoading ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              <span className="ml-2">Checking Google sign-in…</span>
            </>
          ) : googleBlocked ? (
            "Continue with Google (needs setup)"
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
                placeholder="loveprofile@gamil.com"
                className="premium-input pl-11"
                required
                disabled={Boolean(providerStatus && !emailReady)}
              />
            </div>
            <Button
              type="submit"
              variant="outline"
              className="h-12 w-full border-primary/25 bg-primary/5 hover:bg-primary/10"
              disabled={!!loading || Boolean(providerStatus && !emailReady)}
            >
              {loading === "email" ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                "Send magic link"
              )}
            </Button>
          </form>
        ) : (
          <p className="rounded-2xl border border-primary/15 bg-gradient-to-r from-primary/10 via-lavender/8 to-coral/8 px-4 py-3 text-sm font-semibold text-foreground/75">
            Magic link sent. Check your inbox, click it, then wait for admin approval.
          </p>
        )}
      </div>

      {error && (
        <div className="mt-4 space-y-3">
          <p className="rounded-2xl border border-destructive/25 bg-destructive/8 px-4 py-3 text-sm font-semibold text-destructive">
            {error}
          </p>
          {suggestedEmail && suggestedEmail !== email.trim().toLowerCase() && (
            <Button
              type="button"
              variant="outline"
              className="h-11 w-full border-primary/25 bg-primary/5 hover:bg-primary/10"
              onClick={applySuggestedEmail}
            >
              Use {suggestedEmail}
            </Button>
          )}
        </div>
      )}

      <div className="mt-7 flex flex-col gap-3 text-sm font-medium text-foreground/52 sm:flex-row sm:items-center sm:justify-between">
        <span className="inline-flex items-center gap-1.5">
          <Shield className="size-4 text-primary/70" />
          Admin approval required
        </span>
        <Link href="/" className="font-semibold text-primary hover:underline">
          Back to home
        </Link>
      </div>
    </div>
  );
}
