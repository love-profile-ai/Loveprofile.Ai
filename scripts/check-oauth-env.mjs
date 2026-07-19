import { readFileSync, existsSync } from "fs";

function loadEnv(path) {
  const env = {};
  if (!existsSync(path)) return env;
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
  return env;
}

const env = { ...loadEnv(".env.local"), ...loadEnv(".env.vercel"), ...process.env };

for (const key of [
  "GOOGLE_CLIENT_ID",
  "GOOGLE_CLIENT_SECRET",
  "SUPABASE_ACCESS_TOKEN",
]) {
  const value = env[key]?.trim();
  if (!value) {
    console.log(`${key}: missing`);
    continue;
  }
  const valid =
    key === "GOOGLE_CLIENT_ID"
      ? value.endsWith(".apps.googleusercontent.com")
      : value.length > 0;
  console.log(`${key}: set (${value.length} chars, valid=${valid})`);
}
