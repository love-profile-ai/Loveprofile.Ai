export type QuestionType =
  | "multiple_choice"
  | "text"
  | "scale"
  | "yes_no"
  | "emoji_scale";

export type AnalysisPath = "i_like_someone" | "someone_likes_me";

export interface QuestionOption {
  label: string;
  value: string;
  next?: string;
}

export interface Question {
  id: string;
  text: string;
  type: QuestionType;
  required?: boolean;
  placeholder?: string;
  options?: QuestionOption[];
  min?: number;
  max?: number;
  emojis?: string[];
  next?: string;
}

export interface QuestionSet {
  path: AnalysisPath;
  title: string;
  questions: Question[];
}

export interface Answer {
  questionId: string;
  questionText: string;
  type: QuestionType;
  value: string | number | boolean;
}

export interface AnalysisSession {
  id: string;
  user_id: string;
  path: AnalysisPath;
  current_question_id: string | null;
  answers: Answer[];
  status: "in_progress" | "completed" | "abandoned";
  created_at: string;
  updated_at: string;
}
