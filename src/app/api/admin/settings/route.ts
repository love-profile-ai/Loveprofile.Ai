import { NextResponse } from "next/server";
import { requireAdmin, writeAuditLog } from "@/lib/admin/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const { response } = await requireAdmin();
  if (response) return response;

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("website_settings")
    .select("key,value,updated_at")
    .order("key");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    settings: Object.fromEntries((data ?? []).map((row) => [row.key, row.value])),
  });
}

export async function PATCH(request: Request) {
  const { admin: currentAdmin, response } = await requireAdmin();
  if (response) return response;

  const body = (await request.json()) as { key?: string; value?: unknown };
  if (!body.key) {
    return NextResponse.json({ error: "Missing key" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { error } = await admin.from("website_settings").upsert({
    key: body.key,
    value: body.value ?? {},
    updated_by: currentAdmin!.id,
    updated_at: new Date().toISOString(),
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await writeAuditLog({
    actorId: currentAdmin!.id,
    action: "update_settings",
    entityType: "settings",
    entityId: body.key,
    metadata: { key: body.key },
    request,
  });

  return NextResponse.json({ ok: true });
}
