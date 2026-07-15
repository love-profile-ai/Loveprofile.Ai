"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Loader2 } from "lucide-react";

export function AuthGuard({
  children,
  redirectTo = "/login",
}: {
  children: React.ReactNode;
  redirectTo?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);
  const [authed, setAuthed] = useState(false);
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();

    const timeout = window.setTimeout(() => {
      if (!cancelled) setTimedOut(true);
    }, 12000);

    supabase.auth
      .getSession()
      .then(({ data: { session } }) => {
        if (cancelled) return;
        window.clearTimeout(timeout);
        if (session) {
          setAuthed(true);
          setReady(true);
        } else {
          const loginUrl =
            redirectTo.includes("?")
              ? redirectTo
              : `${redirectTo}?next=${encodeURIComponent(pathname)}`;
          router.replace(loginUrl);
        }
      })
      .catch(() => {
        if (cancelled) return;
        window.clearTimeout(timeout);
        setTimedOut(true);
        setReady(true);
      });

    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
    };
  }, [router, redirectTo, pathname]);

  if (timedOut && !authed) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
        <p className="max-w-sm text-sm font-medium text-foreground/70">
          We couldn&apos;t verify your session. This can happen if sign-in isn&apos;t
          configured yet on the server.
        </p>
        <Link
          href={`/login?next=${encodeURIComponent(pathname)}`}
          className="inline-flex h-10 items-center justify-center rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground"
        >
          Try again
        </Link>
      </div>
    );
  }

  if (!ready || !authed) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  return <>{children}</>;
}
