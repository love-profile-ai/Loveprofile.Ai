import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

function safeNextPath(next: string | null): string {
  if (!next || !next.startsWith("/") || next.startsWith("//")) {
    return "/disclaimer";
  }
  return next;
}

/**
 * On Vercel, request.url contains the internal origin, not the public domain.
 * x-forwarded-host is the real hostname the user hit.
 */
function getBaseUrl(request: NextRequest): string {
  // In development there is no load balancer.
  if (process.env.NODE_ENV === "development") {
    return new URL(request.url).origin;
  }
  const forwardedHost = request.headers.get("x-forwarded-host");
  if (forwardedHost) {
    // x-forwarded-host may include a port — strip it for HTTPS.
    const host = forwardedHost.split(":")[0];
    return `https://${host}`;
  }
  return new URL(request.url).origin;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const errorParam =
    searchParams.get("error_description") ?? searchParams.get("error");
  const next = safeNextPath(searchParams.get("next"));

  const baseUrl = getBaseUrl(request);

  if (errorParam) {
    return NextResponse.redirect(
      `${baseUrl}/login?next=${encodeURIComponent(next)}&error=${encodeURIComponent(errorParam)}`
    );
  }

  if (!code) {
    return NextResponse.redirect(
      `${baseUrl}/login?next=${encodeURIComponent(next)}&error=${encodeURIComponent("Missing sign-in code. Please try again.")}`
    );
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    console.error("Supabase env vars missing in auth callback");
    return NextResponse.redirect(
      `${baseUrl}/login?error=${encodeURIComponent("Server configuration error. Please contact support.")}`
    );
  }

  // Build the redirect response FIRST so we can write session cookies
  // directly onto it. Using cookies() from next/headers risks the cookies
  // ending up in the wrong response on some Vercel edge configurations.
  const successResponse = NextResponse.redirect(`${baseUrl}${next}`);
  const errorResponse = (msg: string) =>
    NextResponse.redirect(
      `${baseUrl}/login?next=${encodeURIComponent(next)}&error=${encodeURIComponent(msg)}`
    );

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        // Write every auth cookie (access_token, refresh_token, etc.)
        // directly onto the redirect response the browser will receive.
        cookiesToSet.forEach(({ name, value, options }) =>
          successResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error("Auth callback — exchangeCodeForSession failed:", error.message);
    return errorResponse("Sign-in link expired or is invalid. Please try again.");
  }

  return successResponse;
}
