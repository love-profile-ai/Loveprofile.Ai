import type {
  EnginePath,
  FollowUpRule,
  FollowUpRules,
  Question,
  QuestionScoring,
} from "@/types/adaptive-engine";

export function normalizeJsonField<T>(raw: unknown, fallback: T): T {
  if (raw === null || raw === undefined) return fallback;
  if (typeof raw === "string") {
    try {
      return JSON.parse(raw) as T;
    } catch {
      return fallback;
    }
  }
  return raw as T;
}

export function normalizeFollowUpRules(raw: unknown): FollowUpRules {
  const parsed = normalizeJsonField<FollowUpRules>(raw, {});
  return {
    skip_if: Array.isArray(parsed.skip_if) ? parsed.skip_if : undefined,
    only_if: Array.isArray(parsed.only_if) ? parsed.only_if : undefined,
    only_if_any: Array.isArray(parsed.only_if_any)
      ? parsed.only_if_any
      : undefined,
  };
}

export function rowToQuestion(row: Record<string, unknown>): Question {
  return {
    id: String(row.id),
    path: row.path as EnginePath,
    category: String(row.category ?? "general"),
    question_text: String(row.question_text),
    type: row.type as Question["type"],
    options: normalizeJsonField(row.options, [] as Question["options"]),
    psychological_dimension:
      row.psychological_dimension as Question["psychological_dimension"],
    weight: Number(row.weight ?? 1),
    priority: Number(row.priority ?? 50),
    follow_up_rules: normalizeFollowUpRules(row.follow_up_rules),
    scoring: normalizeJsonField<QuestionScoring>(row.scoring, {}),
    confidence_value: Number(row.confidence_value ?? 0.12),
    parent_question_id: row.parent_question_id as string | null | undefined,
    is_clarification: Boolean(row.is_clarification),
    is_starter: Boolean(row.is_starter),
    is_active: row.is_active !== false,
  };
}

export function questionToRow(question: Question) {
  return {
    id: question.id,
    path: question.path,
    category: question.category,
    question_text: question.question_text,
    type: question.type,
    options: question.options,
    psychological_dimension: question.psychological_dimension,
    weight: question.weight,
    priority: question.priority,
    follow_up_rules: question.follow_up_rules ?? {},
    scoring: question.scoring ?? {},
    confidence_value: question.confidence_value,
    parent_question_id: question.parent_question_id ?? null,
    is_clarification: question.is_clarification ?? false,
    is_starter: question.is_starter ?? false,
    is_active: question.is_active !== false,
  };
}

const RULE_TYPES = new Set([
  "dimension_below",
  "dimension_above",
  "dimension_uncertain",
  "dimension_gap",
  "answer_equals",
  "answer_lte",
  "answer_gte",
]);

export function validateFollowUpRule(rule: unknown): string | null {
  if (!rule || typeof rule !== "object") return "Rule must be an object";
  const r = rule as FollowUpRule & Record<string, unknown>;
  if (!RULE_TYPES.has(String(r.type))) {
    return `Unknown rule type: ${String(r.type)}`;
  }
  switch (r.type) {
    case "dimension_below":
    case "dimension_above":
    case "dimension_uncertain":
      if (!r.dimension) return `${r.type} missing dimension`;
      if (r.type === "dimension_uncertain" && typeof r.below !== "number") {
        return "dimension_uncertain missing below";
      }
      if (
        (r.type === "dimension_below" || r.type === "dimension_above") &&
        typeof r.threshold !== "number"
      ) {
        return `${r.type} missing threshold`;
      }
      break;
    case "dimension_gap":
      if (!r.high || !r.low || typeof r.gap !== "number") {
        return "dimension_gap missing high/low/gap";
      }
      break;
    case "answer_equals":
      if (!r.question_id || r.value === undefined) {
        return "answer_equals missing question_id or value";
      }
      break;
    case "answer_lte":
    case "answer_gte":
      if (!r.question_id || typeof r.value !== "number") {
        return `${r.type} missing question_id or numeric value`;
      }
      break;
  }
  return null;
}

export function validateQuestion(question: Question): string[] {
  const issues: string[] = [];
  if (!question.id) issues.push("missing id");
  if (!question.path) issues.push("missing path");
  if (!question.psychological_dimension) issues.push("missing psychological_dimension");
  if (!question.question_text?.trim()) issues.push("missing question_text");
  if (typeof question.priority !== "number") issues.push("invalid priority");
  if (!question.scoring || Object.keys(question.scoring).length === 0) {
    issues.push("missing scoring");
  }
  if (!question.follow_up_rules) {
    issues.push("missing follow_up_rules");
  } else {
    for (const rule of [
      ...(question.follow_up_rules.only_if ?? []),
      ...(question.follow_up_rules.only_if_any ?? []),
      ...(question.follow_up_rules.skip_if ?? []),
    ]) {
      const err = validateFollowUpRule(rule);
      if (err) issues.push(`invalid follow_up_rule: ${err}`);
    }
  }
  return issues;
}
