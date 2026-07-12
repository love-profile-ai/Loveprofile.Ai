export type ConfidenceLevel = "Low" | "Medium" | "High";

export interface AnalysisReport {
  summary: string;
  /** Reflective narrative grounded in the user's actual answers. */
  ai_summary: string;
  confidence: ConfidenceLevel;
  what_we_noticed: string[];
  gentle_next_steps: string[];
  looking_ahead: string;
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
