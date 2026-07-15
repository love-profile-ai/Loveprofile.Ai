import { createClient } from "@supabase/supabase-js";
import { readFileSync, readdirSync } from "fs";
import { resolve } from "path";
import { connectPg, loadEnvFile } from "./pg-connection.mjs";

const envPath = resolve(process.cwd(), ".env.local");
const env = loadEnvFile(envPath);

if (!env) {
  console.error(".env.local not found.");
  process.exit(1);
}

const { client, error: connectError } = await connectPg(env);

if (!client) {
  console.error(
    "Could not connect to Supabase Postgres.\n" +
      (connectError ?? "Missing DATABASE_URL or SUPABASE_DB_PASSWORD") +
      "\n\nAdd your database password from Supabase Dashboard → Project Settings → Database."
  );
  process.exit(1);
}

const migrationsDir = resolve(process.cwd(), "supabase/migrations");
const files = readdirSync(migrationsDir)
  .filter((f) => f.endsWith(".sql"))
  .sort();

try {
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
          approval_status: "pending",
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
