"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { AuthGuard } from "@/components/auth/auth-guard";
import { AppHeader } from "@/components/shared/app-header";
import { PageShell } from "@/components/shared/page-shell";
import { ReportDashboard } from "@/components/report/report-dashboard";
import { getLocalReport, toReportRecord } from "@/lib/local-report";
import type { ReportRecord } from "@/types/report";

function LocalReportContent({
  params,
}: {
  params: Promise<{ reportId: string }>;
}) {
  const { reportId } = use(params);
  const [report, setReport] = useState<ReportRecord | null>(null);

  useEffect(() => {
    const local = getLocalReport(reportId);
    if (local) {
      setReport(toReportRecord(local) as ReportRecord);
    }
  }, [reportId]);

  return (
    <div className="landing-canvas relative min-h-screen">
      <div className="page-glow pointer-events-none absolute inset-0 -z-10" />
      <PageShell wide className="relative pb-16">
        <AppHeader />
        <main>
          {!report && (
            <div className="py-24 text-center">
              <p className="font-medium">Report not found or session expired.</p>
              <Link href="/analyze" className="mt-4 inline-block text-primary hover:underline">
                Start a new analysis
              </Link>
            </div>
          )}
          {report && <ReportDashboard report={report} />}
        </main>
      </PageShell>
    </div>
  );
}

export default function LocalReportPage({
  params,
}: {
  params: Promise<{ reportId: string }>;
}) {
  return (
    <AuthGuard redirectTo="/login">
      <LocalReportContent params={params} />
    </AuthGuard>
  );
}
