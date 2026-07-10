import { NextResponse } from "next/server";
import { requireAdmin, writeAuditLog } from "@/lib/admin/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  const { response } = await requireAdmin();
  if (response) return response;

  const { searchParams } = new URL(request.url);
  const path = searchParams.get("path");
  const admin = createAdminClient();

  let query = admin
    .from("questions")
    .select("*")
    .order("priority", { ascending: false });

  if (path) {
    query = query.eq("path", path);
  }

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ questions: data ?? [] });
}

export async function PATCH(request: Request) {
  const { admin: currentAdmin, response } = await requireAdmin();
  if (response) return response;

  const body = await request.json();
  const id = body.id as string;
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  const allowed = [
    "question_text",
    "type",
    "options",
    "psychological_dimension",
    "weight",
    "priority",
    "follow_up_rules",
    "scoring",
    "confidence_value",
    "is_active",
    "is_starter",
    "category",
  ] as const;

  const update: Record<string, unknown> = {};
  for (const key of allowed) {
    if (body[key] !== undefined) update[key] = body[key];
  }

  if (!Object.keys(update).length) {
    return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("questions")
    .update(update)
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await writeAuditLog({
    actorId: currentAdmin!.id,
    action: "update_adaptive_question",
    entityType: "adaptive_question",
    entityId: id,
    metadata: { update },
    request,
  });

  return NextResponse.json({ question: data });
}
