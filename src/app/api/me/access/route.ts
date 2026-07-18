import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({
      authenticated: false,
      allowed: false,
      role: "anonymous",
      approval_status: "anonymous",
      maintenance: { enabled: false },
    });
  }

  const admin = createAdminClient();
  const [{ data: profile }, { data: maintenance }] = await Promise.all([
    admin
      .from("profiles")
      .select("id,email,role,approval_status,admin_notes,is_guest")
      .eq("id", user.id)
      .single(),
    admin
      .from("website_settings")
      .select("value")
      .eq("key", "maintenance")
      .single(),
  ]);

  const role = profile?.role ?? "user";
  const approvalStatus = profile?.approval_status ?? "pending";
  const isAdmin = role === "admin" && approvalStatus === "approved";
  const isGuest =
    Boolean(profile?.is_guest) ||
    user.email?.includes("@guest.loveprofile.ai") ||
    Boolean(user.user_metadata?.guest);
  const blockedStatuses = new Set(["rejected", "blocked", "suspended", "inactive"]);
  const maintenanceValue = (maintenance?.value ?? {}) as {
    enabled?: boolean;
    reason?: string;
    estimatedReturn?: string;
    contactEmail?: string;
  };

  if (isGuest) {
    return NextResponse.json({
      authenticated: true,
      allowed: false,
      role,
      is_guest: true,
      approval_status: "guest_disabled",
      admin_notes: profile?.admin_notes ?? null,
      maintenance: maintenanceValue,
    });
  }

  const allowed =
    !blockedStatuses.has(approvalStatus) &&
    (isAdmin || (approvalStatus === "approved" && !maintenanceValue.enabled));

  if (allowed) {
    const userAgent = request.headers.get("user-agent") ?? "";
    await admin
      .from("profiles")
      .update({
        last_login_at: new Date().toISOString(),
        last_ip:
          request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
          request.headers.get("x-real-ip") ??
          null,
        browser: userAgent.slice(0, 180),
      })
      .eq("id", user.id);
  }

  return NextResponse.json({
    authenticated: true,
    allowed,
    role,
    is_guest: false,
    approval_status: approvalStatus,
    admin_notes: profile?.admin_notes ?? null,
    maintenance: maintenanceValue,
  });
}
