import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  const { response } = await requireAdmin();
  if (response) return response;

  const { searchParams } = new URL(request.url);
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "50", 10), 200);
  const admin = createAdminClient();

  const [{ data: logs }, { data: notifications }] = await Promise.all([
    admin
      .from("admin_audit_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit),
    admin
      .from("admin_notifications")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(25),
  ]);

  return NextResponse.json({ logs: logs ?? [], notifications: notifications ?? [] });
}
