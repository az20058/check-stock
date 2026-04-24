import { NextResponse } from "next/server";
import { briefingData } from "@/mocks/data/briefing";
import { fetchQuotes } from "@/lib/clients/finnhub";
import type { MarketIndex } from "@/types/stock";

const symbolMap = [
  { label: "S&P 500", symbol: "SPY" },
  { label: "NASDAQ", symbol: "QQQ" },
  { label: "DOW", symbol: "DIA" },
  { label: "VIX", symbol: "^VIX" },
];

export async function GET() {
  let indices: MarketIndex[] = briefingData.indices;

  try {
    const quotes = await fetchQuotes(symbolMap.map((s) => s.symbol));
    const quoteBySymbol = new Map(quotes.map((q) => [q.symbol, q]));

    indices = symbolMap.map(({ label, symbol }) => {
      const q = quoteBySymbol.get(symbol);
      if (q) return { label, value: q.c, changePct: q.dp };
      const fallback = briefingData.indices.find((i) => i.label === label);
      return fallback ?? { label, value: 0, changePct: 0 };
    });
  } catch {
    // key missing or all fetches failed — serve mock
  }

  return NextResponse.json({ ...briefingData, indices });
}
