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
        message:
          "Supabase environment variables are missing on the server.",
      },
      { status: 503 }
    );
  }

  const projectRef = new URL(env.url).hostname.split(".")[0];
  const googleCallbackUrl = `${env.url}/auth/v1/callback`;

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
        const clientId = new URL(location).searchParams.get("client_id");
        googleClientConfigured = looksLikeGoogleClientId(clientId);
      }
    }

    const configured = googleEnabled && googleClientConfigured;

    return NextResponse.json({
      configured,
      googleEnabled,
      emailEnabled,
      googleClientConfigured,
      projectRef,
      googleCallbackUrl,
      message: configured
        ? "Google sign-in is configured."
        : !googleEnabled
          ? "Enable Google in Supabase → Authentication → Providers."
          : "Google is enabled in Supabase but the OAuth Client ID is missing or invalid. Add your Google Cloud OAuth credentials in Supabase.",
    });
  } catch (error) {
    return NextResponse.json(
      {
        configured: false,
        googleEnabled: false,
        emailEnabled: false,
        googleClientConfigured: false,
        projectRef,
        googleCallbackUrl,
        message:
          error instanceof Error
            ? error.message
            : "Could not verify Google auth settings.",
      },
      { status: 500 }
    );
  }
}
