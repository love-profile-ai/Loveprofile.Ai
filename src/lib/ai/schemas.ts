import { z } from "zod";

export const analysisReportSchema = z.object({
  summary: z.string(),
  relationship_stage: z.string(),
  interest_level: z.string(),
  communication_analysis: z.string(),
  emotional_signals: z.string(),
  attachment_style: z.string(),
  mixed_signals: z.array(z.string()),
  green_flags: z.array(z.string()),
  red_flags: z.array(z.string()),
  behavior_patterns: z.string(),
  probability_estimate: z.string(),
  future_outlook: z.string(),
  possible_misunderstandings: z.array(z.string()),
  advice: z.array(z.string()),
  confidence: z.enum(["Low", "Medium", "High"]),
});

export const answerSchema = z.object({
  questionId: z.string(),
  questionText: z.string(),
  type: z.enum(["multiple_choice", "text", "scale", "yes_no", "emoji_scale"]),
  value: z.union([z.string(), z.number(), z.boolean()]),
});

export const analyzeRequestSchema = z.object({
  sessionId: z.string().uuid().optional(),
  path: z.enum(["i_like_someone", "someone_likes_me"]),
  answers: z.array(answerSchema).min(3),
});

export const chatRequestSchema = z.object({
  reportId: z.string().uuid(),
  message: z.string().min(1).max(2000),
});
