import { createAdminClient, hasAdminCredentials } from "@/lib/supabase/admin";
import type { EnginePath } from "@/types/adaptive-engine";
import { SEED_QUESTIONS } from "./seed-questions";
import { contentQuestionsToEngine } from "./question-content";
import { questionToRow } from "./question-utils";

/** Minimum active questions per path expected after migration 005. */
export const EXPECTED_MIN_QUESTIONS_PER_PATH = 40;

let importInFlight: Promise<{ imported: number } | null> | null = null;

export async function getTotalQuestionCount(): Promise<number | null> {
  if (!hasAdminCredentials()) return null;
  const admin = createAdminClient();
  const { count, error } = await admin
    .from("questions")
    .select("id", { count: "exact", head: true });
  if (error) return null;
  return count ?? 0;
}

/**
 * Upsert authored adaptive content (src/content/adaptive-questions.ts).
 * Safe to run on every startup — idempotent.
 */
export async function importContentQuestionBank(): Promise<{
  imported: number;
  error?: string;
}> {
  if (!hasAdminCredentials()) {
    return { imported: 0, error: "Admin credentials not configured" };
  }

  const admin = createAdminClient();
  const rows = contentQuestionsToEngine().map(questionToRow);

  const { error } = await admin.from("questions").upsert(rows, { onConflict: "id" });
  if (error) {
    return { imported: 0, error: error.message };
  }

  return { imported: rows.length };
}

/**
 * Upsert bundled seed questions when the bank is empty.
 * Ensures FK references in assessment_answers always resolve.
 */
export async function importSeedQuestionBank(): Promise<{
  imported: number;
  error?: string;
}> {
  if (!hasAdminCredentials()) {
    return { imported: 0, error: "Admin credentials not configured" };
  }

  const admin = createAdminClient();
  const rows = [...SEED_QUESTIONS, ...contentQuestionsToEngine()].map(questionToRow);

  const { error } = await admin.from("questions").upsert(rows, { onConflict: "id" });
  if (error) {
    return { imported: 0, error: error.message };
  }

  return { imported: rows.length };
}

/**
 * If the questions table is empty, import seed questions once.
 * Full bank (migration 005) still requires SQL migrations via db:setup.
 */
export async function ensureQuestionBankLoaded(): Promise<{
  wasEmpty: boolean;
  imported: number;
  totalAfter: number | null;
}> {
  if (importInFlight) {
    const result = await importInFlight;
    const total = await getTotalQuestionCount();
    return {
      wasEmpty: Boolean(result),
      imported: result?.imported ?? 0,
      totalAfter: total,
    };
  }

  const total = await getTotalQuestionCount();
  if (total === null) {
    return { wasEmpty: false, imported: 0, totalAfter: null };
  }

  if (total > 0) {
    await importContentQuestionBank();
    return { wasEmpty: false, imported: 0, totalAfter: total };
  }

  importInFlight = (async () => {
    console.warn(
      "WARNING: Questions table empty. Auto-importing bundled seed question bank."
    );
    const result = await importSeedQuestionBank();
    if (result.error) {
      console.error("Failed to auto-import seed questions:", result.error);
      return null;
    }
    console.warn(
      `Imported ${result.imported} seed questions. Run npm run db:setup (or migration 005) for the full bank.`
    );
    return result;
  })();

  const result = await importInFlight;
  importInFlight = null;
  const totalAfter = await getTotalQuestionCount();

  return {
    wasEmpty: true,
    imported: result?.imported ?? 0,
    totalAfter,
  };
}

export async function getPathQuestionCount(path: EnginePath): Promise<number | null> {
  if (!hasAdminCredentials()) return null;
  const admin = createAdminClient();
  const { count, error } = await admin
    .from("questions")
    .select("id", { count: "exact", head: true })
    .eq("path", path)
    .eq("is_active", true);
  if (error) return null;
  return count ?? 0;
}
