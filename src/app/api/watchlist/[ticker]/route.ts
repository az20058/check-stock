import { NextResponse } from "next/server";
import { watchlistTickers } from "@/lib/server/watchlist-store";

export async function POST(
  _: Request,
  { params }: { params: Promise<{ ticker: string }> },
) {
  const { ticker } = await params;
  watchlistTickers.add(ticker.toUpperCase());
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _: Request,
  { params }: { params: Promise<{ ticker: string }> },
) {
  const { ticker } = await params;
  watchlistTickers.delete(ticker.toUpperCase());
  return NextResponse.json({ ok: true });
}
