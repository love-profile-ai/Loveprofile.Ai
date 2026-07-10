import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { writeAuditLog } from "@/lib/admin/auth";

export async function GET() {
  const admin = createAdminClient();
  const { count, error } = await admin
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .eq("role", "admin")
    .eq("approval_status", "approved");

  if (error) {
    return NextResponse.json({ canBootstrap: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ canBootstrap: (count ?? 0) === 0 });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  const admin = createAdminClient();

  const { count, error: countError } = await admin
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .eq("role", "admin")
    .eq("approval_status", "approved");

  if (countError) {
    return NextResponse.json({ error: countError.message }, { status: 500 });
  }

  if ((count ?? 0) > 0) {
    return NextResponse.json(
      { error: "An admin already exists. Ask them to approve your account in Users." },
      { status: 403 }
    );
  }

  const isGuest = Boolean(user.user_metadata?.guest);
  const { data: existing } = await admin
    .from("profiles")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();

  if (!existing) {
    const { error: insertError } = await admin.from("profiles").insert({
      id: user.id,
      email: user.email,
      full_name: user.user_metadata?.full_name ?? user.user_metadata?.name ?? null,
      display_name: user.user_metadata?.full_name ?? user.user_metadata?.name ?? null,
      avatar_url: user.user_metadata?.avatar_url ?? null,
      provider: user.app_metadata?.provider ?? "email",
      is_guest: isGuest,
      approval_status: "approved",
      role: "admin",
      approved_at: new Date().toISOString(),
    });

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }
  } else {
    const { error: updateError } = await admin
      .from("profiles")
      .update({
        role: "admin",
        approval_status: "approved",
        approved_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }
  }

  await writeAuditLog({
    actorId: user.id,
    action: "bootstrap_first_admin",
    entityType: "user",
    entityId: user.id,
    metadata: { email: user.email, is_guest: isGuest },
    request,
  });

  return NextResponse.json({ ok: true, email: user.email });
}
