import { NextResponse } from "next/server";
import { z } from "zod";
import {
  configureGoogleOAuth,
  getGoogleOAuthStatus,
} from "@/lib/admin/google-oauth";

export async function GET() {
  const status = await getGoogleOAuthStatus();
  if (!status) {
    return NextResponse.json(
      { error: "Supabase environment variables are missing." },
      { status: 503 }
    );
  }

  return NextResponse.json({
    ...status,
    canConfigure: !status.googleClientConfigured,
    suggestedClientId: process.env.GOOGLE_CLIENT_ID?.trim() || null,
    hasAccessToken: Boolean(process.env.SUPABASE_ACCESS_TOKEN?.trim()),
    supabaseProvidersUrl: `https://supabase.com/dashboard/project/${status.projectRef}/auth/providers?provider=Google`,
    googleCloudCredentialsUrl:
      "https://console.cloud.google.com/apis/credentials",
    supabaseTokensUrl: "https://supabase.com/dashboard/account/tokens",
  });
}

const configureSchema = z.object({
  clientId: z.string().min(1),
  clientSecret: z.string().min(1),
  accessToken: z.string().optional(),
});

export async function POST(request: Request) {
  const status = await getGoogleOAuthStatus();
  if (!status) {
    return NextResponse.json(
      { error: "Supabase environment variables are missing." },
      { status: 503 }
    );
  }

  if (status.googleClientConfigured) {
    return NextResponse.json(
      { error: "Google OAuth is already configured. Use /admin to update it." },
      { status: 403 }
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = configureSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const accessToken =
    parsed.data.accessToken?.trim() ||
    process.env.SUPABASE_ACCESS_TOKEN?.trim();

  if (!accessToken) {
    return NextResponse.json(
      {
        error:
          "Supabase access token required. Create one at supabase.com/dashboard/account/tokens.",
      },
      { status: 400 }
    );
  }

  try {
    const result = await configureGoogleOAuth({
      clientId: parsed.data.clientId.trim(),
      clientSecret: parsed.data.clientSecret.trim(),
      accessToken,
    });

    const updated = await getGoogleOAuthStatus();

    return NextResponse.json({
      ok: true,
      ...result,
      status: updated,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Could not configure Google OAuth.",
      },
      { status: 500 }
    );
  }
}
