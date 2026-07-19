import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createAdminClient, hasAdminCredentials } from "@/lib/supabase/admin";
import { getSiteUrl } from "@/lib/site";

const bodySchema = z.object({
  email: z.string().email(),
  next: z.string().optional(),
});

function safeNextPath(next: string | undefined): string {
  if (!next || !next.startsWith("/") || next.startsWith("//")) {
    return "/disclaimer";
  }
  return next;
}

function isDevRequest(request: NextRequest): boolean {
  if (process.env.NODE_ENV === "development") return true;
  const host = request.headers.get("host") ?? "";
  return host.startsWith("localhost:") || host.startsWith("127.0.0.1:");
}

export async function POST(request: NextRequest) {
  if (!hasAdminCredentials()) {
    return NextResponse.json(
      { error: "Server auth configuration is missing." },
      { status: 503 }
    );
  }

  const json = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Please enter a valid email address." },
      { status: 400 }
    );
  }

  const email = parsed.data.email.trim().toLowerCase();
  const next = safeNextPath(parsed.data.next);
  const redirectTo = `${getSiteUrl()}/auth/callback?next=${encodeURIComponent(next)}`;

  const admin = createAdminClient();

  async function buildTokenCallbackRedirect() {
    const { data, error: linkError } = await admin.auth.admin.generateLink({
      type: "magiclink",
      email,
      options: { redirectTo },
    });

    const tokenHash = data?.properties?.hashed_token;
    const verificationType = data?.properties?.verification_type ?? "magiclink";

    if (linkError || !tokenHash) {
      return null;
    }

    return `${getSiteUrl()}/auth/callback?token_hash=${encodeURIComponent(tokenHash)}&type=${encodeURIComponent(verificationType)}&next=${encodeURIComponent(next)}`;
  }

  if (isDevRequest(request)) {
    const callbackUrl = await buildTokenCallbackRedirect();
    if (callbackUrl) {
      return NextResponse.json({
        ok: true,
        mode: "redirect",
        redirectUrl: callbackUrl,
        message: "Opening your sign-in link now.",
      });
    }
  }

  const { error: otpError } = await admin.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: redirectTo },
  });

  if (!otpError) {
    return NextResponse.json({
      ok: true,
      mode: "email",
      message: "Magic link sent. Check your inbox and click the link.",
    });
  }

  const otpMessage = otpError.message.toLowerCase();
  const rateLimited =
    otpMessage.includes("rate limit") ||
    otpMessage.includes("too many") ||
    otpMessage.includes("over_email_send_rate_limit");

  if (rateLimited) {
    const callbackUrl = await buildTokenCallbackRedirect();
    if (callbackUrl) {
      return NextResponse.json({
        ok: true,
        mode: "redirect",
        redirectUrl: callbackUrl,
        message: "Email rate limit hit — opening your sign-in link now.",
      });
    }

    return NextResponse.json(
      {
        error:
          "Too many magic-link emails were sent. Wait about 60 minutes, then try again — or fix Google sign-in at /setup/google-oauth.",
      },
      { status: 429 }
    );
  }

  return NextResponse.json({ error: otpError.message }, { status: 400 });
}
