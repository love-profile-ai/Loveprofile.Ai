"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Loader2, ShieldCheck } from "lucide-react";

function promotionSql(email: string) {
  return `UPDATE public.profiles
SET role = 'admin',
    approval_status = 'approved',
    approved_at = now()
WHERE email = '${email}';`;
}

function isGuestEmail(email: string | null) {
  return Boolean(email?.includes("@guest.loveprofile.ai"));
}

export function AdminBootstrapPanel({
  reason,
  email,
  role,
  approvalStatus,
  canBootstrap,
}: {
  reason: string;
  email: string | null;
  role: string | null;
  approvalStatus: string | null;
  canBootstrap: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const guestSession = isGuestEmail(email);
  const sqlEmail = email ?? "your-email@example.com";

  const messages: Record<string, { title: string; body: string }> = {
    not_authenticated: {
      title: "Sign in required",
      body: "Sign in first, then return here to set up admin access.",
    },
    no_profile: {
      title: "Database not set up yet",
      body: "Run supabase/BOOTSTRAP_MIN.sql in Supabase SQL Editor, then refresh this page.",
    },
    pending_approval: {
      title: "Account pending approval",
      body: canBootstrap
        ? "No admin exists yet. Click the button below to become the first admin."
        : "An admin must approve your account in the Users tab.",
    },
    not_admin: {
      title: "Admin role required",
      body: canBootstrap
        ? "No admin exists yet. Click below to grant yourself admin access and open the control center."
        : "Your account is approved but not an admin. Ask an existing admin to promote you.",
    },
    blocked: {
      title: "Account restricted",
      body: `Your account status is "${approvalStatus ?? "restricted"}".`,
    },
  };

  const info = messages[reason] ?? {
    title: "403 Unauthorized",
    body: "This area is restricted to approved administrators only.",
  };

  const showBootstrap =
    canBootstrap && (reason === "not_admin" || reason === "pending_approval" || reason === "no_profile");

  async function grantAdminAccess() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/bootstrap", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not grant admin access");
        return;
      }
      router.refresh();
      router.push("/admin");
    } catch {
      setError("Network error. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="landing-canvas flex min-h-screen items-center justify-center px-4 py-12">
      <div className="page-glow pointer-events-none absolute inset-0 -z-10" />
      <div className="premium-card max-w-2xl p-8 text-center sm:p-10">
        <p className="text-label">Admin Control Center</p>
        <h1 className="text-heading-page mt-3">{info.title}</h1>
        <p className="text-lead mt-4">{info.body}</p>

        {(email || role || approvalStatus) && (
          <div className="mt-6 rounded-2xl border border-primary/15 bg-primary/7 px-4 py-3 text-left text-sm font-semibold text-foreground/68">
            {email && <p>Email: {email}</p>}
            {role && <p>Role: {role}</p>}
            {approvalStatus && <p>Status: {approvalStatus}</p>}
          </div>
        )}

        {error && (
          <p className="mt-4 rounded-2xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm font-semibold text-destructive">
            {error}
          </p>
        )}

        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          {showBootstrap ? (
            <Button className="btn-cta" onClick={grantAdminAccess} disabled={loading}>
              {loading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <ShieldCheck className="size-4" />
              )}
              {loading ? "Setting up…" : "Grant admin access"}
            </Button>
          ) : reason === "not_authenticated" ? (
            <Link href="/login?next=/admin">
              <Button className="btn-cta">Sign in</Button>
            </Link>
          ) : (
            <Link href="/admin">
              <Button className="btn-cta">Refresh</Button>
            </Link>
          )}

          {!showBootstrap && guestSession && reason !== "not_authenticated" && (
            <Link href="/login?next=/admin">
              <Button variant="outline">Sign in with Google or email</Button>
            </Link>
          )}

          <Link href="/">
            <Button variant="outline">Back to home</Button>
          </Link>
        </div>

        {!showBootstrap && (reason === "pending_approval" || reason === "not_admin") && (
          <div className="mt-6 text-left">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-foreground/45">
              Or run in Supabase SQL Editor
            </p>
            <pre className="mt-3 overflow-x-auto rounded-2xl bg-black/5 p-4 text-left text-xs dark:bg-white/[0.045]">
              {promotionSql(sqlEmail)}
            </pre>
          </div>
        )}

        {reason === "no_profile" && !canBootstrap && (
          <p className="mt-6 text-sm font-medium text-foreground/55">
            File: <code className="text-primary">supabase/BOOTSTRAP_MIN.sql</code>
          </p>
        )}
      </div>
    </div>
  );
}
