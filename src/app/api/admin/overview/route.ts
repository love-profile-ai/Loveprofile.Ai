import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/auth";
import { createAdminClient } from "@/lib/supabase/admin";

function startOfToday() {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date.toISOString();
}

export async function GET() {
  const { response } = await requireAdmin();
  if (response) return response;

  const admin = createAdminClient();
  const today = startOfToday();

  const [
    users,
    activeUsers,
    pending,
    signupsToday,
    reports,
    sessions,
    questions,
    maintenance,
    music,
    notifications,
  ] = await Promise.all([
    admin.from("profiles").select("id", { count: "exact", head: true }),
    admin
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .gte("last_login_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
    admin
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("approval_status", "pending"),
    admin
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .gte("created_at", today),
    admin.from("reports").select("id", { count: "exact", head: true }),
    admin
      .from("analysis_sessions")
      .select("id", { count: "exact", head: true })
      .eq("status", "in_progress"),
    admin.from("question_bank").select("id", { count: "exact", head: true }),
    admin
      .from("website_settings")
      .select("value")
      .eq("key", "maintenance")
      .single(),
    admin.from("website_settings").select("value").eq("key", "music").single(),
    admin
      .from("admin_notifications")
      .select("id", { count: "exact", head: true })
      .is("read_at", null),
  ]);

  return NextResponse.json({
    metrics: {
      totalUsers: users.count ?? 0,
      activeUsers: activeUsers.count ?? 0,
      pendingApprovals: pending.count ?? 0,
      todaysSignups: signupsToday.count ?? 0,
      reportsGenerated: reports.count ?? 0,
      activeSessions: sessions.count ?? 0,
      totalQuestions: questions.count ?? 0,
      websiteStatus: maintenance.data?.value?.enabled ? "Maintenance" : "Online",
      backgroundMusicStatus: music.data?.value?.enabled ? "Enabled" : "Disabled",
      maintenanceStatus: maintenance.data?.value?.enabled ? "Enabled" : "Disabled",
      unreadNotifications: notifications.count ?? 0,
    },
  });
}
