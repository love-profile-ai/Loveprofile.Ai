"use client";

import { use, useEffect, useState } from "react";
import { AppHeader } from "@/components/shared/app-header";
import { PageShell } from "@/components/shared/page-shell";
import { ReportDashboard } from "@/components/report/report-dashboard";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth";
import type { ReportRecord } from "@/types/report";

export default function ReportPage({
  params,
}: {
  params: Promise<{ reportId: string }>;
}) {
  const { reportId } = use(params);
  useAuth();
  const [report, setReport] = useState<ReportRecord | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch(`/api/reports/${reportId}`)
      .then((r) => {
        if (!r.ok) throw new Error("Not found");
        return r.json();
      })
      .then(setReport)
      .catch(() => setError(true));
  }, [reportId]);

  return (
    <PageShell wide className="pb-16">
      <AppHeader />
      <main>
        {error && (
          <div className="py-24 text-center font-medium">
            <p>Report not found.</p>
          </div>
        )}
        {!report && !error && (
          <div className="space-y-4 py-10">
            <Skeleton className="h-8 w-1/2" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="glass-card h-48 w-full" />
            <Skeleton className="glass-card h-48 w-full" />
          </div>
        )}
        {report && <ReportDashboard report={report} />}
      </main>
    </PageShell>
  );
}
