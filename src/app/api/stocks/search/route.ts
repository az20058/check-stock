import { NextResponse } from "next/server";
import { allStocks } from "@/mocks/data/stocks";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const q = (url.searchParams.get("q") || "").toLowerCase();
  if (!q) return NextResponse.json([]);
  const results = allStocks.filter(
    (s) =>
      s.ticker.toLowerCase().includes(q) ||
      s.name.toLowerCase().includes(q) ||
      s.nameKo.includes(q),
  );
  return NextResponse.json(results);
}
