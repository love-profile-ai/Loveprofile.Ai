import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

function getSupabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!url || !key) return null;
  if (!url.startsWith("http://") && !url.startsWith("https://")) return null;
  return { url, key };
}

export async function updateSession(request: NextRequest) {
  const env = getSupabaseEnv();
  if (!env) {
    return NextResponse.next({ request });
  }

  try {
    // Start with a response that forwards the original request.
    let supabaseResponse = NextResponse.next({ request });

    const supabase = createServerClient(env.url, env.key, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        // CRITICAL: cookies must be written to BOTH request.cookies and the
        // response so that subsequent handlers (Route Handlers, RSC) can read
        // any updated tokens. Creating a new NextResponse inside setAll without
        // first updating request.cookies breaks PKCE cookie forwarding on Vercel.
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    });

    // Refresh session without blocking on the result — errors are non-fatal
    // because the proxy must never crash an otherwise valid request.
    await supabase.auth.getUser();

    return supabaseResponse;
  } catch (error) {
    console.error("Session refresh failed:", error);
    return NextResponse.next({ request });
  }
}
