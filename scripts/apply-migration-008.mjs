import fs from "fs";
import { connectPg, loadEnvFile } from "./pg-connection.mjs";

const env = loadEnvFile(".env.local");
const { client, error } = await connectPg(env);

if (!client) {
  console.error("Connect failed:", error);
  process.exit(1);
}

try {
  const sql = fs.readFileSync("supabase/migrations/008_foundation_answers_fk.sql", "utf8");
  await client.query(sql);
  const check = await client.query(
    "select conname from pg_constraint where conname = 'assessment_answers_question_id_fkey'"
  );
  console.log("FK remaining:", check.rows.length);
  console.log("Migration 008 applied OK");
} finally {
  await client.end().catch(() => {});
}
