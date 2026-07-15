import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import { rateLimit } from "@/lib/rate-limit";

function authErrorMessage(error: { message?: string }): string {
  const raw = error.message ?? "Authentication failed";
  try {
    const parsed = JSON.parse(raw) as { msg?: string; message?: string };
    return parsed.msg ?? parsed.message ?? raw;
  } catch {
    return raw;
  }
}

function missingConfigResponse() {
  return NextResponse.json(
    {
      error:
        "Server auth is not configured. Set NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, and SUPABASE_SERVICE_ROLE_KEY in your deployment settings.",
    },
    { status: 503 }
  );
}

export async function POST(request: Request) {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

    if (!url || !anonKey || !serviceKey) {
      return missingConfigResponse();
    }

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
    const email = `guest+${guestId}@guest.loveprofile.ai`;

    const { error: createError } = await admin.auth.admin.createUser({
      email,
      email_confirm: true,
      user_metadata: { guest: true },
    });

    if (createError) {
      console.error("Guest user create error:", createError);
      return NextResponse.json(
        { error: authErrorMessage(createError) },
        { status: 500 }
      );
    }

    const { data: linkData, error: linkError } =
      await admin.auth.admin.generateLink({
        type: "magiclink",
        email,
      });

    const tokenHash = linkData?.properties?.hashed_token;
    if (linkError || !tokenHash) {
      console.error("Guest link error:", linkError);
      return NextResponse.json(
        {
          error: linkError
            ? authErrorMessage(linkError)
            : "Could not create guest session",
        },
        { status: 500 }
      );
    }

    const cookieStore = await cookies();
    const supabase = createServerClient(url, anonKey, {
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
    });

    const { data: verified, error: verifyError } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: "email",
    });

    if (verifyError || !verified.session) {
      console.error("Guest verify error:", verifyError);
      return NextResponse.json(
        {
          error: verifyError
            ? authErrorMessage(verifyError)
            : "Could not create guest session",
        },
        { status: 500 }
      );
    }

    const session = verified.session;

    const { error: sessionError } = await supabase.auth.setSession({
      access_token: session.access_token,
      refresh_token: session.refresh_token,
    });

    if (sessionError) {
      return NextResponse.json({ error: sessionError.message }, { status: 500 });
    }

    const userId = session.user.id;
    await admin.from("profiles").upsert(
      {
        id: userId,
        email,
        is_guest: true,
        provider: "guest",
        approval_status: "pending",
      },
      { onConflict: "id" }
    );

    return NextResponse.json({
      ok: true,
      access_token: session.access_token,
      refresh_token: session.refresh_token,
    });
  } catch (error) {
    console.error("Guest auth error:", error);
    const message =
      error instanceof Error ? error.message : "Guest authentication failed";
    if (message.includes("admin credentials are not configured")) {
      return missingConfigResponse();
    }
    return NextResponse.json({ error: message }, { status: 503 });
  }
}
