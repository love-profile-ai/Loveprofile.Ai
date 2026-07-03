"use client";

import { createClient } from "@/lib/supabase/client";

export type AuthResult =
  | { ok: true }
  | { ok: false; error: string };

function isProviderDisabledError(message: string): boolean {
  const lower = message.toLowerCase();
  return (
    lower.includes("provider is not enabled") ||
    lower.includes("unsupported provider") ||
    lower.includes("anonymous sign-ins are disabled")
  );
}

function providerHint(provider: "anonymous" | "google" | "email"): string {
  const labels = {
    anonymous: "Anonymous",
    google: "Google",
    email: "Email",
  };
  return `${labels[provider]} sign-in is disabled in Supabase. Enable it under Authentication → Providers → ${labels[provider]}, or the app will use guest mode automatically.`;
}

async function createGuestSession(
  supabase: ReturnType<typeof createClient>
): Promise<AuthResult> {
  const res = await fetch("/api/auth/guest", { method: "POST" });
  const data = (await res.json().catch(() => ({}))) as {
    error?: string;
    access_token?: string;
    refresh_token?: string;
  };

  if (!res.ok) {
    return {
      ok: false,
      error:
        data.error ??
        "Could not start a guest session. Check SUPABASE_SERVICE_ROLE_KEY in .env.local.",
    };
  }

  if (data.access_token && data.refresh_token) {
    const { error } = await supabase.auth.setSession({
      access_token: data.access_token,
      refresh_token: data.refresh_token,
    });
    if (!error) return { ok: true };
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (session) return { ok: true };

  const { data: refreshed, error } = await supabase.auth.refreshSession();
  if (refreshed.session) return { ok: true };

  return {
    ok: false,
    error: error?.message ?? "Guest session was created but could not be loaded.",
  };
}

export async function ensureAuth(): Promise<AuthResult> {
  const supabase = createClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (session) return { ok: true };

  const { data, error } = await supabase.auth.signInAnonymously();

  if (!error && data.session) return { ok: true };

  if (error && isProviderDisabledError(error.message)) {
    return createGuestSession(supabase);
  }

  if (error) {
    const guest = await createGuestSession(supabase);
    if (guest.ok) return guest;
    return { ok: false, error: error.message };
  }

  return createGuestSession(supabase);
}

export function useAuth() {
  // Auth runs on-demand when starting analysis or submitting — not on every page load
}

export async function signInWithGoogle(next = "/disclaimer"): Promise<AuthResult> {
  const supabase = createClient();
  const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo },
  });

  if (error) {
    return {
      ok: false,
      error: isProviderDisabledError(error.message)
        ? providerHint("google")
        : error.message,
    };
  }

  return { ok: true };
}

export async function signInWithEmail(email: string, next = "/disclaimer"): Promise<AuthResult> {
  const supabase = createClient();
  const emailRedirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo },
  });

  if (error) {
    return {
      ok: false,
      error: isProviderDisabledError(error.message)
        ? providerHint("email")
        : error.message,
    };
  }

  return { ok: true };
}

export async function signOut(): Promise<AuthResult> {
  const supabase = createClient();
  await supabase.auth.signOut();
  return createGuestSession(supabase);
}
