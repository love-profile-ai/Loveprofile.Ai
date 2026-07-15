"use client";

import { createClient } from "@/lib/supabase/client";

export type AuthResult =
  | { ok: true; method?: "guest" | "oauth" | "email" | "existing" }
  | { ok: false; error: string };

function normalizeAuthErrorMessage(message: string): string {
  try {
    const parsed = JSON.parse(message) as { msg?: string; message?: string };
    return parsed.msg ?? parsed.message ?? message;
  } catch {
    return message;
  }
}

function isProviderDisabledError(message: string): boolean {
  const lower = normalizeAuthErrorMessage(message).toLowerCase();
  return (
    lower.includes("provider is not enabled") ||
    lower.includes("unsupported provider") ||
    lower.includes("anonymous sign-ins are disabled") ||
    lower.includes("email signups are disabled")
  );
}

function guestConfigError(): string {
  return "Sign-in is not configured on the server. Ask the site owner to set NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, and SUPABASE_SERVICE_ROLE_KEY in the deployment environment.";
}

export function isGuestEmail(email: string | null | undefined): boolean {
  return Boolean(email?.includes("@guest.loveprofile.ai"));
}

async function createGuestSession(
  supabase: ReturnType<typeof createClient>
): Promise<AuthResult> {
  const res = await fetch("/api/auth/guest", {
    method: "POST",
    credentials: "same-origin",
  });
  const data = (await res.json().catch(() => ({}))) as {
    error?: string;
    access_token?: string;
    refresh_token?: string;
  };

  if (!res.ok) {
    return {
      ok: false,
      error: data.error ?? guestConfigError(),
    };
  }

  const {
    data: { session: cookieSession },
  } = await supabase.auth.getSession();
  if (cookieSession) return { ok: true, method: "guest" };

  if (data.access_token && data.refresh_token) {
    const { error } = await supabase.auth.setSession({
      access_token: data.access_token,
      refresh_token: data.refresh_token,
    });
    if (!error) return { ok: true, method: "guest" };
  }

  const { data: refreshed, error } = await supabase.auth.refreshSession();
  if (refreshed.session) return { ok: true, method: "guest" };

  return {
    ok: false,
    error:
      error?.message ??
      "Guest session was created but could not be loaded. Try again or use a different browser.",
  };
}

export async function ensureAuth(): Promise<AuthResult> {
  const supabase = createClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (session) return { ok: true, method: "existing" };

  const guest = await createGuestSession(supabase);
  if (guest.ok) return guest;

  const { data, error } = await supabase.auth.signInAnonymously();

  if (!error && data.session) return { ok: true, method: "guest" };

  if (error) {
    if (isProviderDisabledError(error.message)) {
      return guest;
    }
    return {
      ok: false,
      error: normalizeAuthErrorMessage(error.message),
    };
  }

  return guest;
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
  const supabase = createClient();
  const emailRedirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo },
  });

  if (error) {
    return {
      ok: false,
      error: normalizeAuthErrorMessage(error.message),
    };
  }

  return { ok: true, method: "email" };
}

export async function signOut(): Promise<AuthResult> {
  const supabase = createClient();
  await supabase.auth.signOut();
  return createGuestSession(supabase);
}
