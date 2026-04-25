import { NextResponse } from "next/server";
import { getCachedReport, saveReport } from "@/lib/report/cache";
import { generateReport } from "@/lib/report/generate";

export const maxDuration = 30;

// 영문 1~5자 또는 한국 종목코드 6자리
const TICKER_RE = /^[A-Z]{1,5}$|^\d{6}$/;

export async function GET(
  _: Request,
  { params }: { params: Promise<{ ticker: string }> },
) {
  const { ticker } = await params;
  const upper = ticker.toUpperCase();

  if (!TICKER_RE.test(upper)) {
    return NextResponse.json(
      { error: "Invalid ticker format" },
      { status: 400 },
    );
  }

  // 캐시 확인
  try {
    const cached = await getCachedReport(upper);
    if (cached) return NextResponse.json(cached);
  } catch {
    // 캐시 조회 실패 — 생성 진행
  }

  // 실시간 생성
  try {
    const report = await generateReport(upper);

    // 비동기 캐시 저장
    saveReport(upper, report).catch(() => {});

    return NextResponse.json(report);
  } catch (err) {
    console.error(`[report/${upper}] error:`, err);
    return NextResponse.json({ error: "리포트 생성 실패" }, { status: 500 });
  }
}
