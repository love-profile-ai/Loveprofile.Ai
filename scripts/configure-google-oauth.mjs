/**
 * Configure Google OAuth on Supabase via Management API.
 *
 * Required env vars:
 * - SUPABASE_ACCESS_TOKEN  (from https://supabase.com/dashboard/account/tokens)
 * - GOOGLE_CLIENT_ID
 * - GOOGLE_CLIENT_SECRET
 * - NEXT_PUBLIC_SUPABASE_URL (to derive project ref)
 *
 * Usage:
 *   node scripts/configure-google-oauth.mjs
 */

import { readFileSync } from "fs";

function loadEnvFile(path) {
  const env = {};
  try {
    for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const idx = trimmed.indexOf("=");
      if (idx === -1) continue;
      let value = trimmed.slice(idx + 1);
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      if (value) env[trimmed.slice(0, idx)] = value;
    }
  } catch {
    return {};
  }
  return env;
}

function pickEnv() {
  return {
    ...loadEnvFile(".env.local"),
    ...loadEnvFile(".env.vercel"),
    ...process.env,
  };
}

const env = pickEnv();
const accessToken = env.SUPABASE_ACCESS_TOKEN?.trim();
const clientId = env.GOOGLE_CLIENT_ID?.trim();
const clientSecret = env.GOOGLE_CLIENT_SECRET?.trim();
const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL?.trim();

if (!accessToken || !clientId || !clientSecret || !supabaseUrl) {
  console.error("Missing required environment variables:");
  if (!accessToken) console.error("- SUPABASE_ACCESS_TOKEN");
  if (!clientId) console.error("- GOOGLE_CLIENT_ID");
  if (!clientSecret) console.error("- GOOGLE_CLIENT_SECRET");
  if (!supabaseUrl) console.error("- NEXT_PUBLIC_SUPABASE_URL");
  process.exit(1);
}

const projectRef = new URL(supabaseUrl).hostname.split(".")[0];
const googleCallbackUrl = `${supabaseUrl}/auth/v1/callback`;

const res = await fetch(
  `https://api.supabase.com/v1/projects/${projectRef}/config/auth`,
  {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      external_google_enabled: true,
      external_google_client_id: clientId,
      external_google_secret: clientSecret,
    }),
  }
);

const body = await res.json().catch(() => ({}));

if (!res.ok) {
  console.error("Failed to configure Google OAuth:", body);
  process.exit(1);
}

console.log("Google OAuth configured for Supabase project:", projectRef);
console.log("Add this Authorized redirect URI in Google Cloud Console:");
console.log(googleCallbackUrl);
