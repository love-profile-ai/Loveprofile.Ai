import type { ProfileDimension } from "@/lib/engine/profile-dimensions";

/** Authoring format for adaptive questions — add new entries here. */
export type AdaptiveQuestionContentType = "single_choice" | "likert_5";

export type SignalWeightKey =
  | "communication"
  | "trust"
  | "attraction"
  | "compatibility"
  | "love"
  | "crush"
  | "future"
  | "friendship"
  | "commitment"
  | "reciprocity"
  | "attachment";

export interface AdaptiveQuestionContent {
  id: string;
  dimension: ProfileDimension;
  text: string;
  /** Wording for "Does Someone Love Me?" path. */
  text_other_path?: string;
  phrasing_variants?: string[];
  type: AdaptiveQuestionContentType;
  options?: string[];
  signal_weight: Partial<Record<SignalWeightKey, number>>;
  depends_on?: string | null;
  follow_up_if_low?: string | null;
  follow_up_if_high?: string | null;
  /** Maps option label → low | mid | high for follow-up triggers. */
  option_signal?: Record<string, "low" | "mid" | "high">;
  priority?: number;
}

export const ADAPTIVE_QUESTION_CONTENT: AdaptiveQuestionContent[] = [
  {
    id: "q_021",
    dimension: "communication_clarity",
    text: "When you disagree about something small, does it usually get resolved, or does it linger?",
    text_other_path:
      "When you two disagree about something small, does it usually get resolved, or does it linger?",
    phrasing_variants: [
      "When you disagree about something small, does it usually get resolved, or does it linger?",
      "Think about your last small disagreement — did it get talked through, or just fade without really being settled?",
    ],
    type: "single_choice",
    options: [
      "Usually resolved",
      "Sometimes lingers",
      "Usually lingers",
      "We don't really disagree",
    ],
    signal_weight: { communication: 0.75, trust: 0.2 },
    depends_on: null,
    follow_up_if_low: "q_021b",
    follow_up_if_high: null,
    option_signal: {
      "Usually resolved": "high",
      "Sometimes lingers": "low",
      "Usually lingers": "low",
      "We don't really disagree": "mid",
    },
    priority: 78,
  },
  {
    id: "q_021b",
    dimension: "communication_clarity",
    text: "What usually happens instead of resolving it — do one of you drop it, avoid it, or does it turn into a bigger argument?",
    text_other_path:
      "What usually happens instead of resolving it — do they drop it, avoid it, or does it turn into a bigger argument?",
    phrasing_variants: [
      "What usually happens instead of resolving it — do one of you drop it, avoid it, or does it turn into a bigger argument?",
    ],
    type: "single_choice",
    options: [
      "One of us drops it",
      "We both avoid it",
      "It turns into a bigger fight",
      "Varies a lot",
    ],
    signal_weight: { communication: 0.85 },
    depends_on: "q_021",
    follow_up_if_low: null,
    follow_up_if_high: null,
    option_signal: {
      "One of us drops it": "low",
      "We both avoid it": "low",
      "It turns into a bigger fight": "low",
      "Varies a lot": "mid",
    },
    priority: 88,
  },
  {
    id: "q_022",
    dimension: "attraction_balance",
    text: "Do you find yourself more excited to see them, or more comfortable when they're around?",
    text_other_path:
      "Do they seem more excited to see you, or more at ease when you're together?",
    phrasing_variants: [
      "Do you find yourself more excited to see them, or more comfortable when they're around?",
      "When they walk in the room, is it more of a spark, or more of a settle-down calm?",
    ],
    type: "single_choice",
    options: [
      "Mostly excited",
      "Mostly comfortable",
      "Both equally",
      "Neither, honestly",
    ],
    signal_weight: { attraction: 0.7, compatibility: 0.2 },
    depends_on: null,
    follow_up_if_low: "q_022b",
    follow_up_if_high: null,
    option_signal: {
      "Mostly excited": "high",
      "Mostly comfortable": "low",
      "Both equally": "mid",
      "Neither, honestly": "low",
    },
    priority: 76,
  },
  {
    id: "q_022b",
    dimension: "attraction_balance",
    text: "When comfort outweighs excitement — does that feel peaceful to you, or like something important is missing?",
    text_other_path:
      "When they seem more at ease than excited around you — does that feel steady, or like the spark is fading?",
    type: "single_choice",
    options: [
      "Mostly peaceful",
      "Something feels missing",
      "Hard to tell",
      "I prefer the calm",
    ],
    signal_weight: { attraction: 0.75 },
    depends_on: "q_022",
    option_signal: {
      "Mostly peaceful": "mid",
      "Something feels missing": "low",
      "Hard to tell": "mid",
      "I prefer the calm": "mid",
    },
    priority: 86,
  },
  {
    id: "q_023",
    dimension: "long_term_compatibility",
    text: "Have you two talked about what either of you wants in the next few years, even loosely?",
    text_other_path:
      "Have you two talked about what they want for themselves in the next few years, even loosely?",
    phrasing_variants: [
      "Have you two talked about what either of you wants in the next few years, even loosely?",
      "Do you have any real sense of where they see themselves in a few years — and does it overlap with where you see yourself?",
    ],
    type: "likert_5",
    signal_weight: { compatibility: 0.8, communication: 0.15 },
    depends_on: null,
    follow_up_if_low: "q_023b",
    follow_up_if_high: null,
    priority: 74,
  },
  {
    id: "q_023b",
    dimension: "long_term_compatibility",
    text: "When you haven't really talked about the future — does that feel intentional, or more like something you're both avoiding?",
    text_other_path:
      "When you haven't really talked about their future plans — does that feel early, or more like something neither of you is raising?",
    type: "single_choice",
    options: [
      "Feels too early",
      "We're avoiding it",
      "We talk around it but not directly",
      "We just haven't yet",
    ],
    signal_weight: { compatibility: 0.85, communication: 0.1 },
    depends_on: "q_023",
    option_signal: {
      "Feels too early": "mid",
      "We're avoiding it": "low",
      "We talk around it but not directly": "low",
      "We just haven't yet": "mid",
    },
    priority: 84,
  },
];
