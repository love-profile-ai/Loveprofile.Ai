"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Clock,
  Loader2,
  LogOut,
  Mail,
  PartyPopper,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { SITE_NAME, SUPPORT_EMAIL } from "@/lib/site";

interface AccessState {
  authenticated: boolean;
  allowed: boolean;
  role: string;
  is_guest?: boolean;
  approval_status: string;
  admin_notes?: string | null;
  maintenance?: {
    enabled?: boolean;
    reason?: string;
    estimatedReturn?: string;
    contactEmail?: string;
  };
}

/** Always reachable without signing in */
const PUBLIC_PATHS = ["/"];

/** Auth pages — no approval check */
const BYPASS_PREFIXES = [
  "/admin",
  "/login",
  "/auth",
  "/api",
  "/_next",
  "/robots.txt",
  "/sitemap.xml",
];

/** App pages — sign in + admin approval required */
const PROTECTED_PREFIXES = ["/disclaimer", "/analyze", "/dashboard", "/report"];

function isPublicPath(pathname: string) {
  return PUBLIC_PATHS.includes(pathname);
}

function isProtectedPath(pathname: string) {
  return PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

function SignInRequiredPage({ nextPath }: { nextPath: string }) {
  return (
    <div className="landing-canvas flex min-h-screen items-center justify-center px-4 py-12">
      <div className="dot-grid pointer-events-none absolute inset-0 -z-10" />
      <div className="page-glow pointer-events-none absolute inset-0 -z-10" />
      <div className="premium-card max-w-xl p-8 text-center sm:p-12">
        <div className="mx-auto flex size-20 items-center justify-center rounded-full border border-coral/25 bg-gradient-to-br from-primary/20 via-lavender/15 to-coral/15 text-primary shadow-2xl shadow-primary/20">
          <PartyPopper className="size-8" />
        </div>
        <p className="text-label mt-8">Step 2 · Sign in</p>
        <h1 className="text-heading-page mt-3">Sign in to continue</h1>
        <p className="text-lead mx-auto mt-5 max-w-md">
          Start on the landing page, sign in with Google or email, then wait for
          admin approval before using the app.
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link href={`/login?next=${encodeURIComponent(nextPath)}`}>
            <Button className="btn-cta">Go to sign in</Button>
          </Link>
          <Link href="/">
            <Button variant="outline">Back to landing</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

function GuestDisabledPage() {
  const [signingOut, setSigningOut] = useState(false);

  async function handleSignOut() {
    setSigningOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  return (
    <div className="landing-canvas flex min-h-screen items-center justify-center px-4 py-12">
      <div className="dot-grid pointer-events-none absolute inset-0 -z-10" />
      <div className="page-glow pointer-events-none absolute inset-0 -z-10" />
      <div className="premium-card max-w-xl p-8 text-center sm:p-12">
        <div className="mx-auto flex size-20 items-center justify-center rounded-full border border-gold/25 bg-gold/12 text-gold shadow-2xl shadow-gold/15">
          <LogOut className="size-8" />
        </div>
        <p className="text-label mt-8">Guest access disabled</p>
        <h1 className="text-heading-page mt-3">Please sign in properly</h1>
        <p className="text-lead mx-auto mt-5 max-w-md">
          Guest accounts are not allowed. Sign out, then sign in with Google or
          email and wait for admin approval.
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Button className="btn-cta" disabled={signingOut} onClick={handleSignOut}>
            {signingOut ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              "Sign out & sign in again"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

function BlockingPage({ access }: { access: AccessState }) {
  const maintenance = access.maintenance?.enabled;
  const rejected = ["rejected", "blocked", "suspended", "inactive"].includes(
    access.approval_status
  );
  const title = maintenance
    ? `${SITE_NAME} is under maintenance`
    : rejected
      ? "Your access is restricted"
      : "Waiting for admin approval";
  const message = maintenance
    ? access.maintenance?.reason ??
      "We will be back soon. Please try again later."
    : rejected
      ? "This account cannot access the app right now. Contact support if you need help."
      : "You signed in successfully. An admin must approve your Google or email account before you can use the website.";

  return (
    <div className="landing-canvas flex min-h-screen items-center justify-center px-4 py-12">
      <div className="dot-grid pointer-events-none absolute inset-0 -z-10" />
      <div className="page-glow pointer-events-none absolute inset-0 -z-10" />
      <div className="premium-card max-w-2xl p-8 text-center sm:p-12">
        <div className="mx-auto flex size-20 items-center justify-center rounded-full border border-primary/15 bg-primary/10 text-primary shadow-2xl shadow-primary/20">
          {maintenance ? <Sparkles className="size-8" /> : <Clock className="size-8" />}
        </div>
        <p className="text-label mt-8">
          {maintenance
            ? "Maintenance"
            : rejected
              ? "Access restricted"
              : "Step 3 · Admin approval"}
        </p>
        <h1 className="text-heading-page mt-3">{title}</h1>
        <p className="text-lead mx-auto mt-5 max-w-lg">{message}</p>

        {!maintenance && access.admin_notes && (
          <p className="mt-5 rounded-2xl border border-primary/15 bg-primary/7 px-4 py-3 text-sm font-semibold text-foreground/68">
            Admin note: {access.admin_notes}
          </p>
        )}

        <div className="mt-8 grid gap-3 text-sm font-semibold text-foreground/62 sm:grid-cols-3">
          <span className="rounded-2xl bg-white/45 p-3 backdrop-blur-xl dark:bg-white/[0.055]">
            1. Landing page
          </span>
          <span className="rounded-2xl bg-white/45 p-3 backdrop-blur-xl dark:bg-white/[0.055]">
            2. Sign in
          </span>
          <span className="rounded-2xl bg-white/45 p-3 backdrop-blur-xl dark:bg-white/[0.055]">
            3. Admin approves
          </span>
        </div>

        <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
          <Button className="btn-cta" onClick={() => window.location.reload()}>
            Check approval status
          </Button>
          <Link href="/">
            <Button variant="outline">Back to landing</Button>
          </Link>
          <Link href={`mailto:${access.maintenance?.contactEmail ?? SUPPORT_EMAIL}`}>
            <Button variant="outline">
              <Mail className="mr-1 size-4" />
              Contact support
            </Button>
          </Link>
        </div>

        <p className="mt-8 inline-flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-foreground/42">
          <ShieldCheck className="size-4 text-primary" />
          Admins can approve users at /admin
        </p>
        <Link href="/admin" className="mt-3 inline-block">
          <Button variant="outline" size="sm">
            Open admin panel
          </Button>
        </Link>
      </div>
    </div>
  );
}

export function ApprovalGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [access, setAccess] = useState<AccessState | null>(null);

  const isPublic = useMemo(() => isPublicPath(pathname), [pathname]);
  const bypass = useMemo(
    () => BYPASS_PREFIXES.some((prefix) => pathname.startsWith(prefix)),
    [pathname]
  );
  const protectedPath = useMemo(() => isProtectedPath(pathname), [pathname]);

  useEffect(() => {
    if (isPublic || bypass) return;

    let cancelled = false;

    async function loadAccess() {
      try {
        const res = await fetch("/api/me/access");
        const data = (await res.json()) as AccessState;
        if (!cancelled) setAccess(data);
      } catch {
        if (!cancelled) {
          setAccess({
            authenticated: false,
            allowed: false,
            role: "anonymous",
            approval_status: "unknown",
          });
        }
      }
    }

    loadAccess();

    const interval = window.setInterval(() => {
      if (!cancelled) loadAccess();
    }, 30000);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [bypass, isPublic, pathname]);

  useEffect(() => {
    if (isPublic || bypass || !protectedPath || !access) return;
    if (!access.authenticated) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    }
  }, [access, bypass, isPublic, pathname, protectedPath, router]);

  if (isPublic || bypass) {
    return <>{children}</>;
  }

  if (!access) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  if (protectedPath && !access.authenticated) {
    return <SignInRequiredPage nextPath={pathname} />;
  }

  if (access.authenticated) {
    if (access.is_guest || access.approval_status === "guest_disabled") {
      return <GuestDisabledPage />;
    }

    if (!access.allowed) {
      return <BlockingPage access={access} />;
    }
  }

  return <>{children}</>;
}
