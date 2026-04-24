export interface FinnhubSearchResult {
  symbol: string;
  description: string;
  type: string;
}

export async function searchSymbols(query: string): Promise<FinnhubSearchResult[]> {
  const key = process.env.FINNHUB_API_KEY;
  if (!key) throw new Error("FINNHUB_API_KEY not set");

  const res = await fetch(
    `https://finnhub.io/api/v1/search?q=${encodeURIComponent(query)}&token=${key}`,
    { next: { revalidate: 300 } },
  );
  if (!res.ok) throw new Error(`Finnhub search ${res.status}`);

  const data = (await res.json()) as { result: FinnhubSearchResult[] };
  return (data.result ?? [])
    .filter((r) => r.type === "Common Stock")
    .slice(0, 20);
}
