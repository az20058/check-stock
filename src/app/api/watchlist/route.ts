import { NextResponse } from "next/server";
import { allStocks } from "@/mocks/data/stocks";
import { watchlistTickers } from "@/lib/server/watchlist-store";

export async function GET() {
  const stocks = allStocks.filter((s) => watchlistTickers.has(s.ticker));
  const mostMentioned = [
    { ticker: "NVDA", name: "엔비디아", count: 24 },
    { ticker: "TSLA", name: "테슬라", count: 18 },
    { ticker: "MSFT", name: "마이크로소프트", count: 11 },
  ];
  return NextResponse.json({ stocks, mostMentioned });
}
