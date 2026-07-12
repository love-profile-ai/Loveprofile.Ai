import type { AnalysisReport } from "@/types/report";

function summaryIncludes(analysis: AnalysisReport, ...terms: string[]) {
  const text = `${analysis.summary} ${analysis.ai_summary}`.toLowerCase();
  return terms.some((t) => text.includes(t));
}

const THEMES = [
  {
    title: "Mixed Signals",
    match: (a: AnalysisReport) =>
      a.what_we_noticed.some((n) => n.toLowerCase().includes("mixed")) ||
      summaryIncludes(a, "mixed", "unclear", "contradict"),
  },
  {
    title: "Growing Connection",
    match: (a: AnalysisReport) =>
      a.confidence === "High" &&
      summaryIncludes(a, "growing", "building", "deepening", "warm"),
  },
  {
    title: "Strong Compatibility",
    match: (a: AnalysisReport) =>
      a.confidence === "High" &&
      !summaryIncludes(a, "uncertain", "unclear", "one-sided"),
  },
  {
    title: "Emotional Distance",
    match: (a: AnalysisReport) =>
      summaryIncludes(a, "distance", "distant", "fading", "drift", "low investment"),
  },
  {
    title: "Unclear Intentions",
    match: (a: AnalysisReport) => a.confidence === "Low",
  },
  {
    title: "Early Spark",
    match: (a: AnalysisReport) =>
      a.confidence === "Medium" &&
      summaryIncludes(a, "early", "spark", "warming", "young"),
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
