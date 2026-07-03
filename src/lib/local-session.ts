import type { AnalysisPath, Answer } from "@/types/questionnaire";

const PREFIX = "signal-session:";

export interface LocalSession {
  id: string;
  path: AnalysisPath;
  answers: Answer[];
  current_question_id: string | null;
}

export function createLocalSession(id: string, path: AnalysisPath): LocalSession {
  const session: LocalSession = {
    id,
    path,
    answers: [],
    current_question_id: null,
  };
  saveLocalSession(session);
  return session;
}

export function getLocalSession(id: string): LocalSession | null {
  if (typeof window === "undefined") return null;
  const raw = sessionStorage.getItem(`${PREFIX}${id}`);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as LocalSession;
  } catch {
    return null;
  }
}

export function saveLocalSession(session: LocalSession): void {
  sessionStorage.setItem(`${PREFIX}${session.id}`, JSON.stringify(session));
}

export function isLocalSessionId(id: string): boolean {
  return getLocalSession(id) !== null;
}
