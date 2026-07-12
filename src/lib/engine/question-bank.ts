import type { EnginePath } from "@/types/adaptive-engine";
import { createAdminClient, hasAdminCredentials } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import {
  ensureQuestionBankLoaded,
  EXPECTED_MIN_QUESTIONS_PER_PATH,
  getPathQuestionCount,
  getTotalQuestionCount,
  importSeedQuestionBank,
} from "./ensure-question-bank";
import { getSeedQuestionsForPath } from "./seed-questions";
import { rowToQuestion, validateQuestion } from "./question-utils";

export type QuestionLoadSource = "supabase" | "seed_fallback";

export interface QuestionLoadResult {
  questions: ReturnType<typeof rowToQuestion>[];
  source: QuestionLoadSource;
  count: number;
  path: EnginePath;
  warning?: string;
}

function logLoadResult(result: QuestionLoadResult) {
  if (result.source === "supabase") {
    console.log(
      `Loaded ${result.count} questions from Supabase (path: ${result.path})`
    );
    if (result.warning) {
      console.warn(`NOTE: ${result.warning}`);
    }
    return;
  }

  console.warn("WARNING: Questions table empty or unavailable.");
  console.warn(
    `Using seed questions. Loaded ${result.count} seed questions (path: ${result.path}).`
  );
  if (result.warning) {
    console.warn(`Reason: ${result.warning}`);
  }
}

/**
 * Load active questions for a path. Prefers Supabase always.
 * Seed fallback only when DB is empty/unreachable.
 */
export async function loadQuestionsForPath(
  path: EnginePath
): Promise<QuestionLoadResult> {
  await ensureQuestionBankLoaded();

  if (!hasAdminCredentials()) {
    const seed = getSeedQuestionsForPath(path);
    const result: QuestionLoadResult = {
      questions: seed,
      source: "seed_fallback",
      count: seed.length,
      path,
      warning: "SUPABASE_SERVICE_ROLE_KEY not configured — cannot read questions table",
    };
    logLoadResult(result);
    return result;
  }

  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("questions")
      .select("*")
      .eq("path", path)
      .eq("is_active", true)
      .order("priority", { ascending: false });

    if (error) {
      const seed = getSeedQuestionsForPath(path);
      const result: QuestionLoadResult = {
        questions: seed,
        source: "seed_fallback",
        count: seed.length,
        path,
        warning: `Supabase query failed: ${error.message}`,
      };
      logLoadResult(result);
      return result;
    }

    if (!data?.length) {
      const total = await getTotalQuestionCount();
      const seed = getSeedQuestionsForPath(path);
      const result: QuestionLoadResult = {
        questions: seed,
        source: "seed_fallback",
        count: seed.length,
        path,
        warning:
          total === 0
            ? "Questions table is empty for this path after auto-import attempt"
            : `No active questions found for path ${path} (total in DB: ${total})`,
      };
      logLoadResult(result);
      return result;
    }

    const questions = data.map((row) =>
      rowToQuestion(row as Record<string, unknown>)
    );

    const pathCount = questions.length;
    let warning: string | undefined;
    if (pathCount < EXPECTED_MIN_QUESTIONS_PER_PATH) {
      warning = `Only ${pathCount} questions for ${path}; migration 005 may not be applied (expected ~${EXPECTED_MIN_QUESTIONS_PER_PATH}+)`;
    }

    const result: QuestionLoadResult = {
      questions,
      source: "supabase",
      count: pathCount,
      path,
      warning,
    };
    logLoadResult(result);
    return result;
  } catch (err) {
    const seed = getSeedQuestionsForPath(path);
    const result: QuestionLoadResult = {
      questions: seed,
      source: "seed_fallback",
      count: seed.length,
      path,
      warning: err instanceof Error ? err.message : "Unknown loader error",
    };
    logLoadResult(result);
    return result;
  }
}

/** Convenience wrapper returning just the question array (server routes). */
export async function loadQuestions(path: EnginePath) {
  const result = await loadQuestionsForPath(path);
  return result.questions;
}

// Re-export profile helpers unchanged
export { profileFromRow, profileToRow, summaryFromProfileRow } from "./questions-loader-profiles";
