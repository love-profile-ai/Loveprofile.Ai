import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(request: Request) {
  try {
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      request.headers.get("x-real-ip") ??
      "unknown";

    const limit = rateLimit(`guest:${ip}`, 15, 60 * 60 * 1000);
    if (!limit.success) {
      return NextResponse.json(
        { error: "Too many sign-in attempts. Try again later." },
        { status: 429 }
      );
    }

    const admin = createAdminClient();
    const guestId = crypto.randomUUID();
    const email = `guest+${guestId}@guest.signal.app`;
    const password = `${crypto.randomUUID()}${crypto.randomUUID()}`;

    const { error: createError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { guest: true },
    });

    if (createError) {
      console.error("Guest user create error:", createError);
      return NextResponse.json({ error: createError.message }, { status: 500 });
    }

    const { data: signIn, error: signInError } =
      await admin.auth.signInWithPassword({
        email,
        password,
      });

    if (signInError || !signIn.session) {
      console.error("Guest sign-in error:", signInError);
      return NextResponse.json(
        { error: signInError?.message ?? "Could not create guest session" },
        { status: 500 }
      );
    }

    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          },
        },
      }
    );

    const { error: sessionError } = await supabase.auth.setSession({
      access_token: signIn.session.access_token,
      refresh_token: signIn.session.refresh_token,
    });

    if (sessionError) {
      return NextResponse.json({ error: sessionError.message }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      access_token: signIn.session.access_token,
      refresh_token: signIn.session.refresh_token,
    });
  } catch (error) {
    console.error("Guest auth error:", error);
    const message =
      error instanceof Error ? error.message : "Guest authentication failed";
    return NextResponse.json({ error: message }, { status: 503 });
  }
}
