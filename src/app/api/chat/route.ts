import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { chatRequestSchema } from "@/lib/ai/schemas";
import { streamChatResponse } from "@/lib/ai/openai";
import { rateLimit } from "@/lib/rate-limit";
import { containsPromptInjection, sanitizeText } from "@/lib/sanitize";
import type { AnalysisReport } from "@/types/report";
import type { Answer } from "@/types/questionnaire";

export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const limit = rateLimit(`chat:${user.id}`, 20, 60 * 60 * 1000);
    if (!limit.success) {
      return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
    }

    const body = await request.json();
    const parsed = chatRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const message = sanitizeText(parsed.data.message);
    if (containsPromptInjection(message)) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const { data: report, error: reportError } = await supabase
      .from("reports")
      .select("*")
      .eq("id", parsed.data.reportId)
      .eq("user_id", user.id)
      .single();

    if (reportError || !report) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    const { data: history } = await supabase
      .from("chat_messages")
      .select("role, content")
      .eq("report_id", report.id)
      .order("created_at", { ascending: true })
      .limit(20);

    await supabase.from("chat_messages").insert({
      report_id: report.id,
      user_id: user.id,
      role: "user",
      content: message,
    });

    const stream = await streamChatResponse(
      report.path,
      report.answers as Answer[],
      report.analysis as AnalysisReport,
      (history ?? []) as { role: "user" | "assistant"; content: string }[],
      message
    );

    const encoder = new TextEncoder();
    let fullContent = "";

    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const text of stream) {
            if (text) {
              fullContent += text;
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ text })}\n\n`)
              );
            }
          }

          if (fullContent) {
            await supabase.from("chat_messages").insert({
              report_id: report.id,
              user_id: user.id,
              role: "assistant",
              content: fullContent,
            });
          }

          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        } catch (err) {
          controller.error(err);
        }
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Chat error:", error);
    return NextResponse.json({ error: "Chat failed" }, { status: 500 });
  }
}
