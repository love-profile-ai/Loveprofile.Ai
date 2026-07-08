import { NextResponse } from "next/server";
import { requireAdmin, writeAuditLog } from "@/lib/admin/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  const { response } = await requireAdmin();
  if (response) return response;

  const { userId } = await params;
  const admin = createAdminClient();
  const [{ data: profile }, { data: reports }, { data: sessions }, { data: audit }] =
    await Promise.all([
      admin.from("profiles").select("*").eq("id", userId).single(),
      admin
        .from("reports")
        .select("id,title,path,created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(20),
      admin
        .from("analysis_sessions")
        .select("id,path,status,created_at,updated_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(20),
      admin
        .from("admin_audit_logs")
        .select("*")
        .eq("target_user_id", userId)
        .order("created_at", { ascending: false })
        .limit(20),
    ]);

  return NextResponse.json({ profile, reports, sessions, audit });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  const { admin: currentAdmin, response } = await requireAdmin();
  if (response) return response;

  const { userId } = await params;
  if (userId === currentAdmin!.id) {
    return NextResponse.json(
      { error: "Admins cannot delete their own account." },
      { status: 400 }
    );
  }

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.deleteUser(userId);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await writeAuditLog({
    actorId: currentAdmin!.id,
    targetUserId: userId,
    action: "delete_user",
    entityType: "user",
    entityId: userId,
    request,
  });

  return NextResponse.json({ ok: true });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  const { admin: currentAdmin, response } = await requireAdmin();
  if (response) return response;

  const { userId } = await params;
  const body = (await request.json()) as { action?: string };
  const admin = createAdminClient();

  if (body.action === "reset_data") {
    await Promise.all([
      admin.from("chat_messages").delete().eq("user_id", userId),
      admin.from("reports").delete().eq("user_id", userId),
      admin.from("analysis_sessions").delete().eq("user_id", userId),
    ]);
    await writeAuditLog({
      actorId: currentAdmin!.id,
      targetUserId: userId,
      action: "reset_user_data",
      entityType: "user",
      entityId: userId,
      request,
    });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
