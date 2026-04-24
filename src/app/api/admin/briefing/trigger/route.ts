import { NextResponse } from "next/server";
import { runBriefing } from "@/lib/briefing/build";
import type { BriefingSession } from "@/types/stock";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

const VALID_SESSIONS = new Set<BriefingSession>(["us_close", "us_pre", "kr_close"]);

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const session: BriefingSession = VALID_SESSIONS.has(body.session) ? body.session : "us_close";
    const runId = await runBriefing("manual", session);
    return NextResponse.json({ ok: true, runId, session });
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
