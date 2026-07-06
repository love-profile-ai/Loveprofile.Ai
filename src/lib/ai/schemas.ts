import { z } from "zod";

export const analysisReportSchema = z.object({
  summary: z.string().min(1),
  confidence: z.enum(["Low", "Medium", "High"]),
  green_flags: z.array(z.string()),
  red_flags: z.array(z.string()),
  what_we_noticed: z.array(z.string()).min(1),
  gentle_next_steps: z.array(z.string()).min(1),
  looking_ahead: z.string().min(1),
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
