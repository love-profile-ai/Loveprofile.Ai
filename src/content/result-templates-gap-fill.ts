/**
 * Result templates for Nila — matched deterministically in code.
 * Complements the core relationship-type logic in generateReport.ts.
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
  /** Small pill/badge text shown near the archetype in the UI. */
  mood_tag?: string;
  /** Kept for backward compatibility — always equal to summary_variants[0]. */
  summary_template: string;
  /** 3–5 pre-written variants; picked deterministically by answer-seed. */
  summary_variants: string[];
  /** 3–5 pre-written variants; picked deterministically by answer-seed. */
  looking_ahead_variants: string[];
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
    mood_tag: "charged",
    summary_template:
      "The overall pull reads strong, but it does not settle evenly — warmth shows up in bursts while steadier parts of the bond lag behind. You may be feeling more of the charge than the reciprocity can reliably match.",
    summary_variants: [
      "The overall pull reads strong, but it does not settle evenly — warmth shows up in bursts while steadier parts of the bond lag behind. You may be feeling more of the charge than the reciprocity can reliably match.",
      "Something here glows brightly, but not evenly — the warmth arrives in waves while the steadier parts of the connection haven't caught up.",
      "The charge is real, but the balance isn't — you may be carrying more of the emotional weight than comes back to you.",
    ],
    looking_ahead_variants: [
      "Intensity without steadiness is worth noticing — not dismissing, just watching.",
      "Bright moments matter, but patterns over time tell the fuller story.",
      "Let the next few weeks show whether the warmth becomes consistent, not just memorable.",
    ],
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
    mood_tag: "settling",
    summary_template:
      "Both of you appear to be in a similar, low-key place — not out of step with each other, just lightly invested. It reads less like mixed signals and more like shared momentum fading together.",
    summary_variants: [
      "Both of you appear to be in a similar, low-key place — not out of step with each other, just lightly invested. It reads less like mixed signals and more like shared momentum fading together.",
      "You both seem to be resting at a similar, quiet altitude — not misaligned, just gently coasting.",
      "This doesn't read as confusion so much as agreement — a shared, low hum rather than a spark either of you is chasing.",
    ],
    looking_ahead_variants: [
      "A quiet plateau isn't a verdict — it's a place you can choose to leave or stay in.",
      "If this settles further, that's information too — not something to fight.",
      "Notice whether either of you tries to raise the temperature, or whether you're both content where it sits.",
    ],
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
    mood_tag: "focused",
    summary_template:
      "Most of this connection holds up on paper, but one area sits noticeably below the rest — and that gap may be doing more emotional work than the overall picture suggests. The question is less whether anything is here, and more whether that one lagging piece can catch up.",
    summary_variants: [
      "Most of this connection holds up on paper, but one area sits noticeably below the rest — and that gap may be doing more emotional work than the overall picture suggests. The question is less whether anything is here, and more whether that one lagging piece can catch up.",
      "Nearly everything here checks out except one piece — and that single gap can carry more weight than the average suggests.",
      "The overall shape looks solid, but one dimension is dragging behind the rest, and it's worth asking why.",
    ],
    looking_ahead_variants: [
      "One weak link doesn't undo the rest — but it does deserve direct attention, not avoidance.",
      "Watch whether that one gap closes with time, or whether it's actually the clearest signal you have.",
      "The strongest connections aren't the ones without gaps — they're the ones willing to name them.",
    ],
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
    mood_tag: "early",
    summary_template:
      "The signal is still light, but it is light in the same way on both sides — early, mutual, and unhurried rather than mismatched. This feels like two people agreeing the connection is young, not two people disagreeing about what it is.",
    summary_variants: [
      "The signal is still light, but it is light in the same way on both sides — early, mutual, and unhurried rather than mismatched. This feels like two people agreeing the connection is young, not two people disagreeing about what it is.",
      "There isn't much weight here yet, but what's there is shared evenly — two people starting at the same quiet pace.",
      "This reads as early, not uneven — the lightness isn't a warning sign, it's just where things are.",
    ],
    looking_ahead_variants: [
      "Early and mutual is a good place to begin — there's no need to rush what's still forming.",
      "Let this stay unhurried. Matching paces early on tends to matter more than early intensity.",
      "Give it time before asking it to be more than what it currently is.",
    ],
    tone: "reassuring, unhurried",
  },
  {
    id: "foggy_answers_pattern",
    match: {
      ambiguity_rate_gte: 0.4,
    },
    title: "More Fog Than Signal",
    mood_tag: "hazy",
    summary_template:
      "Uncertainty shows up often in how you answered, so the picture stays hazy even when some scores look decisive. The clearest pattern here is hesitation — not a firm yes or no about where things stand.",
    summary_variants: [
      "Uncertainty shows up often in how you answered, so the picture stays hazy even when some scores look decisive. The clearest pattern here is hesitation — not a firm yes or no about where things stand.",
      "More than a few of your answers carried real hesitation, and that hesitation is itself the clearest signal available right now.",
      "The fog here isn't a lack of information — it's a real reflection of how unresolved this still feels to you.",
    ],
    looking_ahead_variants: [
      "Uncertainty deserves patience, not pressure to resolve it before you're ready.",
      "A hazy picture today can sharpen with time — there's no rush to force clarity.",
      "Notice what starts to feel less uncertain as more time passes, rather than trying to decide it all now.",
    ],
    tone: "patient, non-pushing",
  },
  {
    id: "rapid_recheck",
    match: {
      is_retest: true,
      hours_since_last_session_lte: 48,
    },
    title: "Quick Recheck Energy",
    mood_tag: "live",
    summary_template:
      "You returned to this very soon after your last pass — which often means the feelings still feel live and unfinished. Treat this read as a pulse check on what is active right now, not proof that something has fundamentally shifted.",
    summary_variants: [
      "You returned to this very soon after your last pass — which often means the feelings still feel live and unfinished. Treat this read as a pulse check on what is active right now, not proof that something has fundamentally shifted.",
      "Coming back this quickly usually means something is still actively on your mind — this is more a pulse check than a new verdict.",
      "A fast return like this often means the feeling is still unsettled, not that anything major has changed since last time.",
    ],
    looking_ahead_variants: [
      "Give the feeling room to settle before checking again — repeated snapshots taken too close together rarely add new clarity.",
      "This is a moment-in-time read. Let a bit more distance pass before trusting a shift.",
      "What's active right now matters, but it isn't the whole story yet.",
    ],
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
    mood_tag: "unfolding",
    summary_template:
      "The feeling looks coherent and substantial on your side, but whether it is fully shared remains hard to pin down. Something real seems to be present — the shared label for it just has not caught up yet.",
    summary_variants: [
      "The feeling looks coherent and substantial on your side, but whether it is fully shared remains hard to pin down. Something real seems to be present — the shared label for it just has not caught up yet.",
      "What you feel reads as solid and real — what it's called between you two is the part still open.",
      "There's clearly something here on your end. Whether it has a shared name yet is a separate question.",
    ],
    looking_ahead_variants: [
      "A feeling can be real before it has a label — that's not a contradiction, that's just timing.",
      "The name for this may come later. What's here now doesn't need to wait for it.",
      "Let clarity about the label come from conversation, not guesswork.",
    ],
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
    mood_tag: "rising",
    summary_template:
      "This reads balanced and reciprocated, with enough consistency to trust the direction. It is not at full intensity yet, but the pattern suggests intentional movement rather than accidental closeness.",
    summary_variants: [
      "This reads balanced and reciprocated, with enough consistency to trust the direction. It is not at full intensity yet, but the pattern suggests intentional movement rather than accidental closeness.",
      "This looks even-handed and moving forward — not dramatic yet, but clearly headed somewhere on purpose.",
      "The pattern here is steady and shared, which tends to matter more long-term than early intensity ever does.",
    ],
    looking_ahead_variants: [
      "Steady, mutual movement is worth trusting — let it keep building at its own pace.",
      "This kind of quiet consistency is usually a good sign, not a lack of one.",
      "You don't need more intensity right now — you need more of exactly this.",
    ],
    tone: "encouraging, quietly confident",
  },
  {
    id: "quiet_certainty",
    match: {
      signal: "medium",
      consistency: "clear",
      reciprocity: "mutual",
    },
    title: "A Quiet Certainty",
    mood_tag: "settled",
    summary_template:
      "There's no great drama in what you've shared, and that itself is telling. What comes through instead is something steadier — a closeness that doesn't need proving, moving at its own unhurried pace.",
    summary_variants: [
      "There's no great drama in what you've shared, and that itself is telling. What comes through instead is something steadier — a closeness that doesn't need proving, moving at its own unhurried pace.",
      "Nothing here is loud, but something here is real. This reads as closeness that's settled rather than uncertain.",
      "What you've described doesn't ask for a verdict — it asks for patience. The closeness here feels mutual and unhurried.",
    ],
    looking_ahead_variants: [
      "Not every closeness announces itself. Some of the steadiest ones simply stay.",
      "Quiet doesn't mean unclear. This has room to keep being exactly what it is.",
      "Steady bonds often deepen by continuing — not by becoming louder.",
    ],
    tone: "settled, unbothered by lack of intensity, quietly reassuring",
  },
];

/**
 * Core fallback templates — always available, never expected to match
 * naturally. `mixed_clarifying` is the explicit, loud fallback returned
 * by findBestMatch() when nothing in RESULT_TEMPLATES_GAP_FILL matches.
 */
export const RESULT_TEMPLATES_CORE: ResultTemplate[] = [
  {
    id: "mixed_clarifying",
    match: {},
    title: "Mixed Signals, Gently Clarified",
    mood_tag: "reflective",
    summary_template:
      "Your answers hold more than one tone at once — warmth and hesitation, closeness and distance. That mixture is the story right now, not a failure to decide.",
    summary_variants: [
      "Your answers hold more than one tone at once — warmth and hesitation, closeness and distance. That mixture is the story right now, not a failure to decide.",
      "Nothing here resolves into a simple yes or no — and that may be the most honest read available today.",
      "The pattern is mixed, not empty. What you feel is real; what it becomes is still unfolding.",
    ],
    looking_ahead_variants: [
      "Clarity often arrives in layers — let the next chapter add detail, not demand a verdict.",
      "Mixed signals are information too. Watch what repeats, not what flickers once.",
      "You don't need to force a label yet. Observation is enough for now.",
    ],
    tone: "patient, non-judging, gently clarifying",
  },
];

/** Full template bank used by the matcher — gap-fill first, core last. */
export const ALL_RESULT_TEMPLATES: ResultTemplate[] = [
  ...RESULT_TEMPLATES_GAP_FILL,
  ...RESULT_TEMPLATES_CORE,
];
