"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LandingNavbar } from "@/components/marketing/landing-navbar";
import { PageBackdrop } from "@/components/motion/page-backdrop";
import { CheckCircle2, ExternalLink, Loader2, XCircle } from "lucide-react";

interface SetupStatus {
  googleEnabled: boolean;
  googleClientConfigured: boolean;
  googleClientId: string | null;
  googleCallbackUrl: string;
  projectRef: string;
  message: string;
  canConfigure: boolean;
  suggestedClientId: string | null;
  hasAccessToken: boolean;
  supabaseProvidersUrl: string;
  googleCloudCredentialsUrl: string;
  supabaseTokensUrl: string;
}

function copyText(value: string) {
  void navigator.clipboard.writeText(value);
}

export default function GoogleOAuthSetupPage() {
  const [status, setStatus] = useState<SetupStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [clientId, setClientId] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [accessToken, setAccessToken] = useState("");

  async function loadStatus() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/setup/google-oauth");
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not load setup status.");
        setStatus(null);
        return;
      }
      setStatus(data as SetupStatus);
      const suggested = (data as SetupStatus).suggestedClientId;
      if (suggested) {
        setClientId((current) => current || suggested);
      }
    } catch {
      setError("Could not load setup status.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadStatus();
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch("/api/setup/google-oauth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId,
          clientSecret,
          accessToken: accessToken.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not save Google OAuth settings.");
        return;
      }
      setSuccess("Google sign-in is fixed. You can now use Continue with Google on the login page.");
      setClientSecret("");
      setAccessToken("");
      await loadStatus();
    } catch {
      setError("Could not save Google OAuth settings.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="landing-canvas luxury-grain min-h-screen">
      <PageBackdrop intensity="medium" />
      <LandingNavbar />

      <div className="relative mx-auto w-full max-w-3xl px-4 py-16 sm:px-6">
        <div className="premium-card p-6 sm:p-8">
          <p className="text-label">Site owner setup</p>
          <h1 className="font-display text-3xl font-semibold sm:text-4xl">
            Fix Google sign-in
          </h1>
          <p className="text-lead mt-3 max-w-2xl">
            Supabase currently has an invalid Google Client ID (
            <span className="font-mono text-xs">loveprofile.ai</span>). Paste a
            real Google Cloud OAuth Client ID and Secret here to enable{" "}
            <strong>Continue with Google</strong>.
          </p>

          {loading ? (
            <div className="mt-8 flex items-center gap-2 text-sm font-medium text-foreground/60">
              <Loader2 className="size-4 animate-spin" />
              Checking current configuration…
            </div>
          ) : status ? (
            <div className="mt-6 space-y-4">
              <div
                className={`flex items-start gap-3 rounded-2xl border px-4 py-3 ${
                  status.googleClientConfigured
                    ? "border-teal/25 bg-teal/10"
                    : "border-gold/25 bg-gold/10"
                }`}
              >
                {status.googleClientConfigured ? (
                  <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-teal" />
                ) : (
                  <XCircle className="mt-0.5 size-5 shrink-0 text-gold" />
                )}
                <div>
                  <p className="text-sm font-semibold text-foreground/80">
                    {status.googleClientConfigured
                      ? "Google sign-in is configured correctly."
                      : "Google sign-in is misconfigured."}
                  </p>
                  <p className="mt-1 text-sm font-medium text-foreground/60">
                    {status.message}
                  </p>
                  {status.googleClientId && (
                    <p className="mt-2 font-mono text-xs text-foreground/50">
                      Current Client ID: {status.googleClientId}
                    </p>
                  )}
                </div>
              </div>

              {status.canConfigure ? (
                <>
                  <div className="rounded-2xl border border-teal/25 bg-teal/10 p-4 text-sm font-medium text-foreground/75">
                    <p className="font-semibold text-foreground/85">
                      Fastest fix (Supabase Dashboard — no access token)
                    </p>
                    <ol className="mt-2 list-decimal space-y-2 pl-5">
                      <li>
                        Open{" "}
                        <Link
                          href={status.supabaseProvidersUrl}
                          target="_blank"
                          className="text-primary underline"
                        >
                          Supabase → Google provider
                        </Link>
                        .
                      </li>
                      <li>
                        Replace Client ID{" "}
                        <span className="font-mono text-xs">loveprofile.ai</span> with:
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <code className="break-all rounded-lg bg-background/60 px-2 py-1 text-xs">
                            {status.suggestedClientId ??
                              "966002048669-nhq07p1h889g0qrl7sl4kp747p892js4.apps.googleusercontent.com"}
                          </code>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              copyText(
                                status.suggestedClientId ??
                                  "966002048669-nhq07p1h889g0qrl7sl4kp747p892js4.apps.googleusercontent.com"
                              )
                            }
                          >
                            Copy Client ID
                          </Button>
                        </div>
                      </li>
                      <li>Paste your Google Client Secret from Google Cloud Console.</li>
                      <li>Save, then click Refresh status below.</li>
                    </ol>
                    <Link href={status.supabaseProvidersUrl} target="_blank" className="mt-4 inline-block">
                      <Button type="button" className="btn-cta">
                        Open Supabase Google settings
                        <ExternalLink className="ml-2 size-4" />
                      </Button>
                    </Link>
                  </div>

                  <div className="rounded-2xl border border-primary/15 bg-primary/5 p-4 text-sm font-medium text-foreground/70">
                    <p className="font-semibold text-foreground/80">
                      Or save automatically from this page
                    </p>
                    <ol className="mt-2 list-decimal space-y-2 pl-5">
                      <li>
                        Open{" "}
                        <Link
                          href={status.googleCloudCredentialsUrl}
                          target="_blank"
                          className="text-primary underline"
                        >
                          Google Cloud Console → Credentials
                        </Link>{" "}
                        and create an OAuth Client ID (Web application).
                      </li>
                      <li>
                        Add this redirect URI in Google Cloud:{" "}
                        <span className="break-all font-mono text-xs">
                          {status.googleCallbackUrl}
                        </span>
                      </li>
                      <li>
                        Copy the Client ID (ends with{" "}
                        <span className="font-mono">.apps.googleusercontent.com</span>
                        ) and Client Secret.
                      </li>
                      {!status.hasAccessToken && (
                        <li>
                          Create a Supabase access token at{" "}
                          <Link
                            href={status.supabaseTokensUrl}
                            target="_blank"
                            className="text-primary underline"
                          >
                            supabase.com/dashboard/account/tokens
                          </Link>
                          .
                        </li>
                      )}
                      <li>Paste everything below and save.</li>
                    </ol>
                  </div>

                  <form onSubmit={handleSave} className="grid gap-3">
                    <Input
                      value={clientId}
                      onChange={(e) => setClientId(e.target.value)}
                      placeholder="Google Client ID (*.apps.googleusercontent.com)"
                      required
                    />
                    <Input
                      type="password"
                      value={clientSecret}
                      onChange={(e) => setClientSecret(e.target.value)}
                      placeholder="Google Client Secret"
                      required
                    />
                    {!status.hasAccessToken && (
                      <Input
                        type="password"
                        value={accessToken}
                        onChange={(e) => setAccessToken(e.target.value)}
                        placeholder="Supabase access token (sbp_...)"
                        required
                      />
                    )}
                    <div className="flex flex-wrap gap-3">
                      <Button type="submit" disabled={saving}>
                        {saving ? (
                          <Loader2 className="size-4 animate-spin" />
                        ) : (
                          "Save and enable Google sign-in"
                        )}
                      </Button>
                      <Link href={status.supabaseProvidersUrl} target="_blank">
                        <Button type="button" variant="outline">
                          Open Supabase providers
                          <ExternalLink className="ml-2 size-4" />
                        </Button>
                      </Link>
                      <Button type="button" variant="outline" onClick={loadStatus}>
                        Refresh status
                      </Button>
                    </div>
                  </form>
                </>
              ) : (
                <div className="rounded-2xl border border-teal/25 bg-teal/10 px-4 py-3 text-sm font-semibold text-foreground/75">
                  Google sign-in is ready.{" "}
                  <Link href="/login" className="text-primary underline">
                    Go to login
                  </Link>
                </div>
              )}
            </div>
          ) : null}

          {error && (
            <p className="mt-4 rounded-2xl border border-destructive/25 bg-destructive/8 px-4 py-3 text-sm font-semibold text-destructive">
              {error}
            </p>
          )}
          {success && (
            <p className="mt-4 rounded-2xl border border-teal/25 bg-teal/10 px-4 py-3 text-sm font-semibold text-foreground/75">
              {success}{" "}
              <Link href="/login" className="text-primary underline">
                Try sign-in now
              </Link>
            </p>
          )}

          <p className="mt-8 text-sm font-medium text-foreground/55">
            Need to sign in right now without Google?{" "}
            <Link href="/login" className="font-semibold text-primary hover:underline">
              Use email magic link on the login page
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
