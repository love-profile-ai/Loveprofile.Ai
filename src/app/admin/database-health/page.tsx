"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { AppHeader } from "@/components/shared/app-header";
import { PageShell } from "@/components/shared/page-shell";
import { Button } from "@/components/ui/button";
import type { DatabaseHealthReport } from "@/lib/engine/database-health";
import {
  AlertTriangle,
  CheckCircle2,
  Database,
  Loader2,
  RefreshCw,
  Wrench,
  XCircle,
} from "lucide-react";

interface LoaderInfo {
  source: string;
  count: number;
  warning?: string;
}

function StatusIcon({ status }: { status: "ok" | "warn" | "error" }) {
  if (status === "ok") return <CheckCircle2 className="size-5 text-sage" />;
  if (status === "warn") return <AlertTriangle className="size-5 text-gold" />;
  return <XCircle className="size-5 text-flag-red" />;
}

export default function DatabaseHealthPage() {
  const [report, setReport] = useState<DatabaseHealthReport | null>(null);
  const [loader, setLoader] = useState<Record<string, LoaderInfo> | null>(null);
  const [loading, setLoading] = useState(true);
  const [repairing, setRepairing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastActions, setLastActions] = useState<string[]>([]);

  const fetchHealth = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/database-health");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to load diagnostics");
      setReport(data.report);
      setLoader(data.loader ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHealth();
  }, [fetchHealth]);

  async function runRepair() {
    setRepairing(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/database-health", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "repair" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Repair failed");
      setReport(data.report);
      setLastActions(data.actions ?? []);
      await fetchHealth();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Repair failed");
    } finally {
      setRepairing(false);
    }
  }

  return (
    <PageShell wide className="pb-16 pt-4">
      <AppHeader />
      <main className="py-8">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-label">Admin diagnostics</p>
            <h1 className="text-heading-page mt-2">Database Health</h1>
            <p className="text-lead mt-3 max-w-2xl">
              Adaptive question bank, migrations, RLS, and assessment table status.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" onClick={fetchHealth} disabled={loading}>
              <RefreshCw className={`mr-2 size-4 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Button className="btn-cta" onClick={runRepair} disabled={repairing}>
              {repairing ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : (
                <Wrench className="mr-2 size-4" />
              )}
              Run repair
            </Button>
            <Link href="/admin">
              <Button variant="ghost">← Admin</Button>
            </Link>
          </div>
        </div>

        {error && (
          <p className="mb-6 rounded-3xl border border-destructive/25 bg-destructive/8 px-5 py-4 text-sm font-semibold text-destructive">
            {error}
          </p>
        )}

        {loading && !report ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="size-8 animate-spin text-primary" />
          </div>
        ) : report ? (
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="premium-card p-5 text-center">
                <p className="text-3xl font-semibold text-sage">{report.summary.ok}</p>
                <p className="text-label mt-2">Passing</p>
              </div>
              <div className="premium-card p-5 text-center">
                <p className="text-3xl font-semibold text-gold">{report.summary.warn}</p>
                <p className="text-label mt-2">Warnings</p>
              </div>
              <div className="premium-card p-5 text-center">
                <p className="text-3xl font-semibold text-flag-red">{report.summary.error}</p>
                <p className="text-label mt-2">Errors</p>
              </div>
            </div>

            {loader && (
              <div className="premium-card p-6">
                <h2 className="font-display text-xl font-semibold">Question loader status</h2>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {Object.entries(loader).map(([path, info]) => (
                    <div key={path} className="glass-card rounded-2xl p-4">
                      <p className="text-xs font-bold uppercase tracking-wider text-foreground/50">
                        {path}
                      </p>
                      <p className="mt-2 font-semibold">
                        {info.source === "supabase"
                          ? `✓ Loaded ${info.count} questions from Supabase`
                          : `⚠ Using seed fallback (${info.count} questions)`}
                      </p>
                      {info.warning && (
                        <p className="mt-2 text-sm text-foreground/60">{info.warning}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="premium-card p-6">
              <div className="flex items-center gap-3">
                <Database className="size-5 text-primary" />
                <h2 className="font-display text-xl font-semibold">Health checks</h2>
              </div>
              <ul className="mt-5 space-y-3">
                {report.checks.map((check) => (
                  <li
                    key={check.id}
                    className="flex items-start gap-3 rounded-2xl border border-border/60 px-4 py-3"
                  >
                    <StatusIcon status={check.status} />
                    <div>
                      <p className="font-semibold">{check.label}</p>
                      <p className="text-sm text-foreground/60">{check.detail}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <div className="premium-card p-6">
                <h2 className="font-display text-xl font-semibold">Question bank stats</h2>
                <dl className="mt-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-foreground/60">Total questions</dt>
                    <dd className="font-semibold">{report.questionStats.total}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-foreground/60">Dimensions</dt>
                    <dd className="font-semibold">{report.questionStats.dimensions}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-foreground/60">do_i_love_someone</dt>
                    <dd className="font-semibold">
                      {report.questionStats.byPath.do_i_love_someone ?? 0}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-foreground/60">does_someone_love_me</dt>
                    <dd className="font-semibold">
                      {report.questionStats.byPath.does_someone_love_me ?? 0}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-foreground/60">Duplicate IDs</dt>
                    <dd className="font-semibold">
                      {report.questionStats.duplicateIds.length || "None"}
                    </dd>
                  </div>
                </dl>
              </div>

              <div className="premium-card p-6">
                <h2 className="font-display text-xl font-semibold">Problems found</h2>
                {report.problems.length === 0 ? (
                  <p className="mt-4 text-sm font-medium text-sage">
                    No problems detected.
                  </p>
                ) : (
                  <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-foreground/70">
                    {report.problems.map((p) => (
                      <li key={p}>{p}</li>
                    ))}
                  </ul>
                )}
                {lastActions.length > 0 && (
                  <div className="mt-6 border-t border-border/60 pt-4">
                    <p className="text-label">Last repair actions</p>
                    <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-foreground/65">
                      {lastActions.map((a) => (
                        <li key={a}>{a}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>

            {report.summary.error > 0 && (
              <div className="premium-card border border-gold/30 bg-gold/5 p-6">
                <h2 className="font-display text-xl font-semibold">Fix database errors</h2>
                <p className="mt-3 text-sm leading-7 text-foreground/70">
                  Migrations 003–007 are missing — the <code className="text-xs">questions</code> table
                  does not exist yet. Choose one option:
                </p>
                <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm leading-7 text-foreground/75">
                  <li>
                    <strong>Automated (recommended):</strong> copy your database password from{" "}
                    <a
                      href="https://supabase.com/dashboard/project/moeeekjnzupjrnvxbrqw/settings/database"
                      target="_blank"
                      rel="noreferrer"
                      className="text-primary underline"
                    >
                      Supabase → Settings → Database
                    </a>
                    , set <code className="text-xs">SUPABASE_DB_PASSWORD</code> in{" "}
                    <code className="text-xs">.env.local</code>, then run{" "}
                    <code className="text-xs">npm run db:setup</code> in the project folder.
                  </li>
                  <li>
                    <strong>Manual SQL:</strong> open Supabase → SQL Editor, paste the contents of{" "}
                    <code className="text-xs">supabase/APPLY_MISSING.sql</code>, run it, then click{" "}
                    <strong>Run repair</strong> above to import questions.
                  </li>
                </ol>
              </div>
            )}

            {report.questionStats.invalidQuestions.length > 0 && (
              <div className="premium-card p-6">
                <h2 className="font-display text-xl font-semibold">Invalid questions</h2>
                <ul className="mt-4 space-y-3">
                  {report.questionStats.invalidQuestions.map((q) => (
                    <li key={q.id} className="rounded-2xl bg-muted/40 px-4 py-3 text-sm">
                      <p className="font-semibold">{q.id}</p>
                      <p className="text-foreground/60">{q.issues.join("; ")}</p>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <p className="text-xs text-foreground/45">
              Generated {new Date(report.generatedAt).toLocaleString()}
            </p>
          </div>
        ) : null}
      </main>
    </PageShell>
  );
}
