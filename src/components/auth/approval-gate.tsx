"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Clock, Mail, ShieldCheck, Sparkles } from "lucide-react";
import { SITE_NAME, SUPPORT_EMAIL } from "@/lib/site";

interface AccessState {
  authenticated: boolean;
  allowed: boolean;
  role: string;
  approval_status: string;
  admin_notes?: string | null;
  maintenance?: {
    enabled?: boolean;
    reason?: string;
    estimatedReturn?: string;
    contactEmail?: string;
  };
}

const PUBLIC_PREFIXES = [
  "/admin",
  "/login",
  "/auth",
  "/api",
  "/_next",
  "/robots.txt",
  "/sitemap.xml",
];

function BlockingPage({ access }: { access: AccessState }) {
  const maintenance = access.maintenance?.enabled;
  const title = maintenance
    ? `${SITE_NAME} is under gentle maintenance`
    : "Your account is currently under review";
  const message = maintenance
    ? access.maintenance?.reason ??
      "We are polishing the experience and will be back soon."
    : "Our team is verifying your registration. You will gain access immediately after approval.";

  return (
    <div className="landing-canvas flex min-h-screen items-center justify-center px-4 py-12">
      <div className="dot-grid pointer-events-none absolute inset-0 -z-10" />
      <div className="page-glow pointer-events-none absolute inset-0 -z-10" />
      <div className="premium-card max-w-2xl p-8 text-center sm:p-12">
        <div className="mx-auto flex size-20 items-center justify-center rounded-full border border-primary/15 bg-primary/10 text-primary shadow-2xl shadow-primary/20">
          {maintenance ? <Sparkles className="size-8" /> : <Clock className="size-8" />}
        </div>
        <p className="text-label mt-8">
          {maintenance ? "Maintenance Mode" : "Pending Approval"}
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
            Secure review
          </span>
          <span className="rounded-2xl bg-white/45 p-3 backdrop-blur-xl dark:bg-white/[0.055]">
            Usually quick
          </span>
          <span className="rounded-2xl bg-white/45 p-3 backdrop-blur-xl dark:bg-white/[0.055]">
            Access updates automatically
          </span>
        </div>

        <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
          <Button
            className="btn-cta"
            onClick={() => window.location.reload()}
          >
            Check again
          </Button>
          <Link href={`mailto:${access.maintenance?.contactEmail ?? SUPPORT_EMAIL}`}>
            <Button variant="outline">
              <Mail className="mr-1 size-4" />
              Contact support
            </Button>
          </Link>
        </div>

        <p className="mt-8 inline-flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-foreground/42">
          <ShieldCheck className="size-4 text-primary" />
          Admin access remains available
        </p>
        <Link href="/admin" className="mt-3 inline-block">
          <Button variant="outline" size="sm">
            Go to Admin
          </Button>
        </Link>
      </div>
    </div>
  );
}

export function ApprovalGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [access, setAccess] = useState<AccessState | null>(null);
  const bypass = useMemo(
    () => PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix)),
    [pathname]
  );

  useEffect(() => {
    if (bypass) return;
    let cancelled = false;
    fetch("/api/me/access")
      .then((res) => res.json())
      .then((data: AccessState) => {
        if (!cancelled) setAccess(data);
      })
      .catch(() => {
        if (!cancelled) {
          setAccess({
            authenticated: false,
            allowed: true,
            role: "guest",
            approval_status: "anonymous",
          });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [bypass, pathname]);

  if (bypass) return <>{children}</>;
  if (!access) return <>{children}</>;
  if (!access.allowed) return <BlockingPage access={access} />;
  return <>{children}</>;
}
