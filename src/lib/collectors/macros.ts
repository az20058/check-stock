import { fetchLatestObservations } from "@/lib/clients/fred";
import type { MacroItem } from "@/types/stock";

interface MacroSpec {
  label: string;
  seriesId: string;
  format: (v: number) => string;
  formatDelta: (diff: number) => string;
}

const SPECS: MacroSpec[] = [
  {
    label: "10Y Treasury",
    seriesId: "DGS10",
    format: (v) => `${v.toFixed(2)}%`,
    formatDelta: (d) => `${d >= 0 ? "+" : ""}${(d * 100).toFixed(0)}bp`,
  },
  {
    label: "DXY (달러)",
    seriesId: "DTWEXBGS",
    format: (v) => v.toFixed(2),
    formatDelta: (d) => `${d >= 0 ? "+" : ""}${d.toFixed(2)}%`,
  },
  {
    label: "WTI 원유",
    seriesId: "DCOILWTICO",
    format: (v) => `$${v.toFixed(2)}`,
    formatDelta: (d) => `${d >= 0 ? "+" : ""}${d.toFixed(2)}%`,
  },
];

export async function fetchMacros(): Promise<MacroItem[]> {
  const results = await Promise.allSettled(
    SPECS.map(async (spec) => {
      const obs = await fetchLatestObservations(spec.seriesId, 2);
      if (obs.length === 0) return null;
      const [latest, prev] = obs;
      const value = spec.format(latest.value);
      let delta = "—";
      let up = false;
      if (prev && Number.isFinite(prev.value)) {
        const diff =
          spec.seriesId === "DGS10"
            ? latest.value - prev.value
            : ((latest.value - prev.value) / prev.value) * 100;
        delta = spec.formatDelta(diff);
        up = diff >= 0;
      }
      return { label: spec.label, value, delta, up } satisfies MacroItem;
    }),
  );

  return results
    .filter((r): r is PromiseFulfilledResult<MacroItem | null> => r.status === "fulfilled")
    .map((r) => r.value)
    .filter((v): v is MacroItem => v !== null);
}
