import { NextResponse } from "next/server";
import { briefingData as mockBriefing } from "@/mocks/data/briefing";
import { stocksMap } from "@/mocks/data/stocks";
import { fetchQuotes } from "@/lib/clients/finnhub";
import { getLatestSnapshot } from "@/lib/briefing/storage";
import type { BriefingData, MarketIndex, Stock } from "@/types/stock";
import { MOVER_TICKERS } from "@/lib/briefing/build";

const indexSymbolMap: { label: string; symbol: string }[] = [
  { label: "SPY", symbol: "SPY" },
  { label: "QQQ", symbol: "QQQ" },
  { label: "DIA", symbol: "DIA" },
  { label: "VIX", symbol: "^VIX" },
];

export const dynamic = "force-dynamic";

export async function GET() {
  let base: BriefingData = mockBriefing;
  try {
    const snapshot = await getLatestSnapshot();
    if (snapshot?.briefing_data) {
      const snap = snapshot.briefing_data;
      base = {
        date: snap.date ?? mockBriefing.date,
        headline: snap.headline ?? mockBriefing.headline,
        headlineAccent: snap.headlineAccent ?? mockBriefing.headlineAccent,
        indices: mockBriefing.indices,
        summary: snap.summary ?? mockBriefing.summary,
        movers: snap.movers.map((m) => {
          const s = stocksMap[m.ticker];
          const mockMover = mockBriefing.movers.find((x) => x.ticker === m.ticker);
          return {
            ...(s ?? (mockMover as Stock)),
            sparkline: mockMover?.sparkline ?? s?.sparkline ?? [],
            reason: m.reason,
          };
        }),
        macros: snap.macros?.length ? snap.macros : mockBriefing.macros,
        events: snap.events?.length ? snap.events : mockBriefing.events,
      };
    }
  } catch {
    // snapshot read failed — keep mock
  }

  // Realtime quote overlays
  try {
    const symbols = [
      ...indexSymbolMap.map((x) => x.symbol),
      ...MOVER_TICKERS,
    ];
    const quotes = await fetchQuotes(symbols);
    const bySymbol = new Map(quotes.map((q) => [q.symbol, q]));

    base = {
      ...base,
      indices: indexSymbolMap.map(({ label, symbol }): MarketIndex => {
        const q = bySymbol.get(symbol);
        if (q) return { label, value: q.c, changePct: q.dp };
        const fallback = base.indices.find((i) => i.label === label);
        return fallback ?? { label, value: 0, changePct: 0 };
      }),
      movers: base.movers.map((m) => {
        const q = bySymbol.get(m.ticker);
        if (!q) return m;
        const change = q.c - (q.c / (1 + q.dp / 100));
        return { ...m, price: q.c, change, changePct: q.dp };
      }),
    };
  } catch {
    // quotes failed — keep base
  }

  return NextResponse.json(base);
}
