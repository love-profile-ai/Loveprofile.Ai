export type ConfidenceLevel = "Low" | "Medium" | "High";

export interface AnalysisReport {
  summary: string;
  relationship_stage: string;
  interest_level: string;
  communication_analysis: string;
  emotional_signals: string;
  attachment_style: string;
  mixed_signals: string[];
  green_flags: string[];
  red_flags: string[];
  behavior_patterns: string;
  probability_estimate: string;
  future_outlook: string;
  possible_misunderstandings: string[];
  advice: string[];
  confidence: ConfidenceLevel;
}

export interface ReportRecord {
  id: string;
  user_id: string;
  session_id: string | null;
  title: string;
  path: string;
  answers: import("./questionnaire").Answer[];
  analysis: AnalysisReport;
  share_token: string;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

export interface ChatMessage {
  id: string;
  report_id: string;
  user_id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
}
