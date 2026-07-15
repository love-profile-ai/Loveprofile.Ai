import { NextResponse } from "next/server";
import { requireAdmin, writeAuditLog } from "@/lib/admin/auth";
import { createAdminClient } from "@/lib/supabase/admin";

const VALID_STATUSES = [
  "approved",
  "pending",
  "rejected",
  "blocked",
  "suspended",
  "inactive",
];

export async function GET(request: Request) {
  const { response } = await requireAdmin();
  if (response) return response;

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim();
  const status = searchParams.get("status");
  const role = searchParams.get("role");
  const provider = searchParams.get("provider");
  const page = Math.max(parseInt(searchParams.get("page") ?? "1", 10), 1);
  const pageSize = Math.min(
    Math.max(parseInt(searchParams.get("pageSize") ?? "25", 10), 1),
    100
  );
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const admin = createAdminClient();
  let query = admin
    .from("profiles")
    .select(
      "id,email,full_name,display_name,avatar_url,provider,role,approval_status,created_at,last_login_at,last_ip,country,browser,device,is_guest,admin_notes",
      { count: "exact" }
    )
    .order("created_at", { ascending: false })
    .range(from, to);

  if (q) {
    query = query.or(
      `email.ilike.%${q}%,full_name.ilike.%${q}%,display_name.ilike.%${q}%`
    );
  }
  if (status && VALID_STATUSES.includes(status)) {
    query = query.eq("approval_status", status);
  }
  if (role && ["user", "admin", "moderator"].includes(role)) {
    query = query.eq("role", role);
  }
  if (provider) {
    query = query.eq("provider", provider);
  }
  if (searchParams.get("guest") === "true") {
    query = query.eq("is_guest", true);
  }

  const { data: profiles, error, count } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const ids = (profiles ?? []).map((profile) => profile.id);
  const { data: reportRows } = ids.length
    ? await admin.from("reports").select("user_id").in("user_id", ids)
    : { data: [] as { user_id: string }[] };

  const reportCounts = new Map<string, number>();
  for (const row of reportRows ?? []) {
    reportCounts.set(row.user_id, (reportCounts.get(row.user_id) ?? 0) + 1);
  }

  return NextResponse.json({
    users: (profiles ?? []).map((profile) => ({
      ...profile,
      reports_generated: reportCounts.get(profile.id) ?? 0,
    })),
    total: count ?? 0,
    page,
    pageSize,
  });
}

export async function PATCH(request: Request) {
  const { admin: currentAdmin, response } = await requireAdmin();
  if (response) return response;

  const body = (await request.json()) as {
    userIds?: string[];
    action?: string;
    admin_notes?: string;
  };

  const userIds = body.userIds?.filter(Boolean) ?? [];
  if (!userIds.length || !body.action) {
    return NextResponse.json({ error: "Missing userIds or action" }, { status: 400 });
  }

  const admin = createAdminClient();
  const update: Record<string, unknown> = {};

  switch (body.action) {
    case "approve":
      update.approval_status = "approved";
      update.approved_at = new Date().toISOString();
      update.approved_by = currentAdmin!.id;
      break;
    case "reject":
      update.approval_status = "rejected";
      update.rejected_at = new Date().toISOString();
      break;
    case "block":
      update.approval_status = "blocked";
      update.blocked_at = new Date().toISOString();
      break;
    case "unblock":
      update.approval_status = "approved";
      update.blocked_at = null;
      break;
    case "suspend":
      update.approval_status = "suspended";
      break;
    case "promote_admin":
      update.role = "admin";
      update.approval_status = "approved";
      break;
    case "remove_admin":
      update.role = "user";
      break;
    case "note":
      break;
    default:
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  if (typeof body.admin_notes === "string") {
    update.admin_notes = body.admin_notes;
  }

  const { error } = await admin.from("profiles").update(update).in("id", userIds);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await Promise.all(
    userIds.map((id) =>
      writeAuditLog({
        actorId: currentAdmin!.id,
        targetUserId: id,
        action: body.action!,
        entityType: "user",
        entityId: id,
        metadata: { update },
        request,
      })
    )
  );

  return NextResponse.json({ ok: true });
}
