import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { resolve } from "path";

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
const url = env.NEXT_PUBLIC_SUPABASE_URL;
const key = env.SUPABASE_SERVICE_ROLE_KEY;
const targetEmail = process.argv[2]?.trim();

if (!url || !key) {
  console.error("Missing Supabase credentials in .env.local");
  process.exit(1);
}

const admin = createClient(url, key, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const { data: profiles, error: listError } = await admin
  .from("profiles")
  .select("id, email, role, approval_status, is_guest, provider")
  .order("created_at", { ascending: false });

if (listError) {
  console.error("Failed to list profiles:", listError.message);
  process.exit(1);
}

console.log(`Found ${profiles.length} profile(s):`);
for (const p of profiles) {
  console.log(
    `- ${p.email ?? "(no email)"} | role=${p.role} | status=${p.approval_status} | guest=${p.is_guest} | provider=${p.provider ?? "?"}`
  );
}

const candidate =
  (targetEmail
    ? profiles.find((p) => p.email?.toLowerCase() === targetEmail.toLowerCase())
    : null) ??
  profiles.find((p) => !p.is_guest && p.role !== "admin") ??
  profiles.find((p) => !p.is_guest);

if (!candidate) {
  console.error("No profile to promote. Pass an email: node scripts/promote-admin.mjs you@example.com");
  process.exit(1);
}

if (candidate.role === "admin" && candidate.approval_status === "approved") {
  console.log(`Already admin: ${candidate.email}`);
  process.exit(0);
}

const { data: updated, error: updateError } = await admin
  .from("profiles")
  .update({
    role: "admin",
    approval_status: "approved",
    approved_at: new Date().toISOString(),
  })
  .eq("id", candidate.id)
  .select("id, email, role, approval_status")
  .single();

if (updateError) {
  console.error("Update failed:", updateError.message);
  process.exit(1);
}

console.log("Promoted to admin:");
console.log(`- email: ${updated.email}`);
console.log(`- role: ${updated.role}`);
console.log(`- status: ${updated.approval_status}`);
console.log("Refresh http://localhost:3000/admin");
