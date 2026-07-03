const INJECTION_PATTERNS = [
  /ignore (all )?(previous|prior|above) instructions/i,
  /you are now/i,
  /system prompt/i,
  /disregard your/i,
  /output only/i,
  /```/,
];

export function sanitizeText(input: string, maxLength = 2000): string {
  let text = input.trim().slice(0, maxLength);
  text = text.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");
  return text;
}

export function containsPromptInjection(input: string): boolean {
  return INJECTION_PATTERNS.some((pattern) => pattern.test(input));
}

export function sanitizeAnswers(
  answers: { questionText: string; value: string | number | boolean }[]
) {
  return answers.map((a) => ({
    ...a,
    questionText: sanitizeText(a.questionText, 500),
    value:
      typeof a.value === "string" ? sanitizeText(a.value, 2000) : a.value,
  }));
}
