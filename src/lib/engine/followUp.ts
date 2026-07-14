import type { AnswerValue, Question } from "@/types/adaptive-engine";
import { createOpenRouterClient, OPENROUTER_MODEL } from "@/lib/ai/openrouter";
import { isUncertainAnswer } from "./updateProfile";

export function findClarificationQuestion(
  questions: Question[],
  parentQuestionId: string,
  askedIds: Set<string>
): Question | null {
  return (
    questions.find(
      (q) =>
        q.is_clarification &&
        q.parent_question_id === parentQuestionId &&
        q.is_active !== false &&
        !askedIds.has(q.id)
    ) ?? null
  );
}

export async function generateClarificationQuestion(
  parentQuestion: Question,
  answerValue: AnswerValue,
  pathLabel: string
): Promise<Question | null> {
  try {
    const client = createOpenRouterClient();
    const response = await client.chat.completions.create({
      model: OPENROUTER_MODEL,
      temperature: 0.4,
      max_tokens: 200,
      messages: [
        {
          role: "system",
          content:
            "You generate ONE short clarifying follow-up question for a relationship self-reflection app. Return JSON only: {\"question_text\":\"...\",\"options\":[{\"label\":\"...\",\"value\":\"...\"}]} with 3-4 single_select options. Keep it gentle and specific.",
        },
        {
          role: "user",
          content: `Path: ${pathLabel}. Parent question: "${parentQuestion.question_text}". Uncertain answer: ${JSON.stringify(answerValue.raw)}. Dimension: ${parentQuestion.psychological_dimension}.`,
        },
      ],
      response_format: { type: "json_object" },
    });

    const raw = response.choices[0]?.message?.content;
    if (!raw) return null;

    const parsed = JSON.parse(raw) as {
      question_text?: string;
      options?: { label: string; value: string }[];
    };

    if (!parsed.question_text || !parsed.options?.length) return null;

    const id = `ai_clarify_${parentQuestion.id}_${Date.now()}`;

    return {
      id,
      path: parentQuestion.path,
      category: "clarification",
      question_text: parsed.question_text,
      type: "single_select",
      options: parsed.options,
      psychological_dimension: parentQuestion.psychological_dimension,
      weight: 0.8,
      priority: 99,
      follow_up_rules: {},
      scoring: {
        single_select: Object.fromEntries(
          parsed.options.map((o, i) => [
            o.value,
            { [parentQuestion.psychological_dimension]: 4 + i },
          ])
        ),
      },
      confidence_value: 0.1,
      parent_question_id: parentQuestion.id,
      is_clarification: true,
      is_active: true,
    };
  } catch {
    return null;
  }
}

export async function resolveFollowUp(
  parentQuestion: Question,
  answerValue: AnswerValue,
  questions: Question[],
  askedIds: Set<string>,
  pathLabel: string
): Promise<Question | null> {
  if (!isUncertainAnswer(parentQuestion, answerValue)) return null;

  const fromBank = findClarificationQuestion(
    questions,
    parentQuestion.id,
    askedIds
  );
  if (fromBank) return fromBank;

  if (process.env.ENABLE_LLM_QUESTION_SELECTOR !== "true") {
    return null;
  }

  return generateClarificationQuestion(parentQuestion, answerValue, pathLabel);
}
