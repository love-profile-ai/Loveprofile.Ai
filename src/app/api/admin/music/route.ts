import { NextResponse } from "next/server";
import { requireAdmin, writeAuditLog } from "@/lib/admin/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const { response } = await requireAdmin();
  if (response) return response;

  const admin = createAdminClient();
  const [{ data: tracks }, { data: settings }] = await Promise.all([
    admin.from("music_tracks").select("*").order("created_at", { ascending: false }),
    admin.from("website_settings").select("value").eq("key", "music").single(),
  ]);

  return NextResponse.json({ tracks: tracks ?? [], settings: settings?.value ?? {} });
}

export async function POST(request: Request) {
  const { admin: currentAdmin, response } = await requireAdmin();
  if (response) return response;

  const body = await request.json();
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("music_tracks")
    .insert({
      title: body.title ?? "Untitled track",
      artist: body.artist,
      url: body.url,
      storage_path: body.storage_path,
      enabled: body.enabled ?? true,
      is_default: body.is_default ?? false,
      volume: body.volume ?? 35,
      metadata: body.metadata ?? {},
      created_by: currentAdmin!.id,
    })
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  await writeAuditLog({
    actorId: currentAdmin!.id,
    action: "create_music_track",
    entityType: "music",
    entityId: data.id,
    request,
  });
  return NextResponse.json({ track: data });
}

export async function PATCH(request: Request) {
  const { admin: currentAdmin, response } = await requireAdmin();
  if (response) return response;

  const body = await request.json();
  const admin = createAdminClient();

  if (body.settings) {
    const { error } = await admin.from("website_settings").upsert({
      key: "music",
      value: body.settings,
      updated_by: currentAdmin!.id,
      updated_at: new Date().toISOString(),
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    await writeAuditLog({
      actorId: currentAdmin!.id,
      action: "update_music_settings",
      entityType: "settings",
      entityId: "music",
      request,
    });
    return NextResponse.json({ ok: true });
  }

  if (!body.id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  const { data, error } = await admin
    .from("music_tracks")
    .update({ ...body, updated_at: new Date().toISOString() })
    .eq("id", body.id)
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ track: data });
}
