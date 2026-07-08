import { NextResponse } from "next/server";
import { requireAdmin, writeAuditLog } from "@/lib/admin/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  const { response } = await requireAdmin();
  if (response) return response;

  const { searchParams } = new URL(request.url);
  const path = searchParams.get("path");
  const admin = createAdminClient();
  let query = admin.from("question_bank").select("*").order("sort_order");
  if (path) query = query.eq("path", path);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ questions: data ?? [] });
}

export async function POST(request: Request) {
  const { admin: currentAdmin, response } = await requireAdmin();
  if (response) return response;

  const body = await request.json();
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("question_bank")
    .insert({
      path: body.path ?? "i_like_someone",
      question_key: body.question_key,
      text: body.text ?? "Untitled question",
      description: body.description,
      placeholder: body.placeholder,
      type: body.type ?? "single_choice",
      options: body.options ?? [],
      weight: body.weight ?? 1,
      score: body.score ?? 0,
      category: body.category,
      required: body.required ?? true,
      enabled: body.enabled ?? true,
      visibility: body.visibility ?? {},
      conditions: body.conditions ?? {},
      validation: body.validation ?? {},
      sort_order: body.sort_order ?? 0,
      created_by: currentAdmin!.id,
      updated_by: currentAdmin!.id,
    })
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await writeAuditLog({
    actorId: currentAdmin!.id,
    action: "create_question",
    entityType: "question",
    entityId: data.id,
    request,
  });

  return NextResponse.json({ question: data });
}

export async function PATCH(request: Request) {
  const { admin: currentAdmin, response } = await requireAdmin();
  if (response) return response;

  const body = await request.json();
  if (!body.id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("question_bank")
    .update({
      ...body,
      updated_by: currentAdmin!.id,
      updated_at: new Date().toISOString(),
    })
    .eq("id", body.id)
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await writeAuditLog({
    actorId: currentAdmin!.id,
    action: "update_question",
    entityType: "question",
    entityId: body.id,
    request,
  });

  return NextResponse.json({ question: data });
}

export async function DELETE(request: Request) {
  const { admin: currentAdmin, response } = await requireAdmin();
  if (response) return response;

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const admin = createAdminClient();
  const { error } = await admin.from("question_bank").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await writeAuditLog({
    actorId: currentAdmin!.id,
    action: "delete_question",
    entityType: "question",
    entityId: id,
    request,
  });

  return NextResponse.json({ ok: true });
}
