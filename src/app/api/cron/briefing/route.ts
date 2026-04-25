import { NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { runBriefing } from "@/lib/briefing/build";
import type { BriefingSession } from "@/types/stock";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

const VALID_SESSIONS = new Set<BriefingSession>(["us_close", "us_pre", "kr_close"]);

function verifyBearer(header: string | null, secret: string): boolean {
  if (!header?.startsWith("Bearer ")) return false;
  const provided = Buffer.from(header.slice(7));
  const expected = Buffer.from(secret);
  if (provided.length !== expected.length) return false;
  return timingSafeEqual(provided, expected);
}

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || !verifyBearer(req.headers.get("authorization"), secret)) {
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
    console.error("[cron/briefing] error:", err);
    return NextResponse.json({ ok: false, error: "Internal server error" }, { status: 500 });
  }
}
