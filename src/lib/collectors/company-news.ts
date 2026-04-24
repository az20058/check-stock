export interface CompanyNewsItem {
  ticker: string;
  headline: string;
  summary: string;
  datetime: number;
  source: string;
}

function toYmd(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export async function fetchCompanyNews(
  ticker: string,
  limit = 3,
): Promise<CompanyNewsItem[]> {
  const key = process.env.FINNHUB_API_KEY;
  if (!key) return [];
  const to = new Date();
  const from = new Date(to.getTime() - 3 * 24 * 3600 * 1000);
  try {
    const res = await fetch(
      `https://finnhub.io/api/v1/company-news?symbol=${encodeURIComponent(
        ticker,
      )}&from=${toYmd(from)}&to=${toYmd(to)}&token=${key}`,
      { next: { revalidate: 1800 } },
    );
    if (!res.ok) return [];
    const data = (await res.json()) as Array<{
      headline: string;
      summary: string;
      datetime: number;
      source: string;
    }>;
    return data
      .sort((a, b) => b.datetime - a.datetime)
      .slice(0, limit)
      .map((n) => ({
        ticker,
        headline: n.headline,
        summary: n.summary,
        datetime: n.datetime,
        source: n.source,
      }));
  } catch {
    return [];
  }
}
