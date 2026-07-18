import { NextResponse } from "next/server";

interface AuthSettings {
  external?: {
    google?: boolean;
    email?: boolean;
  };
}

function getSupabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!url || !anonKey) return null;
  return { url, anonKey };
}

function looksLikeGoogleClientId(clientId: string | null): boolean {
  return Boolean(clientId && clientId.endsWith(".apps.googleusercontent.com"));
}

export async function GET() {
  const env = getSupabaseEnv();
  if (!env) {
    return NextResponse.json(
      {
        configured: false,
        googleEnabled: false,
        emailEnabled: false,
        googleClientConfigured: false,
        googleConfigured: false,
        message:
          "Supabase environment variables are missing on the server.",
      },
      { status: 503 }
    );
  }

  const projectRef = new URL(env.url).hostname.split(".")[0];
  const googleCallbackUrl = `${env.url}/auth/v1/callback`;
  const siteUrl =
    process.env.OPENROUTER_SITE_URL?.trim() || "http://localhost:3000";

  try {
    const settingsRes = await fetch(`${env.url}/auth/v1/settings`, {
      headers: {
        apikey: env.anonKey,
        Authorization: `Bearer ${env.anonKey}`,
      },
      cache: "no-store",
    });

    const settings = (await settingsRes.json()) as AuthSettings;
    const googleEnabled = Boolean(settings.external?.google);
    const emailEnabled = Boolean(settings.external?.email);

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

    const googleConfigured = googleEnabled && googleClientConfigured;
    const configured = googleConfigured || emailEnabled;

    let message = "Sign-in is ready.";
    if (!configured) {
      message =
        "Enable Google or Email sign-in in Supabase → Authentication → Providers.";
    } else if (googleEnabled && !googleClientConfigured) {
      message =
        "Google is enabled in Supabase but the Client ID is invalid. Replace it with a Google Cloud OAuth Client ID ending in .apps.googleusercontent.com";
    } else if (!googleConfigured && emailEnabled) {
      message = "Email magic links are ready.";
    } else if (googleConfigured && !emailEnabled) {
      message = "Google sign-in is ready.";
    } else {
      message = "Google and email sign-in are ready.";
    }

    return NextResponse.json({
      configured,
      googleEnabled,
      emailEnabled,
      googleClientConfigured,
      googleConfigured,
      googleClientIdPreview: googleClientId
        ? googleClientId.length > 24
          ? `${googleClientId.slice(0, 12)}…${googleClientId.slice(-12)}`
          : googleClientId
        : null,
      projectRef,
      googleCallbackUrl,
      siteUrl,
      message,
    });
  } catch (error) {
    return NextResponse.json(
      {
        configured: false,
        googleEnabled: false,
        emailEnabled: false,
        googleClientConfigured: false,
        googleConfigured: false,
        projectRef,
        googleCallbackUrl,
        siteUrl,
        message:
          error instanceof Error
            ? error.message
            : "Could not verify auth settings.",
      },
      { status: 500 }
    );
  }
}
