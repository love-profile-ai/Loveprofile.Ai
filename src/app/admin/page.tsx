import { getAdminAccessStatus } from "@/lib/admin/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { AdminClient } from "@/app/admin/admin-client";
import { AdminBootstrapPanel } from "@/app/admin/admin-bootstrap-panel";

async function canBootstrapFirstAdmin() {
  const admin = createAdminClient();
  const { count, error } = await admin
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .eq("role", "admin")
    .eq("approval_status", "approved");

  if (error) return false;
  return (count ?? 0) === 0;
}

export default async function AdminPage() {
  const [access, canBootstrap] = await Promise.all([
    getAdminAccessStatus(),
    canBootstrapFirstAdmin(),
  ]);

  if (!access.allowed) {
    return (
      <AdminBootstrapPanel
        reason={access.reason}
        email={access.email}
        role={access.role}
        approvalStatus={access.approval_status}
        canBootstrap={canBootstrap}
      />
    );
  }

  const adminEmail = access.email ?? "Admin";
  return <AdminClient adminEmail={adminEmail} />;
}
