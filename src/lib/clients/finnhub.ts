export interface FinnhubQuote {
  symbol: string;
  c: number;
  dp: number;
}

export async function fetchQuotes(symbols: string[]): Promise<FinnhubQuote[]> {
  const key = process.env.FINNHUB_API_KEY;
  if (!key) throw new Error("FINNHUB_API_KEY not set");

  const results = await Promise.allSettled(
    symbols.map(async (symbol) => {
      const url = `https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(symbol)}&token=${key}`;
      const res = await fetch(url, { next: { revalidate: 60 } });
      if (!res.ok) throw new Error(`Finnhub ${res.status} for ${symbol}`);
      const data = (await res.json()) as { c: number; dp: number };
      return { symbol, c: data.c, dp: data.dp };
    })
  );

  const fulfilled = results
    .filter(
      (r): r is PromiseFulfilledResult<FinnhubQuote> =>
        r.status === "fulfilled" && isFinite(r.value.c)
    )
    .map((r) => r.value);

  if (fulfilled.length === 0) throw new Error("All Finnhub quote fetches failed");

  return fulfilled;
}
