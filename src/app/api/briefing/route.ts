import { NextResponse } from "next/server";
import { fetchQuotes } from "@/lib/clients/finnhub";
import { getLatestSnapshot } from "@/lib/briefing/storage";
import { getStockMeta } from "@/lib/data/stock-meta";
import type { BriefingData, MarketIndex } from "@/types/stock";
import { MOVER_TICKERS } from "@/lib/briefing/build";

const indexSymbolMap: { label: string; symbol: string }[] = [
  { label: "SPY", symbol: "SPY" },
  { label: "QQQ", symbol: "QQQ" },
  { label: "DIA", symbol: "DIA" },
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

  const snap = snapshot.briefing_data;

  // 실시간 시세 오버레이
  const symbols = [
    ...indexSymbolMap.map((x) => x.symbol),
    ...MOVER_TICKERS,
  ];

  let quotes: Awaited<ReturnType<typeof fetchQuotes>> = [];
  try {
    quotes = await fetchQuotes(symbols);
  } catch {
    // 시세 조회 실패 시 스냅샷 데이터만 사용
  }

  const bySymbol = new Map(quotes.map((q) => [q.symbol, q]));

  const indices: MarketIndex[] = indexSymbolMap.map(({ label, symbol }) => {
    const q = bySymbol.get(symbol);
    return { label, value: q?.c ?? 0, changePct: q?.dp ?? 0 };
  });

  const movers = snap.movers.map((m) => {
    const q = bySymbol.get(m.ticker);
    const meta = getStockMeta(m.ticker);
    const price = q?.c ?? 0;
    const changePct = q?.dp ?? 0;
    const change = price - price / (1 + changePct / 100);
    return {
      ticker: m.ticker,
      name: meta?.nameKo ?? m.ticker,
      nameKo: meta?.nameKo ?? m.ticker,
      exchange: "",
      sector: meta?.sector ?? "",
      price,
      change,
      changePct,
      sparkline: [] as number[],
      reason: m.reason,
    };
  });

  const briefing: BriefingData = {
    date: snap.date ?? "",
    headline: snap.headline ?? "",
    headlineAccent: snap.headlineAccent ?? "",
    indices,
    summary: snap.summary ?? { title: "", body: "", sub: "", tags: [] },
    movers,
    macros: snap.macros?.length ? snap.macros : [],
    events: snap.events?.length ? snap.events : [],
  };

  return NextResponse.json(briefing);
}
