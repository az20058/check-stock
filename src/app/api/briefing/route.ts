import { NextResponse } from "next/server";
import { getLatestSnapshot } from "@/lib/briefing/storage";
import type { BriefingData, BriefingSession, MarketBriefing } from "@/types/stock";

export const revalidate = 300; // 5분 ISR — 데이터는 배치 때만 변경됨

function resolveCurrentSessions(): { us: BriefingSession; kr: BriefingSession } {
  const kstHour = (new Date().getUTCHours() + 9) % 24;
  return {
    us: kstHour >= 7 && kstHour < 20 ? "us_close" : "us_pre",
    kr: "kr_close",
  };
}

const emptyMarket: MarketBriefing = {
  market: "US",
  dateLabel: "",
  headline: "",
  headlineAccent: "",
  indices: [],
  summary: { title: "", body: "", sub: "", tags: [] },
  movers: [],
  macros: [],
  events: [],
  causes: [],
};

export async function GET() {
  try {
    const sessions = resolveCurrentSessions();

    let usSnapshot: Awaited<ReturnType<typeof getLatestSnapshot>> = null;
    let krSnapshot: Awaited<ReturnType<typeof getLatestSnapshot>> = null;

    try {
      [usSnapshot, krSnapshot] = await Promise.all([
        getLatestSnapshot(sessions.us),
        getLatestSnapshot(sessions.kr),
      ]);
    } catch {
      usSnapshot = await getLatestSnapshot();
    }

    if (!usSnapshot?.briefing_data && !krSnapshot?.briefing_data) {
      return NextResponse.json(
        { error: "브리핑 데이터가 아직 생성되지 않았습니다. 배치를 실행해주세요." },
        { status: 503 },
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const usRaw = usSnapshot?.briefing_data as any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const krRaw = krSnapshot?.briefing_data as any;

    // enriched 형식: us/kr 키에 완성된 MarketBriefing이 들어있음
    // legacy 형식: flat movers / indices 없음 → fallback
    const usBriefing: MarketBriefing = usRaw?.us?.indices
      ? usRaw.us
      : {
          ...emptyMarket,
          market: "US",
          dateLabel: usRaw?.us?.dateLabel ?? usRaw?.dateLabel ?? "",
          headline: usRaw?.us?.headline ?? usRaw?.headline ?? "",
          headlineAccent: usRaw?.us?.headlineAccent ?? usRaw?.headlineAccent ?? "",
          summary: usRaw?.us?.summary ?? usRaw?.summary ?? emptyMarket.summary,
          movers: usRaw?.us?.movers ?? usRaw?.movers ?? [],
          macros: usRaw?.us?.macros ?? usRaw?.macros ?? [],
          events: usRaw?.us?.events ?? usRaw?.events ?? [],
          causes: usRaw?.us?.causes ?? usRaw?.causes ?? [],
        };

    const krBriefing: MarketBriefing = krRaw?.kr?.indices
      ? krRaw.kr
      : {
          ...emptyMarket,
          market: "KR",
          dateLabel: krRaw?.kr?.dateLabel ?? "",
          headline: krRaw?.kr?.headline ?? "",
          headlineAccent: krRaw?.kr?.headlineAccent ?? "",
          summary: krRaw?.kr?.summary ?? emptyMarket.summary,
          movers: krRaw?.kr?.movers ?? [],
          macros: krRaw?.kr?.macros ?? [],
          events: [],
          causes: krRaw?.kr?.causes ?? [],
        };

    const briefing: BriefingData = {
      generatedAt: usSnapshot?.started_at ?? krSnapshot?.started_at ?? "",
      session: sessions.us,
      us: usBriefing,
      kr: krBriefing,
    };

    return NextResponse.json(briefing);
  } catch (err) {
    console.error("[/api/briefing] error:", err);
    return NextResponse.json(
      { error: "브리핑 데이터를 불러오는 중 오류가 발생했습니다" },
      { status: 500 },
    );
  }
}
