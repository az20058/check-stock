import { NextResponse } from "next/server";
import { searchSymbols } from "@/lib/clients/finnhub-search";
import { getStockMeta } from "@/lib/data/stock-meta";
import type { Stock } from "@/types/stock";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const q = (url.searchParams.get("q") || "").trim();
  if (!q) return NextResponse.json([]);

  try {
    const results = await searchSymbols(q);
    const stocks: Stock[] = results.map((r) => {
      const meta = getStockMeta(r.symbol);
      return {
        ticker: r.symbol,
        name: r.description,
        nameKo: meta?.nameKo ?? r.description,
        exchange: "",
        sector: meta?.sector ?? "",
        price: 0,
        change: 0,
        changePct: 0,
        sparkline: [],
      };
    });
    return NextResponse.json(stocks);
  } catch {
    return NextResponse.json([], { status: 500 });
  }
}
