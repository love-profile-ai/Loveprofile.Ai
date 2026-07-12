import { z } from "zod";

export const analysisReportSchema = z.object({
  summary: z.string().min(1),
  ai_summary: z.string().min(20),
  confidence: z.enum(["Low", "Medium", "High"]),
  what_we_noticed: z.array(z.string()).min(1),
  gentle_next_steps: z.array(z.string()).min(1),
  looking_ahead: z.string().min(1),
});

/** LLM reflective report — numeric confidence + label. */
export const reflectiveReportSchema = z.object({
  summary: z.string().min(1),
  ai_summary: z.string().min(20),
  confidence: z.number().min(0).max(100),
  confidence_label: z.enum(["Low", "Medium", "High"]),
  what_we_noticed: z.array(z.string()).min(1),
  gentle_next_steps: z.array(z.string()).min(1),
  looking_ahead: z.string().min(1),
});

/** Thin personalization layer — translates pre-computed signals only. */
export const personalizationLayerSchema = z.object({
  archetype: z.string().min(2).max(80),
  opener_line: z.string().min(4).max(200),
  tone_class: z.enum(["terse", "reflective", "anxious", "calm", "guarded", "open"]),
  ai_summary: z.string().min(40).max(1200),
  next_step: z.string().min(8).max(200),
  looking_ahead: z.string().min(8).max(300),
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
