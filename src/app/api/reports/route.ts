import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "20"), 50);
  const offset = parseInt(searchParams.get("offset") ?? "0");

  const { data, error, count } = await supabase
    .from("reports")
    .select("id, title, path, analysis, created_at", { count: "exact" })
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    return NextResponse.json({ error: "Failed to fetch reports" }, { status: 500 });
  }

  const reports = (data ?? []).map((r) => ({
    id: r.id,
    title: r.title,
    path: r.path,
    confidence: (r.analysis as { confidence?: string })?.confidence ?? "Medium",
    created_at: r.created_at,
  }));

  return NextResponse.json({ reports, total: count ?? 0 });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { path } = body;

  if (!path || !["i_like_someone", "someone_likes_me"].includes(path)) {
    return NextResponse.json({ error: "Invalid path" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("analysis_sessions")
    .insert({
      user_id: user.id,
      path,
      current_question_id: null,
      answers: [],
    })
    .select("id")
    .single();

  if (error) {
    return NextResponse.json({ error: "Failed to create session" }, { status: 500 });
  }

  return NextResponse.json({ sessionId: data.id });
}
