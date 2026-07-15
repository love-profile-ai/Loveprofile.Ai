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
  console.log("oauth_client_id_present:", clientId.length > 0);
  console.log("oauth_client_id_suffix:", clientId.slice(-20));
  console.log(
    "google_redirect_uri:",
    authUrl.searchParams.get("redirect_uri") ?? "(missing)"
  );
} else {
  console.log("oauth_authorize_status:", oauth.status);
}
