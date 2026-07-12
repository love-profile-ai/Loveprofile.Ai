import type {
  AnswerValue,
  FollowUpRule,
  FollowUpRules,
  Question,
  UserProfile,
} from "@/types/adaptive-engine";
import type { SessionAnswerRecord } from "@/types/adaptive-engine";
import {
  getDimensionScore,
  getDimensionCertainty,
} from "./profile-utils";

function answerMap(
  answers: SessionAnswerRecord[]
): Map<string, AnswerValue> {
  return new Map(answers.map((a) => [a.question_id, a.value]));
}

function evaluateRule(
  rule: FollowUpRule,
  profile: UserProfile,
  answers: Map<string, AnswerValue>
): boolean {
  switch (rule.type) {
    case "dimension_below":
      return getDimensionScore(profile, rule.dimension) < rule.threshold;
    case "dimension_above":
      return getDimensionScore(profile, rule.dimension) >= rule.threshold;
    case "dimension_uncertain":
      return getDimensionCertainty(profile, rule.dimension) < rule.below;
    case "dimension_gap": {
      const high = getDimensionScore(profile, rule.high);
      const low = getDimensionScore(profile, rule.low);
      return high - low >= rule.gap;
    }
    case "answer_equals": {
      const ans = answers.get(rule.question_id);
      if (!ans) return false;
      return String(ans.raw) === rule.value;
    }
    case "answer_lte": {
      const ans = answers.get(rule.question_id);
      if (!ans || typeof ans.raw !== "number") return false;
      return ans.raw <= rule.value;
    }
    case "answer_gte": {
      const ans = answers.get(rule.question_id);
      if (!ans || typeof ans.raw !== "number") return false;
      return ans.raw >= rule.value;
    }
    default:
      return false;
  }
}

function rulesMatch(
  rules: FollowUpRule[] | undefined,
  profile: UserProfile,
  answers: Map<string, AnswerValue>
): boolean {
  if (!rules?.length) return true;
  return rules.every((r) => evaluateRule(r, profile, answers));
}

/** Returns true when the question is eligible given follow_up_rules. */
export function isQuestionRelevant(
  question: Question,
  profile: UserProfile,
  answers: SessionAnswerRecord[]
): boolean {
  const map = answerMap(answers);
  const rules: FollowUpRules = question.follow_up_rules ?? {};

  if (rules.skip_if?.some((r) => evaluateRule(r, profile, map))) {
    return false;
  }

  if (rules.only_if_any?.length) {
    return rules.only_if_any.some((r) => evaluateRule(r, profile, map));
  }

  if (rules.only_if?.length) {
    return rulesMatch(rules.only_if, profile, map);
  }

  return true;
}
