/**
 * Gap-fill result templates for Nila — matched deterministically in code.
 * Complements the core 11 templates (one_sided_spark, limited_signal, etc.).
 *
 * Match key reference:
 * - signal, consistency, reciprocity: standard axes
 * - dimension_outlier: one profile dimension far below the other three
 *   { outlier_dimension, gap_gte, peer_avg_gte }
 * - ambiguity_rate_gte: share of answers flagged uncertain (0–1)
 * - is_retest + hours_since_last_session_lte: rapid re-session within window
 * - connection_stage: "early" | "established_or_ongoing"
 * - trend: "rising" | "falling" | "stable" (vs prior session, if any)
 */
export interface ResultTemplateMatch {
  signal?: "low" | "medium" | "high";
  consistency?: "clear" | "mixed";
  reciprocity?: "mutual" | "one_sided" | "unclear";
  connection_stage?: "early" | "established_or_ongoing";
  trend?: "rising" | "falling" | "stable";
  dimension_outlier?: {
    outlier_dimension:
      | "trust_emotional_safety"
      | "communication_clarity"
      | "attraction_balance"
      | "long_term_compatibility";
    /** Outlier score must be at least this many points below the mean of the other three. */
    gap_gte: number;
    /** Mean of the three non-outlier dimensions must be at least this. */
    peer_avg_gte: number;
  };
  ambiguity_rate_gte?: number;
  is_retest?: boolean;
  hours_since_last_session_lte?: number;
}

export interface ResultTemplate {
  id: string;
  match: ResultTemplateMatch;
  title: string;
  summary_template: string;
  tone: string;
}

export const RESULT_TEMPLATES_GAP_FILL: ResultTemplate[] = [
  {
    id: "uneven_afterglow",
    match: {
      signal: "high",
      consistency: "mixed",
      reciprocity: "one_sided",
    },
    title: "Bright but Off-Balance",
    summary_template:
      "The overall pull reads strong, but it does not settle evenly — warmth shows up in bursts while steadier parts of the bond lag behind. You may be feeling more of the charge than the reciprocity can reliably match.",
    tone: "warm, cautionary, grounded",
  },
  {
    id: "mutual_low_settle",
    match: {
      signal: "low",
      consistency: "clear",
      reciprocity: "mutual",
      connection_stage: "established_or_ongoing",
    },
    title: "Quiet Mutual Drift",
    summary_template:
      "Both of you appear to be in a similar, low-key place — not out of step with each other, just lightly invested. It reads less like mixed signals and more like shared momentum fading together.",
    tone: "soft, matter-of-fact",
  },
  {
    id: "one_weak_link",
    match: {
      signal: "medium",
      dimension_outlier: {
        outlier_dimension: "trust_emotional_safety",
        gap_gte: 22,
        peer_avg_gte: 55,
      },
    },
    title: "One Weak Link",
    summary_template:
      "Most of this connection holds up on paper, but one area sits noticeably below the rest — and that gap may be doing more emotional work than the overall picture suggests. The question is less whether anything is here, and more whether that one lagging piece can catch up.",
    tone: "focused, gently direct",
  },
  {
    id: "soft_start_sync",
    match: {
      signal: "low",
      consistency: "clear",
      reciprocity: "mutual",
      connection_stage: "early",
    },
    title: "Soft Start, In Sync",
    summary_template:
      "The signal is still light, but it is light in the same way on both sides — early, mutual, and unhurried rather than mismatched. This feels like two people agreeing the connection is young, not two people disagreeing about what it is.",
    tone: "reassuring, unhurried",
  },
  {
    id: "foggy_answers_pattern",
    match: {
      ambiguity_rate_gte: 0.4,
    },
    title: "More Fog Than Signal",
    summary_template:
      "Uncertainty shows up often in how you answered, so the picture stays hazy even when some scores look decisive. The clearest pattern here is hesitation — not a firm yes or no about where things stand.",
    tone: "patient, non-pushing",
  },
  {
    id: "rapid_recheck",
    match: {
      is_retest: true,
      hours_since_last_session_lte: 48,
    },
    title: "Quick Recheck Energy",
    summary_template:
      "You returned to this very soon after your last pass — which often means the feelings still feel live and unfinished. Treat this read as a pulse check on what is active right now, not proof that something has fundamentally shifted.",
    tone: "steady, grounding",
  },
  {
    id: "strong_but_unnamed",
    match: {
      signal: "high",
      consistency: "clear",
      reciprocity: "unclear",
    },
    title: "Strong, Still Unnamed",
    summary_template:
      "The feeling looks coherent and substantial on your side, but whether it is fully shared remains hard to pin down. Something real seems to be present — the shared label for it just has not caught up yet.",
    tone: "clear, open-ended",
  },
  {
    id: "steady_mutual_build",
    match: {
      signal: "medium",
      consistency: "clear",
      reciprocity: "mutual",
      trend: "rising",
    },
    title: "Steady and Building",
    summary_template:
      "This reads balanced and reciprocated, with enough consistency to trust the direction. It is not at full intensity yet, but the pattern suggests intentional movement rather than accidental closeness.",
    tone: "encouraging, quietly confident",
  },
];
