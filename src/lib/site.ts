export const SITE_NAME = "Nila";
export const SITE_TAGLINE = "AI relationship reflection";
export const SITE_DOMAIN = "loveprofile.ai";
export const SUPPORT_EMAIL = "support@loveprofile.ai";

/** Server-side site URL for sitemaps, callbacks, and OpenRouter referer fallback. */
export function getSiteUrl(): string {
  const fromEnv = process.env.OPENROUTER_SITE_URL?.trim();
  if (fromEnv && !fromEnv.includes("openrouter.ai")) {
    return fromEnv.replace(/\/$/, "");
  }
  return `https://${SITE_DOMAIN}`;
}
