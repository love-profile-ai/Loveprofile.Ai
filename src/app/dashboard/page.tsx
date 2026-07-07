"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AppHeader } from "@/components/shared/app-header";
import { PageShell } from "@/components/shared/page-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth, signInWithGoogle, signInWithEmail, signOut } from "@/hooks/use-auth";
import { createClient } from "@/lib/supabase/client";
import { Trash2, Pencil, Plus } from "lucide-react";

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
    <PageShell wide className="pb-16 pt-2">
      <AppHeader />
      <main className="py-10 sm:py-14">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-heading-page">
            Your <em className="text-display-accent">Analyses</em>
          </h1>
          <Link href="/analyze">
            <Button className="btn-cta text-btn-label rounded-full px-6">
              <Plus className="mr-1 size-4" />
              New Analysis
            </Button>
          </Link>
        </div>

        <Card className="glass-card mt-8">
          <CardHeader>
            <CardTitle className="font-display text-lg font-bold">Account</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {userEmail ? (
              <p className="text-base font-medium text-foreground/70">
                Signed in as {userEmail}
              </p>
            ) : (
              <p className="text-base font-medium text-foreground/70">
                You&apos;re using guest mode. Sign in to save reports across devices.
              </p>
            )}
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                className="text-btn-label rounded-full"
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
                  className="flex gap-2"
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
                    className="rounded-lg border border-primary/20 px-3 py-1.5 text-sm font-medium"
                    required
                  />
                  <Button type="submit" variant="outline" size="sm" className="text-btn-label rounded-full">
                    Email link
                  </Button>
                </form>
              ) : (
                <p className="text-sm font-medium text-green-600">Check your email for a sign-in link.</p>
              )}
              {userEmail && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-btn-label"
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
              <p className="rounded-xl border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm font-medium text-destructive">
                {authError}
              </p>
            )}
          </CardContent>
        </Card>

        <div className="mt-8 space-y-4">
          {loading &&
            Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="glass-card h-24 w-full" />
            ))}

          {!loading && reports.length === 0 && (
            <Card className="glass-card">
              <CardContent className="py-12 text-center text-base font-medium text-foreground/65">
                No analyses yet. Start your first one.
              </CardContent>
            </Card>
          )}

          {reports.map((report) => (
            <Card key={report.id} className="glass-card transition-all hover:border-primary/30 hover:shadow-lg hover:shadow-primary/10">
              <CardContent className="flex items-center justify-between py-5">
                <div>
                  <Link
                    href={`/report/${report.id}`}
                    className="font-display text-lg font-bold hover:text-primary"
                  >
                    {report.title}
                  </Link>
                  <p className="text-label mt-1 text-primary/55">
                    {new Date(report.created_at).toLocaleDateString()} ·{" "}
                    {report.confidence} confidence ·{" "}
                    {report.path === "i_like_someone"
                      ? "Do I love someone?"
                      : "Does someone love me?"}
                  </p>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRename(report.id, report.title)}
                  >
                    <Pencil className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(report.id)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </PageShell>
  );
}
