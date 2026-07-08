import { NextResponse } from "next/server";
import { requireAdmin, writeAuditLog } from "@/lib/admin/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const { response } = await requireAdmin();
  if (response) return response;

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("content_blocks")
    .select("*")
    .order("updated_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ content: data ?? [] });
}

export async function POST(request: Request) {
  const { admin: currentAdmin, response } = await requireAdmin();
  if (response) return response;

  const body = await request.json();
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("content_blocks")
    .upsert({
      key: body.key,
      title: body.title,
      type: body.type ?? "generic",
      content: body.content ?? {},
      enabled: body.enabled ?? true,
      updated_by: currentAdmin!.id,
      updated_at: new Date().toISOString(),
    })
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  await writeAuditLog({
    actorId: currentAdmin!.id,
    action: "upsert_content",
    entityType: "content",
    entityId: body.key,
    request,
  });
  return NextResponse.json({ content: data });
}
