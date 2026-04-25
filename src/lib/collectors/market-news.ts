export interface MarketNewsItem {
  headline: string;
  source: string;
  datetime: number;
  summary: string;
  url: string;
}

export async function fetchMarketNews(limit = 15): Promise<MarketNewsItem[]> {
  const key = process.env.FINNHUB_API_KEY;
  if (!key) return [];
  try {
    const res = await fetch(
      `https://finnhub.io/api/v1/news?category=general`,
      {
        headers: { "X-Finnhub-Token": key },
        next: { revalidate: 1800 },
      },
    );
    if (!res.ok) return [];
    const data = (await res.json()) as MarketNewsItem[];
    return data
      .sort((a, b) => b.datetime - a.datetime)
      .slice(0, limit)
      .map((n) => ({
        headline: n.headline,
        source: n.source,
        datetime: n.datetime,
        summary: n.summary,
        url: n.url,
      }));
  } catch {
    return [];
  }
}
