"use client";

import Link from "next/link";
import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ConfidenceMeter } from "@/components/report/confidence-meter";
import { SectionCard, FlagsList } from "@/components/report/section-card";
import { FollowUpChat } from "@/components/report/follow-up-chat";
import type { AnalysisReport, ReportRecord } from "@/types/report";
import { Share2, Download, Plus, Pencil } from "lucide-react";

export function ReportDashboard({ report }: { report: ReportRecord }) {
  const analysis = report.analysis as AnalysisReport;
  const isLocal = report.user_id === "local";
  const [title, setTitle] = useState(report.title);
  const [editing, setEditing] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);

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
    const content = JSON.stringify({ title, analysis, created_at: report.created_at }, null, 2);
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
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          {editing ? (
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={handleRename}
              className="font-display text-2xl font-bold bg-transparent border-b border-primary/30 outline-none sm:text-3xl"
              autoFocus
            />
          ) : (
            <h1 className="flex items-center gap-2 font-display text-2xl font-bold sm:text-3xl">
              {title}
              {!isLocal && (
                <button onClick={() => setEditing(true)} aria-label="Rename">
                  <Pencil className="size-4 text-muted-foreground" />
                </button>
              )}
            </h1>
          )}
          <p className="text-label mt-2 text-primary/60">
            {new Date(report.created_at).toLocaleDateString("en-US", {
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {!isLocal && (
            <Button variant="outline" size="sm" className="text-btn-label rounded-full" onClick={handleShare}>
              <Share2 className="mr-1 size-4" />
              Share
            </Button>
          )}
          <Button variant="outline" size="sm" className="text-btn-label rounded-full" onClick={handleDownload}>
            <Download className="mr-1 size-4" />
            Download
          </Button>
          <Link href="/analyze">
            <Button size="sm" className="btn-cta text-btn-label rounded-full">
              <Plus className="mr-1 size-4" />
              New Analysis
            </Button>
          </Link>
        </div>
      </div>

      {shareUrl && (
        <p className="mb-4 glass-card px-4 py-3 text-sm font-medium">
          Share link copied: {shareUrl}
        </p>
      )}

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-6">
        <ConfidenceMeter confidence={analysis.confidence} />
      </motion.div>

      <div className="space-y-4">
        <SectionCard title="Relationship Summary" delay={0.05}>
          <p>{analysis.summary}</p>
        </SectionCard>

        <div className="grid gap-4 sm:grid-cols-2">
          <SectionCard title="Green Flags" delay={0.1}>
            <FlagsList flags={analysis.green_flags} type="green" />
          </SectionCard>
          <SectionCard title="Red Flags" delay={0.15}>
            <FlagsList flags={analysis.red_flags} type="red" />
          </SectionCard>
        </div>

        <SectionCard title="Interest Level" delay={0.2}>
          <p>{analysis.interest_level}</p>
        </SectionCard>

        <SectionCard title="Communication Analysis" delay={0.25}>
          <p>{analysis.communication_analysis}</p>
        </SectionCard>

        <SectionCard title="Emotional Signals" delay={0.3}>
          <p>{analysis.emotional_signals}</p>
        </SectionCard>

        <SectionCard title="Attachment Style" delay={0.35}>
          <p>{analysis.attachment_style}</p>
        </SectionCard>

        <SectionCard title="Mixed Signals" delay={0.4}>
          {analysis.mixed_signals.length > 0 ? (
            <ul className="list-inside list-disc space-y-1">
              {analysis.mixed_signals.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          ) : (
            <p>None clearly identified.</p>
          )}
        </SectionCard>

        <SectionCard title="Behavior Patterns" delay={0.45}>
          <p>{analysis.behavior_patterns}</p>
        </SectionCard>

        <SectionCard title="Probability of Romantic Interest" delay={0.5}>
          <p>{analysis.probability_estimate}</p>
        </SectionCard>

        <SectionCard title="Future Outlook" delay={0.55}>
          <p>{analysis.future_outlook}</p>
        </SectionCard>

        {analysis.possible_misunderstandings.length > 0 && (
          <SectionCard title="Possible Misunderstandings" delay={0.6}>
            <ul className="list-inside list-disc space-y-1">
              {analysis.possible_misunderstandings.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          </SectionCard>
        )}

        <SectionCard title="Advice" delay={0.65}>
          <ol className="list-inside list-decimal space-y-2">
            {analysis.advice.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ol>
        </SectionCard>

        <SectionCard title="Overall Conclusion" delay={0.7}>
          <p>
            <strong>Stage:</strong> {analysis.relationship_stage}
          </p>
          <p className="mt-2">{analysis.summary}</p>
        </SectionCard>

        {!isLocal && <FollowUpChat reportId={report.id} />}
      </div>
    </div>
  );
}
