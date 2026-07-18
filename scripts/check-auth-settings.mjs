import { readFileSync } from "fs";

function loadEnv(path) {
  const env = {};
  try {
    for (const line of readFileSync(path, "utf8").split("\n")) {
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
      env[trimmed.slice(0, idx)] = value;
    }
  } catch {
    return null;
  }
  return env;
}

const env =
  loadEnv(".env.local") ??
  loadEnv(".env.vercel") ??
  {};

if (!env?.NEXT_PUBLIC_SUPABASE_URL || !env?.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  console.error("Missing Supabase env vars");
  process.exit(1);
}

const url = env.NEXT_PUBLIC_SUPABASE_URL;
const key = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const googleCallbackUrl = `${url}/auth/v1/callback`;

const res = await fetch(`${url}/auth/v1/settings`, {
  headers: {
    apikey: key,
    Authorization: `Bearer ${key}`,
  },
});

const data = await res.json();
console.log("supabase_host:", new URL(url).hostname);
console.log("google_enabled:", data.external?.google ?? false);
console.log("email_enabled:", data.external?.email ?? false);

const oauth = await fetch(`${url}/auth/v1/authorize?provider=google`, {
  headers: {
    apikey: key,
    Authorization: `Bearer ${key}`,
  },
  redirect: "manual",
});

const location = oauth.headers.get("location");
if (location) {
  const authUrl = new URL(location);
  const clientId = authUrl.searchParams.get("client_id") ?? "";
  const valid = clientId.endsWith(".apps.googleusercontent.com");
  console.log("google_client_id:", clientId || "(missing)");
  console.log("google_client_id_valid:", valid);
  console.log("google_redirect_uri:", googleCallbackUrl);
  if (!valid && clientId) {
    console.log("");
    console.log("FIX: Supabase has an invalid Google Client ID.");
    console.log("1. Google Cloud Console → APIs & Services → Credentials");
    console.log("2. Create OAuth Client ID (Web application)");
    console.log("3. Authorized redirect URI:", googleCallbackUrl);
    console.log("4. Supabase Dashboard → Authentication → Providers → Google");
    console.log("   Paste Client ID + Secret (must end with .apps.googleusercontent.com)");
    console.log("");
    console.log("Or add to .env.local and run: npm run auth:configure-google");
    console.log("- SUPABASE_ACCESS_TOKEN");
    console.log("- GOOGLE_CLIENT_ID");
    console.log("- GOOGLE_CLIENT_SECRET");
  }
} else {
  console.log("oauth_authorize_status:", oauth.status);
}
