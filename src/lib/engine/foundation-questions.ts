import type { EnginePath, Question } from "@/types/adaptive-engine";

/** Fixed foundation questions — mandatory, ordered, non-adaptive. */
export const FOUNDATION_QUESTION_COUNT = 8;

const DO_I_LOVE_FOUNDATION: Question[] = [
  {
    id: "fdls_01",
    path: "do_i_love_someone",
    category: "foundation",
    question_text: "Who is this person in your life?",
    type: "single_select",
    options: [
      { label: "Friend", value: "friend" },
      { label: "Best friend", value: "best_friend" },
      { label: "Classmate or colleague", value: "classmate" },
      { label: "Someone I recently met", value: "recently_met" },
      { label: "Someone I've known a long time", value: "long_term" },
      { label: "Ex-partner", value: "ex" },
    ],
    psychological_dimension: "attachment",
    weight: 1,
    priority: 100,
    is_foundation: true,
    follow_up_rules: {},
    scoring: {
      single_select: {
        friend: { attachment: 8, friendship: 10 },
        best_friend: { attachment: 14, trust: 6, friendship: 14 },
        classmate: { attachment: 6, crush: 4 },
        recently_met: { crush: 12, attachment: 4 },
        long_term: { attachment: 12, trust: 8, friendship: 8 },
        ex: { attachment: 6, love: -6 },
      },
    },
    confidence_value: 0.1,
  },
  {
    id: "fdls_02",
    path: "do_i_love_someone",
    category: "foundation",
    question_text: "How would you describe your connection right now?",
    type: "single_select",
    options: [
      { label: "Mostly casual", value: "casual" },
      { label: "Friendly and warm", value: "warm" },
      { label: "Emotionally close", value: "close" },
      { label: "Romantic or flirtatious", value: "romantic" },
      { label: "Hard to define", value: "unclear" },
    ],
    psychological_dimension: "love",
    weight: 1.1,
    priority: 99,
    is_foundation: true,
    follow_up_rules: {},
    scoring: {
      single_select: {
        casual: { love: 4, friendship: 8 },
        warm: { love: 10, attachment: 8, friendship: 6 },
        close: { love: 16, attachment: 14, emotional_attraction: 10 },
        romantic: { love: 22, crush: 14, physical_attraction: 8 },
        unclear: { love: 6, attachment: 4 },
      },
    },
    confidence_value: 0.12,
  },
  {
    id: "fdls_03",
    path: "do_i_love_someone",
    category: "foundation",
    question_text: "How often do they come to mind when you're apart?",
    type: "slider",
    options: { min: 1, max: 10 },
    psychological_dimension: "love",
    weight: 1.2,
    priority: 98,
    is_foundation: true,
    follow_up_rules: {},
    scoring: {
      slider: {
        scale: { love: 2.6, crush: 1.6, attachment: 1.2 },
        confidence: 0.14,
      },
    },
    confidence_value: 0.14,
  },
  {
    id: "fdls_04",
    path: "do_i_love_someone",
    category: "foundation",
    question_text: "How do you feel right before you see or talk to them?",
    type: "slider",
    options: { min: 1, max: 10 },
    psychological_dimension: "crush",
    weight: 1.1,
    priority: 97,
    is_foundation: true,
    follow_up_rules: {},
    scoring: {
      slider: {
        scale: { crush: 2.8, love: 1.4, physical_attraction: 1.2 },
        confidence: 0.13,
      },
    },
    confidence_value: 0.13,
  },
  {
    id: "fdls_05",
    path: "do_i_love_someone",
    category: "foundation",
    question_text: "When they're not around, do you miss them?",
    type: "single_select",
    options: [
      { label: "Not really", value: "not_really" },
      { label: "Sometimes", value: "sometimes" },
      { label: "Often", value: "often" },
      { label: "Almost always", value: "almost_always" },
      { label: "Not sure yet", value: "not_sure" },
    ],
    psychological_dimension: "attachment",
    weight: 1,
    priority: 96,
    is_foundation: true,
    follow_up_rules: {},
    scoring: {
      single_select: {
        not_really: { attachment: -6, love: -4 },
        sometimes: { attachment: 10, love: 6 },
        often: { attachment: 18, love: 12 },
        almost_always: { attachment: 24, love: 16 },
        not_sure: { attachment: 3 },
      },
    },
    confidence_value: 0.12,
  },
  {
    id: "fdls_06",
    path: "do_i_love_someone",
    category: "foundation",
    question_text: "How important is their happiness to you?",
    type: "slider",
    options: { min: 1, max: 10 },
    psychological_dimension: "love",
    weight: 1.2,
    priority: 95,
    is_foundation: true,
    follow_up_rules: {},
    scoring: {
      slider: {
        scale: { love: 3, attachment: 1.6, emotional_attraction: 1.2 },
        confidence: 0.14,
      },
    },
    confidence_value: 0.14,
  },
  {
    id: "fdls_07",
    path: "do_i_love_someone",
    category: "foundation",
    question_text: "How safe do you feel sharing your real feelings with them?",
    type: "slider",
    options: { min: 1, max: 10 },
    psychological_dimension: "trust",
    weight: 1.3,
    priority: 94,
    is_foundation: true,
    follow_up_rules: {},
    scoring: {
      slider: {
        scale: { trust: 3.2, love: 1.2, communication: 1.4 },
        confidence: 0.15,
      },
    },
    confidence_value: 0.15,
  },
  {
    id: "fdls_08",
    path: "do_i_love_someone",
    category: "foundation",
    question_text: "Can you picture a future where you're together?",
    type: "single_select",
    options: [
      { label: "No", value: "no" },
      { label: "Maybe", value: "maybe" },
      { label: "Yes, clearly", value: "yes" },
      { label: "Not sure yet", value: "not_sure" },
    ],
    psychological_dimension: "future",
    weight: 1.2,
    priority: 93,
    is_foundation: true,
    follow_up_rules: {},
    scoring: {
      single_select: {
        no: { future: -14, love: -8 },
        maybe: { future: 14, love: 10, commitment: 6 },
        yes: { future: 28, love: 18, attachment: 12, commitment: 10 },
        not_sure: { future: 6 },
      },
    },
    confidence_value: 0.13,
  },
];

const DOES_SOMEONE_LOVE_FOUNDATION: Question[] = [
  {
    id: "fdsl_01",
    path: "does_someone_love_me",
    category: "foundation",
    question_text: "Who is this person in your life?",
    type: "single_select",
    options: [
      { label: "Friend", value: "friend" },
      { label: "Best friend", value: "best_friend" },
      { label: "Classmate or colleague", value: "classmate" },
      { label: "Someone I recently met", value: "recently_met" },
      { label: "Someone I've known a long time", value: "long_term" },
      { label: "Ex-partner", value: "ex" },
    ],
    psychological_dimension: "attachment",
    weight: 1,
    priority: 100,
    is_foundation: true,
    follow_up_rules: {},
    scoring: {
      single_select: {
        friend: { attachment: 8, friendship: 10 },
        best_friend: { attachment: 12, friendship: 12 },
        classmate: { attachment: 6 },
        recently_met: { crush: 10, attachment: 4 },
        long_term: { attachment: 12, trust: 6 },
        ex: { attachment: 4 },
      },
    },
    confidence_value: 0.1,
  },
  {
    id: "fdsl_02",
    path: "does_someone_love_me",
    category: "foundation",
    question_text: "How attentive are they when you're talking together?",
    type: "slider",
    options: { min: 1, max: 10 },
    psychological_dimension: "communication",
    weight: 1.3,
    priority: 99,
    is_foundation: true,
    follow_up_rules: {},
    scoring: {
      slider: {
        scale: { communication: 3, love: 1.6, reciprocity: 1.2 },
        confidence: 0.15,
      },
    },
    confidence_value: 0.15,
  },
  {
    id: "fdsl_03",
    path: "does_someone_love_me",
    category: "foundation",
    question_text: "Who usually reaches out first — you or them?",
    type: "single_select",
    options: [
      { label: "Mostly me", value: "mostly_me" },
      { label: "Mostly them", value: "mostly_them" },
      { label: "About equal", value: "equal" },
      { label: "It varies a lot", value: "varies" },
    ],
    psychological_dimension: "reciprocity",
    weight: 1.1,
    priority: 98,
    is_foundation: true,
    follow_up_rules: {},
    scoring: {
      single_select: {
        mostly_me: { reciprocity: -10, love: -6 },
        mostly_them: { reciprocity: 16, love: 12, crush: 8 },
        equal: { reciprocity: 18, love: 10, communication: 8 },
        varies: { reciprocity: 4 },
      },
    },
    confidence_value: 0.12,
  },
  {
    id: "fdsl_04",
    path: "does_someone_love_me",
    category: "foundation",
    question_text: "Do they remember the small details you've shared?",
    type: "single_select",
    options: [
      { label: "Rarely", value: "rarely" },
      { label: "Sometimes", value: "sometimes" },
      { label: "Often", value: "often" },
      { label: "Almost always", value: "almost_always" },
    ],
    psychological_dimension: "love",
    weight: 1.1,
    priority: 97,
    is_foundation: true,
    follow_up_rules: {},
    scoring: {
      single_select: {
        rarely: { love: -10, trust: -6 },
        sometimes: { love: 10, trust: 6 },
        often: { love: 18, attachment: 10, trust: 8 },
        almost_always: { love: 26, attachment: 14, trust: 12 },
      },
    },
    confidence_value: 0.13,
  },
  {
    id: "fdsl_05",
    path: "does_someone_love_me",
    category: "foundation",
    question_text: "When you're having a hard day, how do they show up for you?",
    type: "single_select",
    options: [
      { label: "They don't really", value: "absent" },
      { label: "Basic check-in", value: "basic" },
      { label: "They comfort me", value: "comfort" },
      { label: "They go out of their way", value: "extra" },
      { label: "Not sure", value: "not_sure" },
    ],
    psychological_dimension: "trust",
    weight: 1.2,
    priority: 96,
    is_foundation: true,
    follow_up_rules: {},
    scoring: {
      single_select: {
        absent: { trust: -16, love: -12 },
        basic: { trust: 8, love: 6 },
        comfort: { trust: 18, love: 14, attachment: 10 },
        extra: { trust: 28, love: 22, attachment: 16 },
        not_sure: { trust: 4 },
      },
    },
    confidence_value: 0.14,
  },
  {
    id: "fdsl_06",
    path: "does_someone_love_me",
    category: "foundation",
    question_text: "Do they make time for you even when life gets busy?",
    type: "slider",
    options: { min: 1, max: 10 },
    psychological_dimension: "attachment",
    weight: 1.2,
    priority: 95,
    is_foundation: true,
    follow_up_rules: {},
    scoring: {
      slider: {
        scale: { attachment: 2.8, love: 1.8, commitment: 1.2 },
        confidence: 0.14,
      },
    },
    confidence_value: 0.14,
  },
  {
    id: "fdsl_07",
    path: "does_someone_love_me",
    category: "foundation",
    question_text: "How often do they initiate plans or meaningful contact?",
    type: "slider",
    options: { min: 1, max: 10 },
    psychological_dimension: "reciprocity",
    weight: 1.1,
    priority: 94,
    is_foundation: true,
    follow_up_rules: {},
    scoring: {
      slider: {
        scale: { reciprocity: 2.8, love: 1.6, crush: 1 },
        confidence: 0.13,
      },
    },
    confidence_value: 0.13,
  },
  {
    id: "fdsl_08",
    path: "does_someone_love_me",
    category: "foundation",
    question_text: "Do their actions feel consistent with what they say?",
    type: "single_select",
    options: [
      { label: "Often inconsistent", value: "inconsistent" },
      { label: "Mixed signals", value: "mixed" },
      { label: "Mostly consistent", value: "mostly" },
      { label: "Very consistent", value: "consistent" },
      { label: "Hard to tell", value: "unclear" },
    ],
    psychological_dimension: "trust",
    weight: 1.3,
    priority: 93,
    is_foundation: true,
    follow_up_rules: {},
    scoring: {
      single_select: {
        inconsistent: { trust: -14, love: -10 },
        mixed: { trust: 2, love: 4 },
        mostly: { trust: 16, love: 12, commitment: 8 },
        consistent: { trust: 26, love: 18, commitment: 12 },
        unclear: { trust: 4 },
      },
    },
    confidence_value: 0.14,
  },
];

const FOUNDATION_BY_PATH: Record<EnginePath, Question[]> = {
  do_i_love_someone: DO_I_LOVE_FOUNDATION,
  does_someone_love_me: DOES_SOMEONE_LOVE_FOUNDATION,
};

const FOUNDATION_ID_SET = new Set(
  [...DO_I_LOVE_FOUNDATION, ...DOES_SOMEONE_LOVE_FOUNDATION].map((q) => q.id)
);

export function getFoundationQuestions(path: EnginePath): Question[] {
  return FOUNDATION_BY_PATH[path];
}

export function isFoundationQuestionId(id: string): boolean {
  return FOUNDATION_ID_SET.has(id);
}

export function getFoundationQuestionById(
  path: EnginePath,
  id: string
): Question | null {
  return getFoundationQuestions(path).find((q) => q.id === id) ?? null;
}

export function getFirstFoundationQuestion(path: EnginePath): Question {
  const questions = getFoundationQuestions(path);
  if (!questions.length) {
    throw new Error(`No foundation questions configured for path: ${path}`);
  }
  return questions[0];
}
