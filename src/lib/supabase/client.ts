import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    console.error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY"
    );
  }

  return createBrowserClient(url ?? "", key ?? "", {
    auth: {
      // PKCE is required for OAuth with @supabase/ssr — the code verifier is
      // stored in a cookie and read back in the /auth/callback route handler.
      flowType: "pkce",
    },
  });
}
