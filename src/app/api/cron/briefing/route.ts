import { NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { runBriefing } from "@/lib/briefing/build";
import type { BriefingSession } from "@/types/stock";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

const VALID_SESSIONS = new Set<BriefingSession>(["us_close", "us_pre", "kr_close"]);

/**
 * 주말 동결 윈도우: 토요일 06:00 KST 배치 이후부터 월요일 06:00 KST 배치까지 모두 건너뛴다.
 * - 토 06:00 us_close (금요일 美 마감 브리핑) — 실행 (마지막 배치)
 * - 토 06:00 이후 ~ 일 23:59 — 스킵 (장 휴무)
 * - 월 00:00 ~ 06:59 — 스킵 (월 06:00 us_close 포함)
 * - 월 18:00 kr_close — 실행 (동결 해제 후 첫 배치)
 */
function isWeekendOff(): boolean {
  const now = new Date(
    new Date().toLocaleString("en-US", { timeZone: "Asia/Seoul" }),
  );
  const day = now.getDay(); // 0=Sun, 1=Mon, 6=Sat
  const hour = now.getHours();
  if (day === 0) return true; // 일요일 전체
  if (day === 6 && hour >= 7) return true; // 토 06시 배치 이후
  if (day === 1 && hour < 7) return true; // 월 06시 배치까지 포함 스킵
  return false;
}

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

  if (isWeekendOff()) {
    return NextResponse.json({ ok: true, skipped: true, reason: "weekend" });
  }

  try {
    const runId = await runBriefing("cron", session);
    return NextResponse.json({ ok: true, runId, session });
  } catch (err) {
    console.error("[cron/briefing] error:", err);
    return NextResponse.json({ ok: false, error: "Internal server error" }, { status: 500 });
  }
}
