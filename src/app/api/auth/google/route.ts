import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { getGoogleOAuthStatus } from "@/lib/admin/google-oauth";
import { getSiteUrl } from "@/lib/site";

function safeNextPath(next: string | null): string {
  if (!next || !next.startsWith("/") || next.startsWith("//")) {
    return "/disclaimer";
  }
  return next;
}

function getBaseUrl(request: NextRequest): string {
  if (process.env.NODE_ENV === "development") {
    return new URL(request.url).origin;
  }
  const forwardedHost = request.headers.get("x-forwarded-host");
  if (forwardedHost) {
    return `https://${forwardedHost.split(":")[0]}`;
  }
  return new URL(request.url).origin;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const next = safeNextPath(searchParams.get("next"));
  const baseUrl = getBaseUrl(request);

  const status = await getGoogleOAuthStatus();
  if (!status?.googleEnabled) {
    return NextResponse.redirect(
      `${baseUrl}/login?next=${encodeURIComponent(next)}&error=${encodeURIComponent("Google sign-in is not enabled in Supabase yet.")}`
    );
  }

  if (!status.googleClientConfigured) {
    return NextResponse.redirect(
      `${baseUrl}/login?next=${encodeURIComponent(next)}&error=${encodeURIComponent("Google OAuth is misconfigured. Use email sign-in below, or fix Google setup at /setup/google-oauth.")}`
    );
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    return NextResponse.redirect(
      `${baseUrl}/login?error=${encodeURIComponent("Server configuration error. Please contact support.")}`
    );
  }

  const redirectTo = `${getSiteUrl()}/auth/callback?next=${encodeURIComponent(next)}`;
  let response = NextResponse.redirect(`${baseUrl}/login`);

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo },
  });

  if (error || !data.url) {
    return NextResponse.redirect(
      `${baseUrl}/login?next=${encodeURIComponent(next)}&error=${encodeURIComponent(error?.message ?? "Google sign-in could not be started.")}`
    );
  }

  response = NextResponse.redirect(data.url);
  return response;
}
