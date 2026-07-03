export const DISCLAIMER_STORAGE_KEY = "signal_disclaimer_agreed";

export const DISCLAIMER_TEXT = `This app is an AI-powered self-reflection and relationship insight tool for educational and personal growth purposes only.

Results are based solely on your responses. They are not facts, are not guaranteed to be accurate, do not predict the future, and cannot determine with certainty whether someone loves you.

This tool is not a substitute for professional psychological, legal, or medical advice. You are responsible for your own decisions and should use these insights as guidance rather than definitive answers.`;

export function hasAcceptedDisclaimer(): boolean {
  if (typeof window === "undefined") return false;
  return sessionStorage.getItem(DISCLAIMER_STORAGE_KEY) === "true";
}

export function acceptDisclaimer(): void {
  sessionStorage.setItem(DISCLAIMER_STORAGE_KEY, "true");
}
