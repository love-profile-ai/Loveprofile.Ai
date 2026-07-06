import type { AnalysisReport } from "@/types/report";

const THEMES = [
  {
    title: "Mixed Signals",
    match: (a: AnalysisReport) =>
      a.red_flags.length > 0 &&
      a.green_flags.length > 0 &&
      a.what_we_noticed.some((n) => n.toLowerCase().includes("mixed")),
  },
  {
    title: "Mixed Signals",
    match: (a: AnalysisReport) =>
      a.red_flags.length >= 2 && a.green_flags.length >= 2,
  },
  {
    title: "Growing Connection",
    match: (a: AnalysisReport) =>
      a.green_flags.length >= 3 && a.red_flags.length <= 1,
  },
  {
    title: "Strong Compatibility",
    match: (a: AnalysisReport) =>
      a.confidence === "High" && a.red_flags.length <= 1,
  },
  {
    title: "Emotional Distance",
    match: (a: AnalysisReport) => a.red_flags.length >= 3,
  },
  {
    title: "Unclear Intentions",
    match: (a: AnalysisReport) => a.confidence === "Low",
  },
  {
    title: "Early Spark",
    match: (a: AnalysisReport) =>
      a.confidence === "Medium" && a.green_flags.length >= 1,
  },
] as const;

export function getReportThemeTitle(analysis: AnalysisReport): string {
  for (const theme of THEMES) {
    if (theme.match(analysis)) return theme.title;
  }
  return "Your Connection";
}

export const CONFIDENCE_PERCENT: Record<
  AnalysisReport["confidence"],
  number
> = {
  Low: 42,
  Medium: 62,
  High: 88,
};
