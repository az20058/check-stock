import { NextResponse } from "next/server";
import { getCachedReport, saveReport } from "@/lib/report/cache";
import { generateReport } from "@/lib/report/generate";

export const maxDuration = 30;

export async function GET(
  _: Request,
  { params }: { params: Promise<{ ticker: string }> },
) {
  const { ticker } = await params;
  const upper = ticker.toUpperCase();

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
    const message = err instanceof Error ? err.message : "리포트 생성 실패";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
