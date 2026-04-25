import { NextResponse } from "next/server";
import { fetchQuotes } from "@/lib/clients/finnhub";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const tickers = (url.searchParams.get("tickers") || "")
    .split(",")
    .map((t) => t.trim().toUpperCase())
    .filter(Boolean);

  if (tickers.length === 0) {
    return NextResponse.json([]);
  }

  if (tickers.length > 30) {
    return NextResponse.json(
      { error: "Too many tickers (max 30)" },
      { status: 400 },
    );
  }

  try {
    const quotes = await fetchQuotes(tickers);
    return NextResponse.json(quotes);
  } catch {
    return NextResponse.json([], { status: 500 });
  }
}
