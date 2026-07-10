"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AppHeader } from "@/components/shared/app-header";
import { PageShell } from "@/components/shared/page-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useAuth,
  signInWithGoogle,
  signInWithEmail,
  signOut,
} from "@/hooks/use-auth";
import { createClient } from "@/lib/supabase/client";
import {
  ArrowRight,
  CalendarHeart,
  HeartHandshake,
  LineChart,
  LockKeyhole,
  Pencil,
  Plus,
  Sparkles,
  Trash2,
  Trophy,
} from "lucide-react";

interface ReportSummary {
  id: string;
  title: string;
  path: string;
  confidence: string;
  created_at: string;
}

export default function DashboardPage() {
  useAuth();
  const [reports, setReports] = useState<ReportSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [emailSent, setEmailSent] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUserEmail(user?.email ?? null);
    });

    fetch("/api/reports")
      .then((r) => r.json())
      .then((data) => setReports(data.reports ?? []))
      .finally(() => setLoading(false));
  }, []);

  const metrics = useMemo(
    () => [
      {
        label: "Saved reports",
        value: String(reports.length),
        icon: CalendarHeart,
      },
      {
        label: "Reflection streak",
        value: reports.length > 0 ? "Active" : "New",
        icon: Trophy,
      },
      {
        label: "Private mode",
        value: userEmail ? "Synced" : "Guest",
        icon: LockKeyhole,
      },
    ],
    [reports.length, userEmail]
  );

  async function handleDelete(id: string) {
    await fetch(`/api/reports/${id}`, { method: "DELETE" });
    setReports((prev) => prev.filter((r) => r.id !== id));
  }

  async function handleRename(id: string, currentTitle: string) {
    const title = prompt("Rename report:", currentTitle);
    if (!title) return;
    await fetch(`/api/reports/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title }),
    });
    setReports((prev) =>
      prev.map((r) => (r.id === id ? { ...r, title } : r))
    );
  }

  return (
    <PageShell wide className="pb-16 pt-4">
      <AppHeader />
      <main className="py-6 sm:py-10">
        <section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="premium-card p-7 sm:p-9">
            <p className="text-label">Relationship workspace</p>
            <h1 className="text-heading-page mt-3">
              Welcome back to your <em className="text-display-accent">private insights.</em>
            </h1>
            <p className="text-lead mt-5 max-w-2xl">
              Review your analyses, start a new reflection, and track how your
              emotional clarity evolves over time.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/analyze">
                <Button className="btn-cta h-12 px-6">
                  <Plus className="mr-1 size-4" />
                  New Analysis
                </Button>
              </Link>
              <Link href="/disclaimer">
                <Button variant="outline" className="h-12 px-6">
                  Review disclaimer
                  <ArrowRight className="ml-1 size-4" />
                </Button>
              </Link>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
            {metrics.map((metric) => (
              <div key={metric.label} className="premium-card p-5">
                <div className="flex items-center justify-between">
                  <span className="flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <metric.icon className="size-5" />
                  </span>
                  <p className="font-display text-2xl font-semibold">{metric.value}</p>
                </div>
                <p className="mt-4 text-[11px] font-bold uppercase tracking-[0.2em] text-foreground/45">
                  {metric.label}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <Card className="premium-card">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <span className="flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <HeartHandshake className="size-5" />
                </span>
                <div>
                  <p className="text-label">Account</p>
                  <h2 className="font-display text-2xl font-semibold">
                    {userEmail ? "Synced account" : "Guest reflection"}
                  </h2>
                </div>
              </div>

              <p className="mt-4 text-sm font-medium leading-7 text-foreground/62">
                {userEmail
                  ? `Signed in as ${userEmail}`
                  : "You are using guest mode. Sign in to save reports across devices."}
              </p>

              <div className="mt-5 flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    setAuthError(null);
                    const result = await signInWithGoogle("/dashboard");
                    if (!result.ok) {
                      setAuthError(result.error);
                      return;
                    }
                    if (result.method === "guest") {
                      const supabase = createClient();
                      const { data: { user } } = await supabase.auth.getUser();
                      setUserEmail(user?.email ?? null);
                    }
                  }}
                >
                  Continue with Google
                </Button>
                {!emailSent ? (
                  <form
                    className="flex flex-1 flex-col gap-2 sm:flex-row"
                    onSubmit={async (e) => {
                      e.preventDefault();
                      setAuthError(null);
                      const result = await signInWithEmail(email, "/dashboard");
                      if (!result.ok) {
                        setAuthError(result.error);
                        return;
                      }
                      if (result.method === "guest") {
                        const supabase = createClient();
                        const { data: { user } } = await supabase.auth.getUser();
                        setUserEmail(user?.email ?? null);
                        return;
                      }
                      setEmailSent(true);
                    }}
                  >
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Email for magic link"
                      className="premium-input h-9 min-w-0 flex-1 rounded-full text-sm"
                      required
                    />
                    <Button type="submit" variant="outline" size="sm">
                      Email link
                    </Button>
                  </form>
                ) : (
                  <p className="text-sm font-semibold text-primary">
                    Check your email for a sign-in link.
                  </p>
                )}
                {userEmail && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={async () => {
                      setAuthError(null);
                      const result = await signOut();
                      if (result.ok) {
                        setUserEmail(null);
                        setEmailSent(false);
                      } else {
                        setAuthError(result.error);
                      }
                    }}
                  >
                    Sign out
                  </Button>
                )}
              </div>
              {authError && (
                <p className="mt-4 rounded-2xl border border-destructive/25 bg-destructive/8 px-4 py-3 text-sm font-semibold text-destructive">
                  {authError}
                </p>
              )}
            </CardContent>
          </Card>

          <Card className="premium-card">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <span className="flex size-11 items-center justify-center rounded-2xl bg-gold/14 text-gold">
                  <LineChart className="size-5" />
                </span>
                <div>
                  <p className="text-label">Compatibility history</p>
                  <h2 className="font-display text-2xl font-semibold">
                    Progress Timeline
                  </h2>
                </div>
              </div>
              <div className="mt-6 space-y-3">
                {reports.slice(0, 3).map((report, i) => (
                  <div key={report.id} className="flex items-center gap-3 rounded-2xl bg-white/42 p-3 dark:bg-white/[0.045]">
                    <span className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                      {i + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold">{report.title}</p>
                      <p className="text-xs font-semibold text-foreground/45">
                        {new Date(report.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <span className="text-xs font-bold text-primary">
                      {report.confidence}
                    </span>
                  </div>
                ))}
                {!loading && reports.length === 0 && (
                  <p className="rounded-2xl border border-dashed border-primary/20 bg-primary/7 p-5 text-sm font-semibold text-foreground/58">
                    Your timeline will appear after your first report.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="mt-8">
          <div className="mb-4 flex items-center justify-between gap-4">
            <div>
              <p className="text-label">Saved Reports</p>
              <h2 className="font-display text-3xl font-semibold">Recent analyses</h2>
            </div>
            <Sparkles className="size-5 text-primary/60" />
          </div>

          <div className="grid gap-4">
            {loading &&
              Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-28 rounded-[1.5rem]" />
              ))}

            {!loading && reports.length === 0 && (
              <Card className="premium-card">
                <CardContent className="py-14 text-center">
                  <p className="font-display text-2xl font-semibold">
                    No analyses yet
                  </p>
                  <p className="mx-auto mt-2 max-w-sm text-sm font-medium leading-7 text-foreground/58">
                    Start your first reflection and your reports will appear here.
                  </p>
                  <Link href="/analyze" className="mt-6 inline-block">
                    <Button className="btn-cta">
                      Start now
                      <ArrowRight className="ml-1 size-4" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )}

            {reports.map((report) => (
              <Card key={report.id} className="premium-card">
                <CardContent className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <Link
                      href={`/report/${report.id}`}
                      className="font-display text-2xl font-semibold tracking-[-0.02em] transition-colors hover:text-primary"
                    >
                      {report.title}
                    </Link>
                    <p className="mt-2 text-[11px] font-bold uppercase tracking-[0.18em] text-foreground/45">
                      {new Date(report.created_at).toLocaleDateString()} ·{" "}
                      {report.confidence} confidence ·{" "}
                      {report.path === "i_like_someone"
                        ? "Do I Love Someone?"
                        : "Does Someone Love Me?"}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRename(report.id, report.title)}
                      aria-label="Rename report"
                    >
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(report.id)}
                      aria-label="Delete report"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </main>
    </PageShell>
  );
}
