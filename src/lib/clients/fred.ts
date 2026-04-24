export interface FredObservation {
  date: string;
  value: number;
}

interface FredResponse {
  observations: { date: string; value: string }[];
}

export async function fetchLatestObservations(
  seriesId: string,
  limit = 2,
): Promise<FredObservation[]> {
  const key = process.env.FRED_API_KEY;
  if (!key) throw new Error("FRED_API_KEY not set");
  const url = `https://api.stlouisfed.org/fred/series/observations?series_id=${encodeURIComponent(
    seriesId,
  )}&api_key=${key}&file_type=json&limit=${limit}&sort_order=desc`;
  const res = await fetch(url, { next: { revalidate: 3600 } });
  if (!res.ok) throw new Error(`FRED ${res.status} for ${seriesId}`);
  const data = (await res.json()) as FredResponse;
  return data.observations
    .map((o) => ({ date: o.date, value: Number(o.value) }))
    .filter((o) => Number.isFinite(o.value));
}
