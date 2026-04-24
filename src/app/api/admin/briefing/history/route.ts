import { NextResponse } from "next/server";
import { listRecentRuns } from "@/lib/briefing/storage";

export const dynamic = "force-dynamic";

export async function GET() {
  const runs = await listRecentRuns(20);
  return NextResponse.json(
    runs.map((r) => ({
      id: r.id,
      started_at: r.started_at,
      finished_at: r.finished_at,
      status: r.status,
      triggered_by: r.triggered_by,
      error: r.error,
      token_usage: r.token_usage,
    })),
  );
}
