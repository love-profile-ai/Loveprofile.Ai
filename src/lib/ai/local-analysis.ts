import type { AnalysisReport, ConfidenceLevel } from "@/types/report";
import type { Answer, AnalysisPath } from "@/types/questionnaire";

function get(answers: Answer[], id: string): string | number | boolean | undefined {
  return answers.find((a) => a.questionId === id)?.value;
}

function scale(answers: Answer[], id: string): number {
  const v = get(answers, id);
  return typeof v === "number" ? v : 0;
}

function pick(answers: Answer[], id: string): string {
  const v = get(answers, id);
  return v !== undefined ? String(v) : "";
}

function avg(nums: number[]): number {
  if (!nums.length) return 0;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

function confidence(score: number): ConfidenceLevel {
  if (score >= 7) return "High";
  if (score >= 4) return "Medium";
  return "Low";
}

function label(path: AnalysisPath): string {
  return path === "i_like_someone" ? "your feelings" : "their interest";
}

export function generateAnalysis(
  path: AnalysisPath,
  answers: Answer[]
): AnalysisReport {
  if (path === "i_like_someone") {
    return analyzeOwnFeelings(answers);
  }
  return analyzeTheirInterest(answers);
}

function analyzeOwnFeelings(answers: Answer[]): AnalysisReport {
  const thinkScore = scale(answers, "think_about_them");
  const excitedScore = scale(answers, "excited_to_see");
  const happinessScore = scale(answers, "happiness_importance");
  const trustScore = scale(answers, "trust_level");
  const comfortScore = scale(answers, "true_self_comfort");
  const supportScore = scale(answers, "support_difficult");
  const timeScore = scale(answers, "make_time");
  const miss = pick(answers, "miss_them");
  const future = pick(answers, "imagined_future");
  const remember = pick(answers, "remember_details");
  const datingReaction = pick(answers, "dating_someone_else");
  const feelingType = pick(answers, "love_crush_admiration");
  const ifConfessed = pick(answers, "if_confessed");
  const attraction = pick(answers, "attraction_type");
  const role = pick(answers, "relationship_role");
  const frequency = pick(answers, "interaction_frequency");

  const emotionalIntensity = avg([
    thinkScore,
    excitedScore,
    happinessScore,
    comfortScore,
    supportScore,
    timeScore,
  ]);

  const green_flags: string[] = [];
  const red_flags: string[] = [];
  const mixed_signals: string[] = [];

  if (trustScore >= 7) green_flags.push("You trust this person deeply");
  if (comfortScore >= 7) green_flags.push("You feel safe being your authentic self");
  if (miss === "often" || miss === "almost_always") {
    green_flags.push("You miss them when apart — a sign of emotional attachment");
  }
  if (remember === "often" || remember === "almost_always") {
    green_flags.push("You notice and remember details about them");
  }
  if (future === "often" || future === "very_often") {
    green_flags.push("You can picture a future that includes them");
  }
  if (timeScore >= 7) green_flags.push("You prioritize them even when life is busy");

  if (trustScore <= 4) red_flags.push("Trust still feels uncertain");
  if (comfortScore <= 4) red_flags.push("You may not feel fully yourself around them yet");
  if (frequency === "rarely") red_flags.push("Limited contact may make feelings harder to read");
  if (datingReaction === "happy" && emotionalIntensity >= 6) {
    mixed_signals.push("Strong inner attachment but outward reaction to them dating others sounds accepting");
  }

  let relationship_stage = "Early exploration";
  if (emotionalIntensity >= 7 && (feelingType === "love" || feelingType === "crush")) {
    relationship_stage = "Deepening emotional attachment";
  } else if (feelingType === "friendship" || feelingType === "admiration") {
    relationship_stage = "Close connection — romantic clarity still forming";
  }

  let interest_level =
    emotionalIntensity >= 7
      ? "Your answers suggest strong emotional investment in this person"
      : emotionalIntensity >= 4
        ? "You care meaningfully, with a mix of warmth and uncertainty"
        : "Feelings appear mild or still developing";

  if (feelingType === "love") interest_level = "You identify this as love — your answers largely support deep care";
  if (feelingType === "crush") interest_level = "This reads more like a crush: intense focus with less long-term clarity";
  if (feelingType === "friendship") interest_level = "Much of this may be friendship — though some answers hint at more";

  const probability_estimate =
    datingReaction === "heartbroken" || datingReaction === "very_upset"
      ? "Your reactions suggest romantic feelings are likely present, even if unspoken"
      : ifConfessed === "say_yes"
        ? "You seem open to reciprocity — romantic interest is plausible"
        : ifConfessed === "stay_friends" || ifConfessed === "say_no"
          ? "Your instinct leans platonic if they confessed today"
          : "Romantic vs. platonic feelings still seem genuinely mixed";

  const conf = confidence(
    answers.length >= 12 ? emotionalIntensity : emotionalIntensity - 2
  );

  return {
    summary: `Based on your answers, your connection with this ${role.replace(/_/g, " ")} shows ${emotionalIntensity >= 6 ? "meaningful" : "some"} emotional pull. You interact ${frequency.replace(/_/g, " ")}, and your self-reported feeling type is "${feelingType.replace(/_/g, " ")}". This report reflects patterns in your responses — not a guarantee about what you "should" feel.`,
    relationship_stage,
    interest_level,
    communication_analysis: `You ${frequency === "daily" || frequency === "several_times_week" ? "stay in regular contact" : "connect less often"}, which ${frequency === "rarely" ? "can make feelings feel abstract" : "gives your bond room to grow"}. Attraction reads as ${attraction.replace(/_/g, " ")}.`,
    emotional_signals: `Thinking about them (${thinkScore}/10), excitement to see them (${excitedScore}/10), and missing them (${miss.replace(/_/g, " ")}) together paint a picture of ${emotionalIntensity >= 6 ? "real emotional presence" : "lighter or early-stage attachment"}.`,
    attachment_style: comfortScore >= 7 && trustScore >= 7
      ? "You likely lean secure when with them — openness and trust both show up"
      : comfortScore >= 5
        ? "Some secure signals, with normal hesitation about vulnerability"
        : "You may be cautious or still testing how safe the connection feels",
    mixed_signals,
    green_flags,
    red_flags,
    behavior_patterns: `You ${timeScore >= 6 ? "invest time" : "keep some distance"}, ${remember !== "never" ? "track details about them" : "focus more on the big picture"}, and ${future !== "never" ? "sometimes imagine shared futures" : "stay mostly in the present"}.`,
    probability_estimate,
    future_outlook: ifConfessed === "say_yes"
      ? "If they opened up romantically, you seem emotionally prepared to explore it"
      : ifConfessed === "need_time"
        ? "You'd likely want clarity before deciding — pacing matters to you"
        : "A direct confession might surface questions about what you truly want long term",
    possible_misunderstandings: [
      feelingType === "unsure"
        ? "Labeling the feeling too early can create pressure — your answers show genuine uncertainty"
        : "Strong care can be mistaken for romantic love, especially in close friendships",
      datingReaction === "not_sure"
        ? "How you'd react if they dated someone else is unclear — that's worth sitting with"
        : "",
    ].filter(Boolean),
    advice: [
      "Notice whether your feelings grow with time and contact, or fade when you're apart",
      "Pay attention to whether you want exclusivity, or mainly enjoy their company",
      ifConfessed === "need_time"
        ? "It's okay to ask for time — clarity beats rushing a label"
        : "Consider what you'd want if they felt the same way tomorrow",
      "Talk to someone you trust if the feelings feel heavy or confusing",
    ],
    confidence: conf,
  };
}

function analyzeTheirInterest(answers: Answer[]): AnalysisReport {
  const engagement = scale(answers, "engagement_level");
  const makesTime = scale(answers, "makes_time");
  const happyScore = scale(answers, "happy_when_seeing");
  const openness = scale(answers, "emotional_openness");
  const reciprocity = scale(answers, "effort_reciprocity");
  const initiator = pick(answers, "conversation_initiator");
  const remembers = pick(answers, "remembers_details");
  const upset = pick(answers, "upset_response");
  const introduced = pick(answers, "introduced_friends");
  const compliments = pick(answers, "compliments");
  const jealousy = pick(answers, "jealousy");
  const trust = pick(answers, "trust_personal");
  const inRelationship = pick(answers, "in_relationship");
  const expressed = pick(answers, "romantic_interest_expressed");
  const guess = pick(answers, "guess_feelings");
  const role = pick(answers, "relationship_role");
  const frequency = pick(answers, "interaction_frequency");

  const interestScore = avg([engagement, makesTime, happyScore, openness, reciprocity]);

  const green_flags: string[] = [];
  const red_flags: string[] = [];
  const mixed_signals: string[] = [];

  if (engagement >= 7) green_flags.push("They stay engaged when talking with you");
  if (remembers === "often" || remembers === "almost_always") {
    green_flags.push("They remember small details about you");
  }
  if (upset === "comfort" || upset === "go_out_of_way") {
    green_flags.push("They show up when you're upset");
  }
  if (makesTime >= 7) green_flags.push("They make time for you despite being busy");
  if (compliments === "often" || compliments === "very_often") {
    green_flags.push("They express appreciation regularly");
  }
  if (introduced === "yes") green_flags.push("They've brought you into their inner circle");

  if (engagement <= 4) red_flags.push("Conversations may feel one-sided or low energy");
  if (reciprocity <= 4) red_flags.push("Your effort may not feel fully returned");
  if (inRelationship === "yes") red_flags.push("They are currently in another relationship");
  if (expressed === "no" && interestScore >= 6) {
    mixed_signals.push("Warm behavior without clear romantic words");
  }
  if (initiator === "mostly_me" && interestScore >= 5) {
    mixed_signals.push("You often initiate — warmth may be friendly rather than romantic");
  }
  if (jealousy === "never" && interestScore >= 6) {
    mixed_signals.push("Strong closeness without signs of jealousy or protectiveness");
  }

  let relationship_stage = "Friendly connection";
  if (interestScore >= 7 && expressed !== "no") relationship_stage = "Possible romantic undertones";
  if (guess === "definitely_romantic" || guess === "probably_romantic") {
    relationship_stage = "Romantic interest seems plausible to you";
  }

  const interest_level =
    interestScore >= 7
      ? "Their behavior suggests meaningful interest in you"
      : interestScore >= 4
        ? "Mixed signals — care is present, romance is unclear"
        : "Behavior reads more platonic or distant right now";

  const probability_estimate =
    expressed === "yes"
      ? "They have expressed romantic interest before — that is the strongest signal in your answers"
      : guess === "definitely_romantic"
        ? "Your read is strongly romantic, and several behaviors align"
        : guess === "probably_friendship" || guess === "definitely_friendship"
          ? "Your gut leans friendship — their actions may support that"
          : inRelationship === "yes"
            ? "Romantic interest is harder to infer while they are with someone else"
            : "Interest level is genuinely uncertain from behavior alone";

  const conf = confidence(answers.length >= 12 ? interestScore : interestScore - 2);

  return {
    summary: `You asked whether someone in your life (${role.replace(/_/g, " ")}) may have romantic feelings. Their engagement (${engagement}/10), effort (${reciprocity}/10 reciprocity), and your overall guess ("${guess.replace(/_/g, " ")}") suggest ${interestScore >= 6 ? "meaningful" : "moderate or unclear"} interest — but no analysis can read another person's heart with certainty.`,
    relationship_stage,
    interest_level,
    communication_analysis: `${initiator === "mostly_them" ? "They often start conversations" : initiator === "mostly_me" ? "You usually reach out first" : "Initiation feels balanced"}. You interact ${frequency.replace(/_/g, " ")}.`,
    emotional_signals: `Emotional openness (${openness}/10) and how happy they seem to see you (${happyScore}/10) ${happyScore >= 6 ? "suggest warmth" : "feel neutral or hard to read"}.`,
    attachment_style: trust === "yes" && openness >= 6
      ? "They seem willing to be vulnerable with you — a sign of trust"
      : trust === "sometimes"
        ? "Trust appears situational — they share selectively"
        : "Emotional access may still be limited",
    mixed_signals,
    green_flags,
    red_flags,
    behavior_patterns: `They ${compliments !== "never" ? "give compliments" : "rarely compliment"}, ${introduced === "yes" ? "include you socially" : "haven't fully integrated you into their circle yet"}, and ${upset !== "ignore" ? "respond when you're upset" : "may pull back when you're struggling"}.`,
    probability_estimate,
    future_outlook: expressed === "yes" || guess === "definitely_romantic"
      ? "A honest conversation about intentions could bring clarity — if you want it"
      : interestScore >= 6
        ? "Watch whether romantic gestures increase over time, or stay consistently friendly"
        : "Without clearer signals, assuming friendship may be the safest read",
    possible_misunderstandings: [
      "Friendly people can seem flirty without romantic intent",
      initiator === "mostly_them"
        ? "Someone who texts first isn't always in love — they may simply enjoy your company"
        : "If you always initiate, their warmth might reflect comfort, not pursuit",
      jealousy === "sometimes"
        ? "Occasional jealousy can mean care, but isn't proof of romance"
        : "",
    ].filter(Boolean),
    advice: [
      "Compare their behavior with you vs. with others — consistency matters",
      "Look for sustained effort over weeks, not one intense moment",
      inRelationship === "yes"
        ? "Respect their existing relationship while you interpret signals"
        : "If you want clarity, a direct but kind conversation beats guessing",
      "Protect your peace — mixed signals deserve patience, not self-blame",
    ],
    confidence: conf,
  };
}

export async function generateChatResponse(
  path: string,
  answers: Answer[],
  analysis: AnalysisReport,
  _history: { role: "user" | "assistant"; content: string }[],
  message: string
): Promise<string> {
  const lower = message.toLowerCase();

  if (lower.includes("sign") || lower.includes("signal")) {
    return `Based on your report, key signals include: ${analysis.green_flags.slice(0, 2).join("; ") || "the patterns in your original answers"}. Remember — one gesture rarely proves romantic intent on its own. Look for consistency across time.`;
  }
  if (lower.includes("should i") || lower.includes("what do i do")) {
    return `${analysis.advice[0]} ${analysis.advice[1]} Your report also noted: ${analysis.probability_estimate}`;
  }
  if (lower.includes("love") || lower.includes("like me")) {
    return `Your analysis suggests: ${analysis.interest_level}. ${analysis.probability_estimate} Confidence in this read: ${analysis.confidence}.`;
  }

  return `Reflecting on your ${path === "i_like_someone" ? "feelings" : "situation"}: ${analysis.summary.slice(0, 200)}… What part would you like to explore — their behavior, your feelings, or next steps?`;
}

export async function* streamChatResponse(
  path: string,
  answers: Answer[],
  analysis: AnalysisReport,
  history: { role: "user" | "assistant"; content: string }[],
  message: string
): AsyncGenerator<string> {
  const text = await generateChatResponse(path, answers, analysis, history, message);
  for (const word of text.split(" ")) {
    yield word + " ";
    await new Promise((r) => setTimeout(r, 15));
  }
}

export function formatAnalysisError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  return message || "Analysis failed. Please try again.";
}
