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

  const positives: string[] = [];
  const concerns: string[] = [];
  const mixed_signals: string[] = [];

  if (trustScore >= 7) positives.push("you trust this person deeply");
  if (comfortScore >= 7) positives.push("you feel safe being your authentic self around them");
  if (miss === "often" || miss === "almost_always") {
    positives.push("you miss them when apart");
  }
  if (remember === "often" || remember === "almost_always") {
    positives.push("you notice and remember small details about them");
  }
  if (future === "often" || future === "very_often") {
    positives.push("you can picture a future that includes them");
  }
  if (timeScore >= 7) positives.push("you prioritize them even when life is busy");

  if (trustScore <= 4) concerns.push("trust still feels uncertain");
  if (comfortScore <= 4) concerns.push("you may not feel fully yourself around them yet");
  if (frequency === "rarely") concerns.push("limited contact makes feelings harder to read");
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

  const what_we_noticed = [
    interest_level,
    `You ${frequency === "daily" || frequency === "several_times_week" ? "stay in regular contact" : "connect less often"}, which ${frequency === "rarely" ? "can make feelings feel abstract" : "gives your bond room to grow"}. Attraction reads as ${attraction.replace(/_/g, " ")}.`,
    `Thinking about them (${thinkScore}/10), excitement to see them (${excitedScore}/10), and missing them (${miss.replace(/_/g, " ")}) together suggest ${emotionalIntensity >= 6 ? "real emotional presence" : "lighter or early-stage attachment"}.`,
    mixed_signals.length
      ? mixed_signals[0]
      : null,
  ].filter((s): s is string => Boolean(s));

  const gentle_next_steps = [
    "Notice whether your feelings grow with time and contact, or fade when you're apart",
    "Pay attention to whether you want exclusivity, or mainly enjoy their company",
    ifConfessed === "need_time"
      ? "It's okay to ask for time — clarity beats rushing a label"
      : "Consider what you'd want if they felt the same way tomorrow",
    "Talk to someone you trust if the feelings feel heavy or confusing",
  ];

  const looking_ahead =
    ifConfessed === "say_yes"
      ? "If they opened up romantically, you seem emotionally prepared to explore it — but only you can know if that feels right."
      : ifConfessed === "need_time"
        ? "You'd likely want clarity before deciding — pacing matters to you."
        : "A direct confession might surface questions about what you truly want long term.";

  const ai_summary = [
    positives.length
      ? `Across your answers, ${positives.slice(0, 3).join(", ")}.`
      : "Your answers show a connection that is still taking shape.",
    concerns.length
      ? `At the same time, ${concerns.slice(0, 2).join(" and ")}.`
      : null,
    mixed_signals.length ? mixed_signals[0] + "." : null,
    `You interact ${frequency.replace(/_/g, " ")} and describe what you feel as "${feelingType.replace(/_/g, " ")}".`,
  ]
    .filter(Boolean)
    .join(" ");

  return {
    summary: `Based on your answers, your connection with this ${role.replace(/_/g, " ")} shows ${emotionalIntensity >= 6 ? "meaningful" : "some"} emotional pull. You interact ${frequency.replace(/_/g, " ")}, and you describe the feeling as "${feelingType.replace(/_/g, " ")}". This reflects patterns in your responses — not a guarantee about what you should feel.`,
    ai_summary,
    confidence: conf,
    what_we_noticed,
    gentle_next_steps,
    looking_ahead,
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

  const positives: string[] = [];
  const concerns: string[] = [];
  const mixed_signals: string[] = [];

  if (engagement >= 7) positives.push("they stay engaged when talking with you");
  if (remembers === "often" || remembers === "almost_always") {
    positives.push("they remember small details about you");
  }
  if (upset === "comfort" || upset === "go_out_of_way") {
    positives.push("they show up when you're upset");
  }
  if (makesTime >= 7) positives.push("they make time for you despite being busy");
  if (compliments === "often" || compliments === "very_often") {
    positives.push("they express appreciation regularly");
  }
  if (introduced === "yes") positives.push("they've brought you into their inner circle");

  if (engagement <= 4) concerns.push("conversations may feel one-sided or low energy");
  if (reciprocity <= 4) concerns.push("your effort may not feel fully returned");
  if (inRelationship === "yes") concerns.push("they are currently in another relationship");
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

  const what_we_noticed = [
    interest_level,
    `${initiator === "mostly_them" ? "They often start conversations" : initiator === "mostly_me" ? "You usually reach out first" : "Initiation feels balanced"}. You interact ${frequency.replace(/_/g, " ")}.`,
    `Emotional openness (${openness}/10) and how happy they seem to see you (${happyScore}/10) ${happyScore >= 6 ? "suggest warmth" : "feel neutral or hard to read"}.`,
    mixed_signals.length ? mixed_signals[0] : null,
  ].filter((s): s is string => Boolean(s));

  const gentle_next_steps = [
    "Compare their behavior with you vs. with others — consistency matters",
    "Look for sustained effort over weeks, not one intense moment",
    inRelationship === "yes"
      ? "Respect their existing relationship while you interpret signals"
      : "If you want clarity, a direct but kind conversation beats guessing",
    "Protect your peace — mixed signals deserve patience, not self-blame",
  ];

  const looking_ahead =
    expressed === "yes" || guess === "definitely_romantic"
      ? "A honest conversation about intentions could bring clarity — if you want it."
      : interestScore >= 6
        ? "Watch whether romantic gestures increase over time, or stay consistently friendly."
        : "Without clearer signals, assuming friendship may be the safest read.";

  const ai_summary = [
    positives.length
      ? `From what you shared, ${positives.slice(0, 3).join(", ")}.`
      : "Their behavior reads fairly neutral from your answers so far.",
    concerns.length
      ? `You also noted that ${concerns.slice(0, 2).join(" and ")}.`
      : null,
    mixed_signals.length ? mixed_signals[0] + "." : null,
    `You interact ${frequency.replace(/_/g, " ")} and your overall read is "${guess.replace(/_/g, " ")}".`,
  ]
    .filter(Boolean)
    .join(" ");

  return {
    summary: `You asked whether someone in your life (${role.replace(/_/g, " ")}) may have romantic feelings. Their engagement (${engagement}/10), effort (${reciprocity}/10 reciprocity), and your overall guess ("${guess.replace(/_/g, " ")}") suggest ${interestScore >= 6 ? "meaningful" : "moderate or unclear"} interest — but no analysis can read another person's heart with certainty.`,
    ai_summary,
    confidence: conf,
    what_we_noticed,
    gentle_next_steps,
    looking_ahead,
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
    return `Based on your report: ${analysis.ai_summary.slice(0, 280)} Remember — one gesture rarely proves romantic intent on its own. Look for consistency across time.`;
  }
  if (lower.includes("should i") || lower.includes("what do i do")) {
    return `${analysis.gentle_next_steps[0]} ${analysis.gentle_next_steps[1] ?? ""} ${analysis.looking_ahead}`.trim();
  }
  if (lower.includes("love") || lower.includes("like me")) {
    return `${analysis.what_we_noticed[0] ?? analysis.summary} Confidence in this read: ${analysis.confidence}.`;
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
