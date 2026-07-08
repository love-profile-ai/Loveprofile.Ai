import { getCurrentAdmin } from "@/lib/admin/auth";
import { AdminClient } from "@/app/admin/admin-client";

export default async function AdminPage() {
  const admin = await getCurrentAdmin();

  if (!admin) {
    return (
      <div className="landing-canvas flex min-h-screen items-center justify-center px-4">
        <div className="page-glow pointer-events-none absolute inset-0 -z-10" />
        <div className="premium-card max-w-lg p-8 text-center">
          <p className="text-label">Admin Control Center</p>
          <h1 className="text-heading-page mt-3">403 Unauthorized</h1>
          <p className="text-lead mt-4">
            This area is restricted to approved administrators only.
          </p>
        </div>
      </div>
    );
  }

  return <AdminClient adminEmail={admin.email ?? "Admin"} />;
}
