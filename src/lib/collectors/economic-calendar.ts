export interface EconomicEvent {
  country: string;
  event: string;
  time: string;
  impact: string;
  estimate: number | null;
  prev: number | null;
}

function toYmd(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export async function fetchEconomicCalendar(
  daysAhead = 1,
): Promise<EconomicEvent[]> {
  const key = process.env.FINNHUB_API_KEY;
  if (!key) return [];
  const from = new Date();
  const to = new Date(from.getTime() + daysAhead * 24 * 3600 * 1000);
  try {
    const res = await fetch(
      `https://finnhub.io/api/v1/calendar/economic?from=${toYmd(
        from,
      )}&to=${toYmd(to)}&token=${key}`,
      { next: { revalidate: 3600 } },
    );
    if (!res.ok) return [];
    const data = (await res.json()) as {
      economicCalendar?: Array<{
        country?: string;
        event?: string;
        time?: string;
        impact?: string;
        estimate?: number | null;
        prev?: number | null;
      }>;
    };
    const events = data.economicCalendar ?? [];
    return events
      .filter((e) => e.country === "US" && (e.impact === "high" || e.impact === "medium"))
      .map((e) => ({
        country: e.country ?? "",
        event: e.event ?? "",
        time: e.time ?? "",
        impact: e.impact ?? "",
        estimate: e.estimate ?? null,
        prev: e.prev ?? null,
      }));
  } catch {
    return [];
  }
}
