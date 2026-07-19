import { getSiteUrl } from "@/lib/site";

function getSupabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!url || !anonKey) return null;
  return { url, anonKey };
}

function getProjectRef(supabaseUrl: string): string {
  return new URL(supabaseUrl).hostname.split(".")[0];
}

export function getAuthRedirectAllowList(): string {
  const siteUrl = getSiteUrl();
  const urls = new Set<string>([
    `${siteUrl}/auth/callback`,
    "http://localhost:3000/auth/callback",
    "https://loveprofile-ai-loveprofile-team.vercel.app/auth/callback",
  ]);

  return [...urls].join(",");
}

function looksLikeGoogleClientId(clientId: string | null): boolean {
  return Boolean(clientId && clientId.endsWith(".apps.googleusercontent.com"));
}

export interface GoogleOAuthStatus {
  googleEnabled: boolean;
  googleClientConfigured: boolean;
  googleClientId: string | null;
  googleCallbackUrl: string;
  projectRef: string;
  message: string;
}

export async function getGoogleOAuthStatus(): Promise<GoogleOAuthStatus | null> {
  const env = getSupabaseEnv();
  if (!env) return null;

  const projectRef = getProjectRef(env.url);
  const googleCallbackUrl = `${env.url}/auth/v1/callback`;

  const settingsRes = await fetch(`${env.url}/auth/v1/settings`, {
    headers: {
      apikey: env.anonKey,
      Authorization: `Bearer ${env.anonKey}`,
    },
    cache: "no-store",
  });

  const settings = (await settingsRes.json()) as {
    external?: { google?: boolean };
  };
  const googleEnabled = Boolean(settings.external?.google);

  let googleClientId: string | null = null;
  let googleClientConfigured = false;

  if (googleEnabled) {
    const authorizeRes = await fetch(
      `${env.url}/auth/v1/authorize?provider=google`,
      {
        headers: {
          apikey: env.anonKey,
          Authorization: `Bearer ${env.anonKey}`,
        },
        redirect: "manual",
        cache: "no-store",
      }
    );

    const location = authorizeRes.headers.get("location");
    if (location) {
      googleClientId = new URL(location).searchParams.get("client_id");
      googleClientConfigured = looksLikeGoogleClientId(googleClientId);
    }
  }

  let message = "Google sign-in is ready.";
  if (!googleEnabled) {
    message = "Enable Google in Supabase → Authentication → Providers.";
  } else if (!googleClientConfigured) {
    message =
      googleClientId && googleClientId.length > 0
        ? `Invalid Client ID "${googleClientId}". Use a Google Cloud OAuth Client ID ending in .apps.googleusercontent.com`
        : "Google is enabled but no Client ID is configured.";
  }

  return {
    googleEnabled,
    googleClientConfigured,
    googleClientId,
    googleCallbackUrl,
    projectRef,
    message,
  };
}

export async function configureGoogleOAuth({
  clientId,
  clientSecret,
  accessToken,
}: {
  clientId: string;
  clientSecret: string;
  accessToken: string;
}) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  if (!supabaseUrl) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL is missing.");
  }

  if (!looksLikeGoogleClientId(clientId)) {
    throw new Error(
      "Client ID must end with .apps.googleusercontent.com (from Google Cloud Console)."
    );
  }

  const projectRef = getProjectRef(supabaseUrl);
  const siteUrl = getSiteUrl();

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
        site_url: siteUrl,
        uri_allow_list: getAuthRedirectAllowList(),
      }),
    }
  );

  const body = (await res.json().catch(() => ({}))) as { message?: string };
  if (!res.ok) {
    throw new Error(body.message ?? "Failed to update Supabase Google OAuth settings.");
  }

  return {
    projectRef,
    googleCallbackUrl: `${supabaseUrl}/auth/v1/callback`,
  };
}
