import { NextResponse } from "next/server";
import { fetchQuotes } from "@/lib/clients/finnhub";
import { fetchYahooQuotes, toYahooSymbol, KR_INDEX_SYMBOLS } from "@/lib/clients/yahoo";
import { getLatestSnapshot } from "@/lib/briefing/storage";
import { getStockMeta, inferMarket } from "@/lib/data/stock-meta";
import type { BriefingData, BriefingSession, MarketBriefing, MarketIndex } from "@/types/stock";
import { US_MOVER_TICKERS, KR_MOVER_TICKERS } from "@/lib/briefing/build";

const US_INDEX_SYMBOLS: { label: string; symbol: string }[] = [
  { label: "S&P 500", symbol: "SPY" },
  { label: "NASDAQ", symbol: "QQQ" },
  { label: "DOW", symbol: "DIA" },
  { label: "VIX", symbol: "^VIX" },
];

export const dynamic = "force-dynamic";

function resolveCurrentSessions(): { us: BriefingSession; kr: BriefingSession } {
  const kstHour = (new Date().getUTCHours() + 9) % 24;
  return {
    us: kstHour >= 7 && kstHour < 20 ? "us_close" : "us_pre",
    kr: "kr_close",
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
    // session 컬럼 마이그레이션 전 — session 없이 최신 스냅샷 조회
    usSnapshot = await getLatestSnapshot();
  }

  if (!usSnapshot?.briefing_data && !krSnapshot?.briefing_data) {
    return NextResponse.json(
      { error: "브리핑 데이터가 아직 생성되지 않았습니다. 배치를 실행해주세요." },
      { status: 503 },
    );
  }

  const emptyMarket = { movers: [], dateLabel: "", headline: "", headlineAccent: "", summary: { title: "", body: "", sub: "", tags: [] }, macros: [], events: [], causes: [] };

  // US snapshot
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const usRaw = usSnapshot?.briefing_data as any;
  const usSnap = !usRaw ? emptyMarket
    : (!usRaw.us && usRaw.movers) ? usRaw  // V1 flat
    : usRaw.us ?? emptyMarket;

  // KR snapshot
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const krRaw = krSnapshot?.briefing_data as any;
  const krSnap = !krRaw ? emptyMarket
    : krRaw.kr ?? emptyMarket;

  // 실시간 시세 조회 (US + KR 동시)
  const usSymbols = [...US_INDEX_SYMBOLS.map((x) => x.symbol), ...US_MOVER_TICKERS];
  const krSymbols = [
    ...KR_INDEX_SYMBOLS.map((x) => x.symbol),
    ...KR_MOVER_TICKERS.map((t) => toYahooSymbol(t, getStockMeta(t)?.exchange)),
  ];

  let usQuotes: Awaited<ReturnType<typeof fetchQuotes>> = [];
  let krQuotes: Awaited<ReturnType<typeof fetchYahooQuotes>> = [];

  await Promise.all([
    fetchQuotes(usSymbols)
      .then((q) => { usQuotes = q; })
      .catch(() => {}),
    fetchYahooQuotes(krSymbols)
      .then((q) => { krQuotes = q; })
      .catch(() => {}),
  ]);

  const byUsSymbol = new Map(usQuotes.map((q) => [q.symbol, q]));
  const byKrSymbol = new Map(krQuotes.map((q) => [q.symbol, q]));

  // US 인덱스
  const usIndices: MarketIndex[] = US_INDEX_SYMBOLS.map(({ label, symbol }) => {
    const q = byUsSymbol.get(symbol);
    return { label, value: q?.c ?? 0, changePct: q?.dp ?? 0 };
  });

  // KR 인덱스
  const krIndices: MarketIndex[] = KR_INDEX_SYMBOLS.map(({ label, symbol }) => {
    const q = byKrSymbol.get(symbol);
    return { label, value: q?.c ?? 0, changePct: q?.dp ?? 0 };
  });

  // US 무버
  const usMovers = ((usSnap.movers ?? []) as { ticker: string; reason: string }[]).map((m) => {
    const q = byUsSymbol.get(m.ticker);
    const meta = getStockMeta(m.ticker);
    const market = meta?.market ?? inferMarket(m.ticker);
    const currency = meta?.currency ?? "USD";
    const price = q?.c ?? 0;
    const changePct = q?.dp ?? 0;
    const change = price - price / (1 + changePct / 100);
    return {
      ticker: m.ticker,
      name: meta?.nameKo ?? m.ticker,
      nameKo: meta?.nameKo ?? m.ticker,
      market,
      exchange: meta?.exchange ?? "",
      currency,
      sector: meta?.sector ?? "",
      price,
      change,
      changePct,
      sparkline: [] as number[],
      reason: m.reason,
    };
  });

  // KR 무버
  const krMovers = ((krSnap.movers ?? []) as { ticker: string; reason: string }[]).map((m) => {
    const meta = getStockMeta(m.ticker);
    const market = meta?.market ?? inferMarket(m.ticker);
    const currency = meta?.currency ?? "KRW";
    const yahooSym = toYahooSymbol(m.ticker, meta?.exchange);
    const q = byKrSymbol.get(yahooSym);
    const price = q?.c ?? 0;
    const changePct = q?.dp ?? 0;
    const change = price - price / (1 + changePct / 100);
    return {
      ticker: m.ticker,
      name: meta?.nameKo ?? m.ticker,
      nameKo: meta?.nameKo ?? m.ticker,
      market,
      exchange: meta?.exchange ?? "",
      currency,
      sector: meta?.sector ?? "",
      price,
      change,
      changePct,
      sparkline: [] as number[],
      reason: m.reason,
    };
  });

  const usBriefing: MarketBriefing = {
    market: "US",
    dateLabel: (usSnap.dateLabel ?? usSnap.date ?? "") as string,
    headline: (usSnap.headline ?? "") as string,
    headlineAccent: (usSnap.headlineAccent ?? "") as string,
    indices: usIndices,
    summary: usSnap.summary ?? { title: "", body: "", sub: "", tags: [] },
    movers: usMovers,
    macros: usSnap.macros?.length ? usSnap.macros : [],
    events: usSnap.events?.length ? usSnap.events : [],
    causes: usSnap.causes ?? [],
  };

  const krBriefing: MarketBriefing = {
    market: "KR",
    dateLabel: krSnap.dateLabel ?? "",
    headline: krSnap.headline ?? "",
    headlineAccent: krSnap.headlineAccent ?? "",
    indices: krIndices,
    summary: krSnap.summary ?? { title: "", body: "", sub: "", tags: [] },
    movers: krMovers,
    macros: krSnap.macros?.length ? krSnap.macros : [],
    events: [],
    causes: krSnap.causes ?? [],
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
