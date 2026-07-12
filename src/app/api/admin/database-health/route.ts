import { NextResponse } from "next/server";
import { requireAdmin, writeAuditLog } from "@/lib/admin/auth";
import {
  repairDatabaseHealth,
  runDatabaseHealthAudit,
} from "@/lib/engine/database-health";
import { loadQuestionsForPath } from "@/lib/engine/question-bank";

export async function GET() {
  const { response } = await requireAdmin();
  if (response) return response;

  const report = await runDatabaseHealthAudit();

  const loaderSamples = await Promise.all([
    loadQuestionsForPath("do_i_love_someone"),
    loadQuestionsForPath("does_someone_love_me"),
  ]);

  return NextResponse.json({
    report,
    loader: {
      do_i_love_someone: {
        source: loaderSamples[0].source,
        count: loaderSamples[0].count,
        warning: loaderSamples[0].warning,
      },
      does_someone_love_me: {
        source: loaderSamples[1].source,
        count: loaderSamples[1].count,
        warning: loaderSamples[1].warning,
      },
    },
  });
}

export async function POST(request: Request) {
  const { admin, response } = await requireAdmin();
  if (response) return response;

  const body = await request.json().catch(() => ({}));
  const action = (body.action as string) ?? "repair";

  if (action === "audit") {
    const report = await runDatabaseHealthAudit();
    return NextResponse.json({ report, actions: [] });
  }

  const { report, actions } = await repairDatabaseHealth();

  await writeAuditLog({
    actorId: admin!.id,
    action: "database_health_repair",
    entityType: "database",
    metadata: { actions, problemCount: report.problems.length },
    request,
  });

  return NextResponse.json({ report, actions });
}
