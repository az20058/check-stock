import { NextResponse } from "next/server";
import { runBriefing } from "@/lib/briefing/build";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const runId = await runBriefing("manual");
    return NextResponse.json({ ok: true, runId });
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
