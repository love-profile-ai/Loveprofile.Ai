import { NextResponse } from "next/server";
import { z } from "zod";
import {
  configureGoogleOAuth,
  getGoogleOAuthStatus,
} from "@/lib/admin/google-oauth";
import { requireAdmin, writeAuditLog } from "@/lib/admin/auth";

export async function GET() {
  const { admin, response } = await requireAdmin();
  if (response) return response;

  const status = await getGoogleOAuthStatus();
  if (!status) {
    return NextResponse.json(
      { error: "Supabase environment variables are missing." },
      { status: 503 }
    );
  }

  return NextResponse.json({
    ...status,
    hasAccessToken: Boolean(process.env.SUPABASE_ACCESS_TOKEN?.trim()),
    supabaseProvidersUrl: `https://supabase.com/dashboard/project/${status.projectRef}/auth/providers`,
    googleCloudCredentialsUrl:
      "https://console.cloud.google.com/apis/credentials",
  });
}

const configureSchema = z.object({
  clientId: z.string().min(1),
  clientSecret: z.string().min(1),
  accessToken: z.string().optional(),
});

export async function POST(request: Request) {
  const { admin, response } = await requireAdmin();
  if (response) return response;

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
          "Supabase access token required. Add SUPABASE_ACCESS_TOKEN to .env.local or paste it in the admin form.",
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

    await writeAuditLog({
      actorId: admin!.id,
      action: "configure_google_oauth",
      entityType: "auth",
      metadata: { projectRef: result.projectRef },
      request,
    });

    const status = await getGoogleOAuthStatus();

    return NextResponse.json({
      ok: true,
      ...result,
      status,
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
