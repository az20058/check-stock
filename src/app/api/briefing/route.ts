import { NextResponse } from "next/server";
import { fetchQuotes } from "@/lib/clients/finnhub";
import { fetchYahooQuotes, toYahooSymbol, KR_INDEX_SYMBOLS } from "@/lib/clients/yahoo";
import { getLatestSnapshot } from "@/lib/briefing/storage";
import { getStockMeta, inferMarket } from "@/lib/data/stock-meta";
import type { BriefingData, MarketBriefing, MarketIndex } from "@/types/stock";
import { US_MOVER_TICKERS, KR_MOVER_TICKERS } from "@/lib/briefing/build";

const US_INDEX_SYMBOLS: { label: string; symbol: string }[] = [
  { label: "S&P 500", symbol: "SPY" },
  { label: "NASDAQ", symbol: "QQQ" },
  { label: "DOW", symbol: "DIA" },
  { label: "VIX", symbol: "^VIX" },
];

export const dynamic = "force-dynamic";

export async function GET() {
  const snapshot = await getLatestSnapshot();
  if (!snapshot?.briefing_data) {
    return NextResponse.json(
      { error: "브리핑 데이터가 아직 생성되지 않았습니다. 배치를 실행해주세요." },
      { status: 503 },
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rawSnap = snapshot.briefing_data as any;

  // v1→v2 어댑터: 기존 flat 스냅샷이면 us에 넣고 kr은 빈 구조로
  const isV1 = !rawSnap.us && rawSnap.movers;
  const emptyMarket = { movers: [], dateLabel: "", headline: "", headlineAccent: "", summary: { title: "", body: "", sub: "", tags: [] }, macros: [], events: [], causes: [] };
  const snap = isV1
    ? { us: rawSnap, kr: emptyMarket }
    : { us: rawSnap.us ?? emptyMarket, kr: rawSnap.kr ?? emptyMarket };

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
  const usMovers = ((snap.us.movers ?? []) as { ticker: string; reason: string }[]).map((m) => {
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
  const krMovers = ((snap.kr.movers ?? []) as { ticker: string; reason: string }[]).map((m) => {
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
    dateLabel: (snap.us.dateLabel ?? snap.us.date ?? "") as string,
    headline: (snap.us.headline ?? "") as string,
    headlineAccent: (snap.us.headlineAccent ?? "") as string,
    indices: usIndices,
    summary: snap.us.summary ?? { title: "", body: "", sub: "", tags: [] },
    movers: usMovers,
    macros: snap.us.macros?.length ? snap.us.macros : [],
    events: snap.us.events?.length ? snap.us.events : [],
    causes: snap.us.causes ?? [],
  };

  const krBriefing: MarketBriefing = {
    market: "KR",
    dateLabel: snap.kr.dateLabel ?? "",
    headline: snap.kr.headline ?? "",
    headlineAccent: snap.kr.headlineAccent ?? "",
    indices: krIndices,
    summary: snap.kr.summary ?? { title: "", body: "", sub: "", tags: [] },
    movers: krMovers,
    macros: snap.kr.macros?.length ? snap.kr.macros : [],
    events: [],
    causes: snap.kr.causes ?? [],
  };

  const briefing: BriefingData = {
    generatedAt: snapshot.started_at,
    us: usBriefing,
    kr: krBriefing,
  };

  return NextResponse.json(briefing);
}
