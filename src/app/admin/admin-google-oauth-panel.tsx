"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CheckCircle2, ExternalLink, Loader2, XCircle } from "lucide-react";

interface GoogleOAuthStatusResponse {
  googleEnabled: boolean;
  googleClientConfigured: boolean;
  googleClientId: string | null;
  googleCallbackUrl: string;
  projectRef: string;
  message: string;
  hasAccessToken: boolean;
  supabaseProvidersUrl: string;
  googleCloudCredentialsUrl: string;
}

export function AdminGoogleOAuthPanel() {
  const [status, setStatus] = useState<GoogleOAuthStatusResponse | null>(null);
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
      const res = await fetch("/api/admin/auth/google-oauth");
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not load Google OAuth status.");
        setStatus(null);
        return;
      }
      setStatus(data as GoogleOAuthStatusResponse);
    } catch {
      setError("Could not load Google OAuth status.");
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
      const res = await fetch("/api/admin/auth/google-oauth", {
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
      setSuccess("Google OAuth updated in Supabase. Try Continue with Google on /login.");
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
    <div className="premium-card p-6 lg:col-span-2">
      <p className="text-label">Authentication</p>
      <h2 className="font-display text-3xl font-semibold">Google sign-in setup</h2>
      <p className="text-lead mt-3 max-w-3xl">
        Fix the &ldquo;Continue with Google&rdquo; error by replacing the invalid
        Supabase Client ID with a real Google Cloud OAuth Client ID.
      </p>

      {loading ? (
        <div className="mt-8 flex items-center gap-2 text-sm font-medium text-foreground/60">
          <Loader2 className="size-4 animate-spin" />
          Checking Google OAuth status…
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

          <div className="rounded-2xl border border-primary/15 bg-primary/5 p-4 text-sm font-medium text-foreground/70">
            <p className="font-semibold text-foreground/80">Setup steps</p>
            <ol className="mt-2 list-decimal space-y-1 pl-5">
              <li>
                Create a Google OAuth Client ID in{" "}
                <Link
                  href={status.googleCloudCredentialsUrl}
                  target="_blank"
                  className="text-primary underline"
                >
                  Google Cloud Console
                </Link>
                .
              </li>
              <li>
                Add redirect URI:{" "}
                <span className="break-all font-mono text-xs">
                  {status.googleCallbackUrl}
                </span>
              </li>
              <li>Paste Client ID + Secret below, then save.</li>
            </ol>
          </div>

          <form onSubmit={handleSave} className="grid gap-3 md:grid-cols-2">
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
                className="md:col-span-2"
                required
              />
            )}
            <div className="flex flex-wrap gap-3 md:col-span-2">
              <Button type="submit" disabled={saving}>
                {saving ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  "Save Google OAuth to Supabase"
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
        </div>
      ) : null}

      {error && (
        <p className="mt-4 rounded-2xl border border-destructive/25 bg-destructive/8 px-4 py-3 text-sm font-semibold text-destructive">
          {error}
        </p>
      )}
      {success && (
        <p className="mt-4 rounded-2xl border border-teal/25 bg-teal/10 px-4 py-3 text-sm font-semibold text-foreground/75">
          {success}
        </p>
      )}
    </div>
  );
}
