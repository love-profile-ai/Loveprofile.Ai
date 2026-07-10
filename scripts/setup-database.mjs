import { createClient } from "@supabase/supabase-js";
import pg from "pg";
import { readFileSync, readdirSync } from "fs";
import { resolve } from "path";

const { Client } = pg;

function loadEnv() {
  const envPath = resolve(process.cwd(), ".env.local");
  const raw = readFileSync(envPath, "utf8");
  const env = {};
  for (const line of raw.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx === -1) continue;
    env[trimmed.slice(0, idx)] = trimmed.slice(idx + 1);
  }
  return env;
}

const env = loadEnv();
const projectRef = new URL(env.NEXT_PUBLIC_SUPABASE_URL).hostname.split(".")[0];
const password = env.SUPABASE_DB_PASSWORD?.trim();

const databaseUrl =
  env.DATABASE_URL ||
  env.SUPABASE_DB_URL ||
  null;

const client = databaseUrl
  ? new Client({ connectionString: databaseUrl, ssl: { rejectUnauthorized: false } })
  : password
    ? new Client({
        user: `postgres.${projectRef}`,
        password,
        host: env.SUPABASE_DB_HOST || "aws-1-ap-south-1.pooler.supabase.com",
        port: Number(env.SUPABASE_DB_PORT || 5432),
        database: "postgres",
        ssl: { rejectUnauthorized: false },
      })
    : null;

if (!client) {
  console.error(
    "Missing DATABASE_URL or SUPABASE_DB_PASSWORD in .env.local.\n" +
      "Add your Supabase database password from Dashboard → Project Settings → Database → Connection string (URI)."
  );
  process.exit(1);
}

const migrationsDir = resolve(process.cwd(), "supabase/migrations");
const files = readdirSync(migrationsDir)
  .filter((f) => f.endsWith(".sql"))
  .sort();

try {
  await client.connect();
  console.log(`Applying ${files.length} migration file(s)...`);

  for (const file of files) {
    const sql = readFileSync(resolve(migrationsDir, file), "utf8");
    console.log(`→ ${file}`);
    await client.query(sql);
  }

  console.log("Migrations applied.");

  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const key = env.SUPABASE_SERVICE_ROLE_KEY;
  if (url && key) {
    const admin = createClient(url, key, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: profiles } = await admin
      .from("profiles")
      .select("id, email, role, approval_status, is_guest")
      .order("created_at", { ascending: false });

    const { data: authUsers } = await admin.auth.admin.listUsers({ page: 1, perPage: 50 });

    if (!profiles?.length && authUsers?.users?.length) {
      console.log("Backfilling profiles for existing auth users...");
      for (const user of authUsers.users) {
        const isGuest = Boolean(user.user_metadata?.guest);
        await admin.from("profiles").upsert({
          id: user.id,
          email: user.email,
          full_name: user.user_metadata?.full_name ?? user.user_metadata?.name ?? null,
          display_name: user.user_metadata?.full_name ?? user.user_metadata?.name ?? null,
          avatar_url: user.user_metadata?.avatar_url ?? null,
          provider: user.app_metadata?.provider ?? "email",
          is_guest: isGuest,
          approval_status: isGuest ? "approved" : "pending",
          role: "user",
        });
      }
    }

    const { data: allProfiles } = await admin
      .from("profiles")
      .select("id, email, role, approval_status, is_guest")
      .order("created_at", { ascending: false });

    const target =
      allProfiles?.find((p) => !p.is_guest && p.role !== "admin") ??
      allProfiles?.find((p) => !p.is_guest);

    if (target && (target.role !== "admin" || target.approval_status !== "approved")) {
      const { data: updated } = await admin
        .from("profiles")
        .update({
          role: "admin",
          approval_status: "approved",
          approved_at: new Date().toISOString(),
        })
        .eq("id", target.id)
        .select("email, role, approval_status")
        .single();

      console.log("Promoted admin:", updated);
    } else if (target) {
      console.log("Admin already set:", target.email);
    } else {
      console.log("No non-guest profile yet — sign up at /login, then re-run this script.");
    }
  }

  console.log("Done. Refresh http://localhost:3000/admin");
} catch (err) {
  console.error("Failed:", err.message);
  process.exit(1);
} finally {
  await client.end();
}
