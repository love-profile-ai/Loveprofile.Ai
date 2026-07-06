"use client";

import Link from "next/link";
import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  ConfidenceBarsDecor,
  ConfidenceMeter,
} from "@/components/report/confidence-meter";
import { FlagsList } from "@/components/report/section-card";
import { FollowUpChat } from "@/components/report/follow-up-chat";
import type { ReportRecord } from "@/types/report";
import { normalizeReport } from "@/lib/ai/normalize-report";
import { getReportThemeTitle } from "@/lib/report-theme";
import {
  Download,
  Eye,
  Flag,
  Heart,
  Pencil,
  Plus,
  Rocket,
  Share2,
  Shield,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";

const MAX_FLAGS = 4;
const MAX_STEPS = 4;

function trimList(items: string[], max: number) {
  if (items.length <= max) return { shown: items, extra: 0 };
  return { shown: items.slice(0, max), extra: items.length - max };
}

function SectionHeader({
  icon: Icon,
  title,
  iconClass,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  iconClass: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className={cn("report-section-icon", iconClass)}>
        <Icon className="size-5" />
      </span>
      <h2 className="font-display text-xl font-bold text-foreground">{title}</h2>
    </div>
  );
}

export function ReportDashboard({ report }: { report: ReportRecord }) {
  const analysis = normalizeReport(report.analysis);
  const themeTitle = getReportThemeTitle(analysis);
  const isLocal = report.user_id === "local";
  const [title, setTitle] = useState(report.title);
  const [editing, setEditing] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);

  const greenFlags = trimList(analysis.green_flags, MAX_FLAGS);
  const redFlags = trimList(analysis.red_flags, MAX_FLAGS);
  const nextSteps = trimList(analysis.gentle_next_steps, MAX_STEPS);
  const noticedText = analysis.what_we_noticed.join(" ");

  async function handleRename() {
    if (isLocal) {
      setEditing(false);
      return;
    }
    await fetch(`/api/reports/${report.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title }),
    });
    setEditing(false);
  }

  async function handleShare() {
    if (isLocal) return;
    const res = await fetch(`/api/reports/${report.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_public: true }),
    });
    const data = await res.json();
    const url = `${window.location.origin}/share/${data.share_token}`;
    setShareUrl(url);
    await navigator.clipboard.writeText(url);
  }

  function handleDownload() {
    const content = JSON.stringify(
      { title, analysis, created_at: report.created_at },
      null,
      2
    );
    const blob = new Blob([content], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${title.replace(/\s+/g, "-").toLowerCase()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="pb-16 pt-2">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="sr-only">
          {editing ? (
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={handleRename}
              autoFocus
            />
          ) : (
            <h1>{title}</h1>
          )}
        </div>
        <div className="flex flex-wrap gap-2 sm:ml-auto">
          {!isLocal && (
            <Button
              variant="outline"
              size="sm"
              className="text-btn-label rounded-full"
              onClick={handleShare}
            >
              <Share2 className="mr-1 size-4" />
              Share
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            className="text-btn-label rounded-full"
            onClick={handleDownload}
          >
            <Download className="mr-1 size-4" />
            Download
          </Button>
          <Link href="/analyze">
            <Button size="sm" className="btn-cta text-btn-label rounded-full">
              <Plus className="mr-1 size-4" />
              New
            </Button>
          </Link>
          {!isLocal && !editing && (
            <Button
              variant="ghost"
              size="sm"
              className="rounded-full"
              onClick={() => setEditing(true)}
              aria-label="Rename report"
            >
              <Pencil className="size-4" />
            </Button>
          )}
        </div>
      </div>

      {shareUrl && (
        <p className="glass-card mb-6 px-4 py-3 text-sm font-medium">
          Share link copied: {shareUrl}
        </p>
      )}

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="report-canvas"
      >
        <div className="pointer-events-none absolute inset-0 report-blob-pink opacity-80" />
        <div className="pointer-events-none absolute -left-20 top-1/3 size-64 rounded-full report-blob-green blur-2xl" />
        <div className="pointer-events-none absolute -right-16 bottom-20 size-56 rounded-full report-blob-orange blur-2xl" />

        <div className="relative p-6 sm:p-10">
          <div className="flex items-center gap-2 text-sm font-semibold text-primary/80">
            <Sparkles className="size-4" />
            Relationship Analysis Report
          </div>

          <div className="mt-6 flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-2xl flex-1">
              <h1 className="flex items-center gap-2 font-display text-3xl font-bold tracking-tight sm:text-4xl">
                {themeTitle}
                <Heart className="size-6 fill-primary/20 text-primary" />
              </h1>
              <p className="mt-4 text-base font-medium leading-relaxed text-foreground/70 sm:text-lg">
                {analysis.summary}
              </p>
              <div className="mt-8">
                <ConfidenceMeter confidence={analysis.confidence} variant="ring" />
              </div>
            </div>
            <ConfidenceBarsDecor />
          </div>

          {(greenFlags.shown.length > 0 || redFlags.shown.length > 0) && (
            <div className="mt-10 grid gap-5 md:grid-cols-2">
              <div className="relative overflow-hidden rounded-2xl border border-green-200/50 bg-green-50/50 p-6 dark:border-green-900/30 dark:bg-green-950/25">
                <div className="pointer-events-none absolute -bottom-8 -right-8 size-32 rounded-full bg-green-200/30 blur-2xl" />
                <SectionHeader
                  icon={Flag}
                  title="Green Flags"
                  iconClass="bg-green-500"
                />
                <div className="relative mt-4">
                  <FlagsList flags={greenFlags.shown} type="green" />
                  {greenFlags.extra > 0 && (
                    <p className="mt-3 text-xs font-medium text-green-700/70">
                      +{greenFlags.extra} more
                    </p>
                  )}
                </div>
              </div>

              <div className="relative overflow-hidden rounded-2xl border border-red-200/50 bg-red-50/40 p-6 dark:border-red-900/30 dark:bg-red-950/20">
                <div className="pointer-events-none absolute -bottom-8 -right-8 size-32 rounded-full bg-red-200/30 blur-2xl" />
                <SectionHeader
                  icon={Flag}
                  title="Red Flags"
                  iconClass="bg-rose-500"
                />
                <div className="relative mt-4">
                  <FlagsList flags={redFlags.shown} type="red" />
                  {redFlags.extra > 0 && (
                    <p className="mt-3 text-xs font-medium text-red-600/70">
                      +{redFlags.extra} more
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {noticedText && (
            <div className="relative mt-8 overflow-hidden rounded-2xl border border-violet-200/40 bg-violet-50/30 p-6 dark:border-violet-900/30 dark:bg-violet-950/15">
              <div className="pointer-events-none absolute -bottom-10 -right-10 size-40 rounded-full bg-violet-200/25 blur-2xl" />
              <SectionHeader
                icon={Eye}
                title="What We Noticed"
                iconClass="bg-violet-500"
              />
              <p className="relative mt-4 text-base font-medium leading-relaxed text-foreground/75">
                {noticedText}
              </p>
            </div>
          )}

          {nextSteps.shown.length > 0 && (
            <div className="mt-8 overflow-hidden rounded-2xl border border-sky-200/40 bg-sky-50/35 p-6 dark:border-sky-900/30 dark:bg-sky-950/15">
              <SectionHeader
                icon={Rocket}
                title="Gentle Next Steps"
                iconClass="bg-sky-500"
              />
              <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {nextSteps.shown.map((step, i) => (
                  <div
                    key={step}
                    className={cn(
                      "relative px-2 py-1",
                      i > 0 &&
                        "lg:border-l lg:border-dashed lg:border-sky-300/60 dark:lg:border-sky-800/50"
                    )}
                  >
                    <p className="font-display text-2xl font-bold text-sky-600/80 dark:text-sky-400/80">
                      {String(i + 1).padStart(2, "0")}
                    </p>
                    <p className="mt-2 text-sm font-medium leading-relaxed text-foreground/75">
                      {step}
                    </p>
                  </div>
                ))}
              </div>
              {nextSteps.extra > 0 && (
                <p className="mt-4 text-sm font-medium text-foreground/50">
                  +{nextSteps.extra} more in your downloaded report
                </p>
              )}
            </div>
          )}

          {analysis.looking_ahead && (
            <div className="relative mt-8 overflow-hidden rounded-2xl border border-orange-200/45 bg-orange-50/35 p-6 dark:border-orange-900/30 dark:bg-orange-950/15">
              <div className="pointer-events-none absolute -bottom-10 -right-10 size-40 rounded-full bg-orange-200/30 blur-2xl" />
              <SectionHeader
                icon={TrendingUp}
                title="Looking Ahead"
                iconClass="bg-orange-500"
              />
              <p className="relative mt-4 text-base font-medium leading-relaxed text-foreground/75">
                {analysis.looking_ahead}
              </p>
            </div>
          )}

          <div className="mt-10 flex flex-col gap-4 border-t border-primary/10 pt-6 sm:flex-row sm:items-center sm:justify-between">
            <p className="flex max-w-md items-start gap-2 text-xs font-medium leading-relaxed text-foreground/50">
              <Shield className="mt-0.5 size-4 shrink-0 text-primary/50" />
              Disclaimer: This report is generated based on your answers and is
              meant for self-reflection. It should not replace professional
              advice.
            </p>
            <p className="flex items-center gap-1.5 text-sm font-semibold text-primary/70">
              Your relationship. Better understood.
              <Heart className="size-3.5 fill-primary/30 text-primary" />
            </p>
          </div>
        </div>
      </motion.div>

      {!isLocal && (
        <div className="mt-8">
          <FollowUpChat reportId={report.id} />
        </div>
      )}

      <div className="mt-10 text-center">
        <Link href="/analyze">
          <Button variant="outline" className="text-btn-label rounded-full px-6">
            Start another analysis
          </Button>
        </Link>
      </div>
    </div>
  );
}
