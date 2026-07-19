"use client";

import { createClient } from "@/lib/supabase/client";

export type AuthResult =
  | { ok: true; method?: "oauth" | "email" | "existing" }
  | { ok: false; error: string };

export function isGuestEmail(email: string | null | undefined): boolean {
  return Boolean(email?.includes("@guest.loveprofile.ai"));
}

function normalizeAuthErrorMessage(message: string): string {
  try {
    const parsed = JSON.parse(message) as { msg?: string; message?: string };
    return parsed.msg ?? parsed.message ?? message;
  } catch {
    return message;
  }
}

export async function ensureAuth(): Promise<AuthResult> {
  const supabase = createClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (session) return { ok: true, method: "existing" };

  return {
    ok: false,
    error: "Please sign in to continue.",
  };
}

export function useAuth() {
  // Auth runs on-demand when starting analysis or submitting — not on every page load
}

export async function signInWithGoogle(next = "/disclaimer"): Promise<AuthResult> {
  const supabase = createClient();
  const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo },
  });

  if (error) {
    return {
      ok: false,
      error: normalizeAuthErrorMessage(error.message),
    };
  }

  if (data.url) {
    window.location.assign(data.url);
    return { ok: true, method: "oauth" };
  }

  return {
    ok: false,
    error: "Google sign-in could not be started. Please try again.",
  };
}

export async function signInWithEmail(
  email: string,
  next = "/disclaimer"
): Promise<AuthResult> {
  const res = await fetch("/api/auth/email", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: email.trim(), next }),
  });

  const data = (await res.json().catch(() => ({}))) as {
    ok?: boolean;
    error?: string;
    mode?: "email" | "redirect";
    redirectUrl?: string;
    message?: string;
  };

  if (!res.ok || !data.ok) {
    return {
      ok: false,
      error: normalizeAuthErrorMessage(data.error ?? "Could not send magic link."),
    };
  }

  if (data.mode === "redirect" && data.redirectUrl) {
    window.location.assign(data.redirectUrl);
    return { ok: true, method: "email" };
  }

  return { ok: true, method: "email" };
}

export async function signOut(): Promise<AuthResult> {
  const supabase = createClient();
  await supabase.auth.signOut();
  return { ok: true };
}
