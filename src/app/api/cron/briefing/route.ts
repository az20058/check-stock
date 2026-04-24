import { NextResponse } from "next/server";
import { runBriefing } from "@/lib/briefing/build";
import type { BriefingSession } from "@/types/stock";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

const VALID_SESSIONS = new Set<BriefingSession>(["us_close", "us_pre", "kr_close"]);

export async function GET(req: Request) {
  const auth = req.headers.get("authorization") ?? "";
  const expected = `Bearer ${process.env.CRON_SECRET ?? ""}`;
  if (!process.env.CRON_SECRET || auth !== expected) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const url = new URL(req.url);
  const session = url.searchParams.get("session") as BriefingSession | null;
  if (!session || !VALID_SESSIONS.has(session)) {
    return NextResponse.json(
      { ok: false, error: "Missing or invalid session param (us_close | us_pre | kr_close)" },
      { status: 400 },
    );
  }

  try {
    const runId = await runBriefing("cron", session);
    return NextResponse.json({ ok: true, runId, session });
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
