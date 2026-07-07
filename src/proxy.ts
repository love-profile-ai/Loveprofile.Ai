import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

function securityHeaders(response: NextResponse) {
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=()"
  );
  return response;
}

export async function proxy(request: NextRequest) {
  try {
    const response = await updateSession(request);
    return securityHeaders(response);
  } catch (error) {
    console.error("Proxy error:", error);
    return securityHeaders(NextResponse.next({ request }));
  }
}

export const config = {
  matcher: [
    /*
     * Match every path EXCEPT:
     * - _next/static  — static files
     * - _next/image   — image optimisation
     * - favicon.ico, images
     * - auth/callback — PKCE exchange must run uninterrupted; middleware
     *                   calling getUser() here can corrupt the code-verifier
     *                   cookie before the Route Handler reads it, causing
     *                   "Unable to exchange external code" on Vercel.
     */
    "/((?!_next/static|_next/image|favicon.ico|auth/callback|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
