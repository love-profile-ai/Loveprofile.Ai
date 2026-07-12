import { readFileSync } from "fs";
import { resolve } from "path";
import pg from "pg";
import { createAdminClient, hasAdminCredentials } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { EnginePath } from "@/types/adaptive-engine";
import {
  ensureQuestionBankLoaded,
  EXPECTED_MIN_QUESTIONS_PER_PATH,
  getTotalQuestionCount,
  getPathQuestionCount,
  importSeedQuestionBank,
} from "./ensure-question-bank";
import { rowToQuestion, validateQuestion } from "./question-utils";

const MIGRATION_FILES = [
  "001_initial_schema.sql",
  "002_admin_control_center.sql",
  "003_adaptive_question_engine.sql",
  "004_assessment_summary.sql",
  "005_expanded_adaptive_question_bank.sql",
  "006_repair_assessment_profiles.sql",
];

export interface HealthCheck {
  id: string;
  label: string;
  status: "ok" | "warn" | "error";
  detail: string;
}

export interface DatabaseHealthReport {
  generatedAt: string;
  checks: HealthCheck[];
  summary: {
    ok: number;
    warn: number;
    error: number;
  };
  questionStats: {
    total: number;
    byPath: Record<string, number>;
    dimensions: number;
    duplicateIds: string[];
    invalidQuestions: { id: string; issues: string[] }[];
  };
  repairs: string[];
  problems: string[];
}

async function probeColumn(table: string, column: string): Promise<boolean> {
  if (!hasAdminCredentials()) return false;
  const admin = createAdminClient();
  const { error } = await admin.from(table).select(column).limit(1);
  return !error;
}

async function checkRlsReadable(): Promise<HealthCheck> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("questions")
      .select("id")
      .eq("is_active", true)
      .limit(1);
    if (error) {
      return {
        id: "rls_questions_read",
        label: "RLS — authenticated read on questions",
        status: "error",
        detail: error.message,
      };
    }
    return {
      id: "rls_questions_read",
      label: "RLS — authenticated read on questions",
      status: "ok",
      detail: data?.length
        ? "Active questions readable via user client"
        : "Readable (table may be empty)",
    };
  } catch (err) {
    return {
      id: "rls_questions_read",
      label: "RLS — authenticated read on questions",
      status: "error",
      detail: err instanceof Error ? err.message : "Check failed",
    };
  }
}

export async function runDatabaseHealthAudit(): Promise<DatabaseHealthReport> {
  const checks: HealthCheck[] = [];
  const problems: string[] = [];
  const repairs: string[] = [];

  if (!hasAdminCredentials()) {
    return {
      generatedAt: new Date().toISOString(),
      checks: [
        {
          id: "admin_credentials",
          label: "Supabase admin credentials",
          status: "error",
          detail: "SUPABASE_SERVICE_ROLE_KEY not configured",
        },
      ],
      summary: { ok: 0, warn: 0, error: 1 },
      questionStats: {
        total: 0,
        byPath: {},
        dimensions: 0,
        duplicateIds: [],
        invalidQuestions: [],
      },
      repairs: [],
      problems: ["Admin credentials missing — cannot audit database"],
    };
  }

  const admin = createAdminClient();

  // Migration probes
  const migrationProbes: { file: string; label: string; probe: () => Promise<boolean> }[] = [
    {
      file: "001_initial_schema.sql",
      label: "Migration 001 — initial schema",
      probe: async () => {
        const { error } = await admin.from("reports").select("id").limit(1);
        return !error;
      },
    },
    {
      file: "002_admin_control_center.sql",
      label: "Migration 002 — admin / profiles",
      probe: async () => {
        const { error } = await admin.from("profiles").select("role").limit(1);
        return !error;
      },
    },
    {
      file: "003_adaptive_question_engine.sql",
      label: "Migration 003 — adaptive engine tables",
      probe: async () => {
        const { error } = await admin.from("questions").select("id").limit(1);
        return !error;
      },
    },
    {
      file: "004_assessment_summary.sql",
      label: "Migration 004 — assessment_summary column",
      probe: () => probeColumn("assessment_profiles", "assessment_summary"),
    },
    {
      file: "005_expanded_adaptive_question_bank.sql",
      label: "Migration 005 — expanded dimensions",
      probe: async () => {
        const friendship = await probeColumn("assessment_profiles", "friendship_score");
        const commitment = await probeColumn("assessment_profiles", "commitment_score");
        const reciprocity = await probeColumn("assessment_profiles", "reciprocity_score");
        return friendship && commitment && reciprocity;
      },
    },
    {
      file: "006_repair_assessment_profiles.sql",
      label: "Migration 006 — RLS & profile repair",
      probe: async () => {
        const friendship = await probeColumn("assessment_profiles", "friendship_score");
        const summary = await probeColumn("assessment_profiles", "assessment_summary");
        return friendship && summary;
      },
    },
  ];

  for (const m of migrationProbes) {
    const ok = await m.probe();
    checks.push({
      id: `migration_${m.file}`,
      label: m.label,
      status: ok ? "ok" : "error",
      detail: ok ? "Detected" : `Not detected — run ${m.file}`,
    });
    if (!ok) {
      problems.push(`${m.label} may not be applied`);
    }
  }

  // Sessions & answers tables
  for (const table of ["assessment_sessions", "assessment_answers", "assessment_profiles"] as const) {
    const { count, error } = await admin
      .from(table)
      .select("*", { count: "exact", head: true });
    checks.push({
      id: `table_${table}`,
      label: `${table} table`,
      status: error ? "error" : "ok",
      detail: error ? error.message : `${count ?? 0} row(s)`,
    });
    if (error) problems.push(`${table}: ${error.message}`);
  }

  checks.push(await checkRlsReadable());

  // Question bank analysis
  const { data: allQuestions, error: qError } = await admin
    .from("questions")
    .select("*");

  if (qError) {
    problems.push(`Cannot read questions: ${qError.message}`);
  }

  const parsed = (allQuestions ?? []).map((r) =>
    rowToQuestion(r as Record<string, unknown>)
  );

  const idCounts = new Map<string, number>();
  for (const q of parsed) {
    idCounts.set(q.id, (idCounts.get(q.id) ?? 0) + 1);
  }
  const duplicateIds = [...idCounts.entries()]
    .filter(([, c]) => c > 1)
    .map(([id]) => id);

  const invalidQuestions = parsed
    .map((q) => ({ id: q.id, issues: validateQuestion(q) }))
    .filter((x) => x.issues.length > 0);

  const byPath: Record<string, number> = {};
  const dimensions = new Set<string>();
  for (const q of parsed) {
    byPath[q.path] = (byPath[q.path] ?? 0) + 1;
    if (q.is_active !== false) dimensions.add(q.psychological_dimension);
  }

  const total = parsed.length;
  checks.push({
    id: "question_count",
    label: "Question bank count",
    status:
      total === 0 ? "error" : total < EXPECTED_MIN_QUESTIONS_PER_PATH * 2 ? "warn" : "ok",
    detail:
      total === 0
        ? "Empty — seed fallback active"
        : `${total} total (${byPath.do_i_love_someone ?? 0} self / ${byPath.does_someone_love_me ?? 0} other)`,
  });

  if (total === 0) problems.push("Questions table is empty");
  else if (total < EXPECTED_MIN_QUESTIONS_PER_PATH * 2) {
    problems.push(
      `Question bank smaller than expected (~${EXPECTED_MIN_QUESTIONS_PER_PATH * 2}+). Migration 005 may be missing.`
    );
  }

  if (duplicateIds.length) {
    checks.push({
      id: "duplicate_ids",
      label: "Duplicate question IDs",
      status: "error",
      detail: duplicateIds.join(", "),
    });
    problems.push(`Duplicate question IDs: ${duplicateIds.join(", ")}`);
  } else {
    checks.push({
      id: "duplicate_ids",
      label: "Duplicate question IDs",
      status: "ok",
      detail: "None",
    });
  }

  checks.push({
    id: "invalid_follow_up_rules",
    label: "Invalid follow_up_rules / question schema",
    status: invalidQuestions.length ? "warn" : "ok",
    detail: invalidQuestions.length
      ? `${invalidQuestions.length} question(s) with issues`
      : "All questions valid",
  });

  if (invalidQuestions.length) {
    problems.push(
      `${invalidQuestions.length} questions have validation issues (see diagnostics)`
    );
  }

  checks.push({
    id: "dimensions_count",
    label: "Active dimensions represented",
    status: dimensions.size >= 10 ? "ok" : "warn",
    detail: `${dimensions.size} dimension(s)`,
  });

  const summary = {
    ok: checks.filter((c) => c.status === "ok").length,
    warn: checks.filter((c) => c.status === "warn").length,
    error: checks.filter((c) => c.status === "error").length,
  };

  return {
    generatedAt: new Date().toISOString(),
    checks,
    summary,
    questionStats: {
      total,
      byPath,
      dimensions: dimensions.size,
      duplicateIds,
      invalidQuestions: invalidQuestions.slice(0, 20),
    },
    repairs,
    problems,
  };
}

export async function repairDatabaseHealth(): Promise<{
  report: DatabaseHealthReport;
  actions: string[];
}> {
  const actions: string[] = [];

  const ensure = await ensureQuestionBankLoaded();
  if (ensure.wasEmpty && ensure.imported > 0) {
    actions.push(`Auto-imported ${ensure.imported} seed questions`);
  }

  const total = await getTotalQuestionCount();
  if (total === 0) {
    const seed = await importSeedQuestionBank();
    if (seed.imported > 0) {
      actions.push(`Imported ${seed.imported} seed questions via repair`);
    } else if (seed.error) {
      actions.push(`Seed import failed: ${seed.error}`);
    }
  }

  // Attempt SQL migrations if DATABASE_URL or SUPABASE_DB_PASSWORD available
  const migrationResult = await tryRunMigrations();
  if (migrationResult.applied.length) {
    actions.push(`Applied migrations: ${migrationResult.applied.join(", ")}`);
  }
  if (migrationResult.error) {
    actions.push(`Migration runner: ${migrationResult.error}`);
  }

  const report = await runDatabaseHealthAudit();
  report.repairs = actions;
  return { report, actions };
}

async function tryRunMigrations(): Promise<{
  applied: string[];
  error?: string;
}> {
  const envPath = resolve(process.cwd(), ".env.local");
  let env: Record<string, string> = {};
  try {
    const raw = readFileSync(envPath, "utf8");
    for (const line of raw.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const idx = trimmed.indexOf("=");
      if (idx === -1) continue;
      env[trimmed.slice(0, idx)] = trimmed.slice(idx + 1);
    }
  } catch {
    return { applied: [], error: ".env.local not readable for migration runner" };
  }

  const databaseUrl = env.DATABASE_URL || env.SUPABASE_DB_URL;
  const projectRef = env.NEXT_PUBLIC_SUPABASE_URL
    ? new URL(env.NEXT_PUBLIC_SUPABASE_URL).hostname.split(".")[0]
    : null;
  const password = env.SUPABASE_DB_PASSWORD?.trim();

  const client = databaseUrl
    ? new pg.Client({ connectionString: databaseUrl, ssl: { rejectUnauthorized: false } })
    : password && projectRef
      ? new pg.Client({
          user: `postgres.${projectRef}`,
          password,
          host: env.SUPABASE_DB_HOST || "aws-1-ap-south-1.pooler.supabase.com",
          port: Number(env.SUPABASE_DB_PORT || 5432),
          database: "postgres",
          ssl: { rejectUnauthorized: false },
        })
      : null;

  if (!client) {
    return {
      applied: [],
      error: "No DATABASE_URL or SUPABASE_DB_PASSWORD — run npm run db:setup manually",
    };
  }

  const migrationsDir = resolve(process.cwd(), "supabase/migrations");
  const applied: string[] = [];

  try {
    await client.connect();
    for (const file of MIGRATION_FILES) {
      const fullPath = resolve(migrationsDir, file);
      try {
        const sql = readFileSync(fullPath, "utf8");
        await client.query(sql);
        applied.push(file);
      } catch (readErr) {
        if (file === "006_repair_assessment_profiles.sql") continue;
        throw readErr;
      }
    }
  } catch (err) {
    return {
      applied,
      error: err instanceof Error ? err.message : "Migration failed",
    };
  } finally {
    await client.end().catch(() => {});
  }

  return { applied };
}

export async function getLoaderStatusForPaths(): Promise<
  Record<EnginePath, { count: number | null; expected: number }>
> {
  const paths: EnginePath[] = ["do_i_love_someone", "does_someone_love_me"];
  const out = {} as Record<EnginePath, { count: number | null; expected: number }>;
  for (const path of paths) {
    out[path] = {
      count: await getPathQuestionCount(path),
      expected: EXPECTED_MIN_QUESTIONS_PER_PATH,
    };
  }
  return out;
}
