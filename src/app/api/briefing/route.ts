import { NextResponse } from "next/server";
import { getLatestSnapshot } from "@/lib/briefing/storage";
import { getStockMeta, inferMarket } from "@/lib/data/stock-meta";
import type { BriefingData, BriefingSession, MarketBriefing, MarketIndex, Stock } from "@/types/stock";

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

/** legacy {ticker, reason} → Stock & {reason} 변환 (배치 전환 전 데이터 호환) */
function enrichLegacyMovers(
  movers: { ticker: string; reason: string }[],
  defaultMarket: "US" | "KR",
): (Stock & { reason: string })[] {
  return movers.map((m) => {
    const meta = getStockMeta(m.ticker);
    const market = meta?.market ?? inferMarket(m.ticker);
    const currency = meta?.currency ?? (defaultMarket === "KR" ? "KRW" : "USD");
    return {
      ticker: m.ticker,
      name: meta?.nameKo ?? m.ticker,
      nameKo: meta?.nameKo ?? m.ticker,
      market,
      exchange: meta?.exchange ?? "",
      currency,
      sector: meta?.sector ?? "",
      price: 0,
      change: 0,
      changePct: 0,
      sparkline: [],
      reason: m.reason,
    };
  });
}

function num(v: unknown, fallback = 0): number {
  return typeof v === "number" && Number.isFinite(v) ? v : fallback;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeIndex(raw: any): MarketIndex {
  return {
    label: typeof raw?.label === "string" ? raw.label : "",
    value: num(raw?.value),
    changePct: num(raw?.changePct),
  };
}

function normalizeMover(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  raw: any,
  defaultMarket: "US" | "KR",
): Stock & { reason: string } {
  const ticker = typeof raw?.ticker === "string" ? raw.ticker : "";
  const meta = ticker ? getStockMeta(ticker) : undefined;
  const market = (raw?.market as "US" | "KR" | undefined) ?? meta?.market ?? inferMarket(ticker);
  const currency =
    (raw?.currency as "USD" | "KRW" | undefined) ??
    meta?.currency ??
    (defaultMarket === "KR" ? "KRW" : "USD");
  return {
    ticker,
    name: typeof raw?.name === "string" ? raw.name : meta?.nameKo ?? ticker,
    nameKo: typeof raw?.nameKo === "string" ? raw.nameKo : meta?.nameKo ?? ticker,
    market,
    exchange: typeof raw?.exchange === "string" ? raw.exchange : meta?.exchange ?? "",
    currency,
    sector: typeof raw?.sector === "string" ? raw.sector : meta?.sector ?? "",
    price: num(raw?.price),
    change: num(raw?.change),
    changePct: num(raw?.changePct),
    sparkline: Array.isArray(raw?.sparkline)
      ? raw.sparkline.filter((n: unknown) => typeof n === "number")
      : [],
    reason: typeof raw?.reason === "string" ? raw.reason : "",
  };
}

/** 항목 내부 필드 누락(undefined) 방어 — toFixed/toLocaleString crash 방지 */
function harden(b: MarketBriefing, market: "US" | "KR"): MarketBriefing {
  return {
    ...b,
    indices: (b.indices ?? []).map(normalizeIndex),
    movers: (b.movers ?? []).map((m) => normalizeMover(m, market)),
  };
}

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

    // enriched 형식: us/kr 키에 완성된 MarketBriefing (indices 포함)
    // legacy 형식: movers가 {ticker, reason}만 → enrichLegacyMovers로 보강
    const usData = usRaw?.us ?? usRaw;
    const usBriefing: MarketBriefing = usData?.indices
      ? usData
      : {
          ...emptyMarket,
          market: "US",
          dateLabel: usData?.dateLabel ?? "",
          headline: usData?.headline ?? "",
          headlineAccent: usData?.headlineAccent ?? "",
          summary: usData?.summary ?? emptyMarket.summary,
          movers: enrichLegacyMovers(usData?.movers ?? [], "US"),
          macros: usData?.macros ?? [],
          events: usData?.events ?? [],
          causes: usData?.causes ?? [],
        };

    const krData = krRaw?.kr;
    const krBriefing: MarketBriefing = krData?.indices
      ? krData
      : {
          ...emptyMarket,
          market: "KR",
          dateLabel: krData?.dateLabel ?? "",
          headline: krData?.headline ?? "",
          headlineAccent: krData?.headlineAccent ?? "",
          summary: krData?.summary ?? emptyMarket.summary,
          movers: enrichLegacyMovers(krData?.movers ?? [], "KR"),
          macros: krData?.macros ?? [],
          events: [],
          causes: krData?.causes ?? [],
        };

    const briefing: BriefingData = {
      generatedAt: usSnapshot?.started_at ?? krSnapshot?.started_at ?? "",
      session: sessions.us,
      us: harden(usBriefing, "US"),
      kr: harden(krBriefing, "KR"),
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
