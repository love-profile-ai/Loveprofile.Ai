import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export interface AdminUser {
  id: string;
  email: string | null;
  role: "admin" | "moderator" | "user";
  approval_status: string;
}

export async function getCurrentAdmin(): Promise<AdminUser | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const admin = createAdminClient();
  const { data: profile, error } = await admin
    .from("profiles")
    .select("id,email,role,approval_status")
    .eq("id", user.id)
    .single();

  if (error || !profile) return null;
  if (profile.role !== "admin" || profile.approval_status !== "approved") {
    return null;
  }

  return {
    id: profile.id,
    email: profile.email ?? user.email ?? null,
    role: profile.role,
    approval_status: profile.approval_status,
  };
}

export async function requireAdmin() {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return {
      admin: null,
      response: NextResponse.json(
        { error: "403 Unauthorized" },
        { status: 403 }
      ),
    };
  }
  return { admin, response: null };
}

export async function writeAuditLog({
  actorId,
  targetUserId,
  action,
  entityType = "system",
  entityId,
  metadata = {},
  request,
}: {
  actorId: string;
  targetUserId?: string;
  action: string;
  entityType?: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
  request?: Request;
}) {
  const admin = createAdminClient();
  await admin.from("admin_audit_logs").insert({
    actor_id: actorId,
    target_user_id: targetUserId,
    action,
    entity_type: entityType,
    entity_id: entityId,
    metadata,
    ip:
      request?.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      request?.headers.get("x-real-ip") ??
      null,
    user_agent: request?.headers.get("user-agent"),
  });
}
