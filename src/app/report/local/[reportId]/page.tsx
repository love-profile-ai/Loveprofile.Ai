"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { AppHeader } from "@/components/shared/app-header";
import { PageShell } from "@/components/shared/page-shell";
import { ReportDashboard } from "@/components/report/report-dashboard";
import { getLocalReport, toReportRecord } from "@/lib/local-report";
import type { ReportRecord } from "@/types/report";

export default function LocalReportPage({
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
    <PageShell wide className="pb-16">
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
        {report && (
          <>
            <p className="text-label mb-4 text-primary/60">
              Saved on this device only — sign in from the dashboard to keep reports in the cloud
            </p>
            <ReportDashboard report={report} />
          </>
        )}
      </main>
    </PageShell>
  );
}
