import type { AnalysisPath, Answer } from "@/types/questionnaire";
import type { AnalysisReport } from "@/types/report";

const PREFIX = "signal-report:";

export interface LocalReport {
  id: string;
  title: string;
  path: AnalysisPath;
  answers: Answer[];
  analysis: AnalysisReport;
  created_at: string;
}

export function saveLocalReport(
  report: Omit<LocalReport, "created_at"> & { created_at?: string }
): LocalReport {
  const full: LocalReport = {
    ...report,
    created_at: report.created_at ?? new Date().toISOString(),
  };
  if (typeof window !== "undefined") {
    sessionStorage.setItem(`${PREFIX}${full.id}`, JSON.stringify(full));
  }
  return full;
}

export function getLocalReport(id: string): LocalReport | null {
  if (typeof window === "undefined") return null;
  const raw = sessionStorage.getItem(`${PREFIX}${id}`);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as LocalReport;
  } catch {
    return null;
  }
}

export function toReportRecord(local: LocalReport) {
  return {
    id: local.id,
    user_id: "local",
    session_id: null,
    title: local.title,
    path: local.path,
    answers: local.answers,
    analysis: local.analysis,
    share_token: "",
    is_public: false,
    created_at: local.created_at,
    updated_at: local.created_at,
  };
}
