import type { TimeRange } from "@/types/stock";

interface FinnhubCandleResponse {
  c: number[];
  s: string;
}

const RESOLUTION_MAP: Record<TimeRange, { resolution: string; daysBack: number }> = {
  "1D": { resolution: "5", daysBack: 1 },
  "1W": { resolution: "30", daysBack: 7 },
  "1M": { resolution: "D", daysBack: 30 },
  "3M": { resolution: "D", daysBack: 90 },
  "1Y": { resolution: "W", daysBack: 365 },
  "ALL": { resolution: "M", daysBack: 365 * 5 },
};

export async function fetchCandles(
  symbol: string,
  range: TimeRange,
): Promise<number[]> {
  const key = process.env.FINNHUB_API_KEY;
  if (!key) throw new Error("FINNHUB_API_KEY not set");

  const { resolution, daysBack } = RESOLUTION_MAP[range];
  const to = Math.floor(Date.now() / 1000);
  const from = to - daysBack * 86400;

  const res = await fetch(
    `https://finnhub.io/api/v1/stock/candle?symbol=${encodeURIComponent(symbol)}&resolution=${resolution}&from=${from}&to=${to}&token=${key}`,
    { next: { revalidate: 300 } },
  );
  if (!res.ok) throw new Error(`Finnhub candles ${res.status}`);

  const data = (await res.json()) as FinnhubCandleResponse;
  if (data.s !== "ok" || !data.c?.length) return [];
  return data.c;
}

export async function fetchAllCandles(
  symbol: string,
): Promise<Record<TimeRange, number[]>> {
  const ranges: TimeRange[] = ["1D", "1W", "1M", "3M", "1Y", "ALL"];
  const results = await Promise.allSettled(
    ranges.map((r) => fetchCandles(symbol, r)),
  );
  const chartData: Record<string, number[]> = {};
  ranges.forEach((r, i) => {
    const res = results[i];
    chartData[r] = res.status === "fulfilled" ? res.value : [];
  });
  return chartData as Record<TimeRange, number[]>;
}
