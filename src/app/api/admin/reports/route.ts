import { NextResponse } from "next/server";
import { requireAdmin, writeAuditLog } from "@/lib/admin/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  const { response } = await requireAdmin();
  if (response) return response;

  const { searchParams } = new URL(request.url);
  const page = Math.max(parseInt(searchParams.get("page") ?? "1", 10), 1);
  const pageSize = Math.min(
    Math.max(parseInt(searchParams.get("pageSize") ?? "25", 10), 1),
    100
  );
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const admin = createAdminClient();

  const [reportsRes, sessionsRes] = await Promise.all([
    admin
      .from("reports")
      .select("id, user_id, title, path, analysis, assessment_session_id, created_at", {
        count: "exact",
      })
      .order("created_at", { ascending: false })
      .range(from, to),
    admin
      .from("assessment_sessions")
      .select("id, user_id, path, status, question_count, created_at", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(from, to),
  ]);

  if (reportsRes.error) {
    return NextResponse.json({ error: reportsRes.error.message }, { status: 500 });
  }
  if (sessionsRes.error) {
    return NextResponse.json({ error: sessionsRes.error.message }, { status: 500 });
  }

  const userIds = [
    ...new Set([
      ...(reportsRes.data ?? []).map((r) => r.user_id),
      ...(sessionsRes.data ?? []).map((s) => s.user_id),
    ]),
  ];

  const { data: profileRows } = userIds.length
    ? await admin.from("profiles").select("id, email, full_name").in("id", userIds)
    : { data: [] as { id: string; email: string | null; full_name: string | null }[] };

  const profileMap = new Map((profileRows ?? []).map((p) => [p.id, p]));

  const reports = (reportsRes.data ?? []).map((row) => {
    const analysis = row.analysis as { confidence?: string } | null;
    const profile = profileMap.get(row.user_id);
    return {
      id: row.id,
      user_id: row.user_id,
      user_email: profile?.email ?? null,
      user_name: profile?.full_name ?? null,
      title: row.title,
      path: row.path,
      confidence: analysis?.confidence ?? "Medium",
      assessment_session_id: row.assessment_session_id,
      created_at: row.created_at,
    };
  });

  const sessions = (sessionsRes.data ?? []).map((row) => {
    const profile = profileMap.get(row.user_id);
    return {
      id: row.id,
      user_id: row.user_id,
      user_email: profile?.email ?? null,
      path: row.path,
      status: row.status,
      question_count: row.question_count,
      created_at: row.created_at,
    };
  });

  return NextResponse.json({
    reports,
    sessions,
    reportsTotal: reportsRes.count ?? 0,
    sessionsTotal: sessionsRes.count ?? 0,
    page,
    pageSize,
  });
}

export async function DELETE(request: Request) {
  const { admin: currentAdmin, response } = await requireAdmin();
  if (response) return response;

  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type");
  const id = searchParams.get("id");

  if (!type || !id) {
    return NextResponse.json({ error: "Missing type or id" }, { status: 400 });
  }

  const admin = createAdminClient();

  if (type === "report") {
    const { error } = await admin.from("reports").delete().eq("id", id);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    await writeAuditLog({
      actorId: currentAdmin!.id,
      action: "delete_report",
      entityType: "report",
      entityId: id,
      request,
    });
    return NextResponse.json({ ok: true });
  }

  if (type === "session") {
    const { error } = await admin.from("assessment_sessions").delete().eq("id", id);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    await writeAuditLog({
      actorId: currentAdmin!.id,
      action: "delete_assessment_session",
      entityType: "assessment_session",
      entityId: id,
      request,
    });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Invalid type" }, { status: 400 });
}
