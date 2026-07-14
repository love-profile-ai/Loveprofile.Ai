import { readFileSync, writeFileSync } from "fs";
import { resolve } from "path";

const migrationsDir = resolve("supabase/migrations");
const missing = [
  "003_adaptive_question_engine.sql",
  "004_assessment_summary.sql",
  "005_expanded_adaptive_question_bank.sql",
  "006_repair_assessment_profiles.sql",
  "007_ensure_questions_table.sql",
];

let sql = `-- Loveprofile.Ai — missing migrations (003–007)
-- Paste into Supabase → SQL Editor → New query → Run
-- Then return here and click "Run repair" to import questions.

`;

for (const file of missing) {
  sql += `-- ===== ${file} =====\n`;
  sql += readFileSync(resolve(migrationsDir, file), "utf8");
  sql += "\n\n";
}

const outPath = resolve("supabase/APPLY_MISSING.sql");
writeFileSync(outPath, sql);
console.log(`Wrote ${outPath} (${sql.length} chars)`);
