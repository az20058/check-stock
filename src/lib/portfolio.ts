import type { Stock } from "@/types/stock";

export interface PortfolioStats {
  upCount: number;
  downCount: number;
  upPct: number;
}

export function portfolioStats(stocks: readonly Stock[]): PortfolioStats {
  const upCount = stocks.filter((s) => s.changePct >= 0).length;
  const downCount = stocks.length - upCount;
  const upPct = stocks.length > 0 ? Math.round((upCount / stocks.length) * 100) : 0;
  return { upCount, downCount, upPct };
}

export function sortByAbsChange(stocks: readonly Stock[]): Stock[] {
  return [...stocks].sort((a, b) => Math.abs(b.changePct) - Math.abs(a.changePct));
}

export function isWatched(
  watchlist: readonly { ticker: string }[] | undefined,
  ticker: string,
): boolean {
  if (!watchlist) return false;
  const target = ticker.toUpperCase();
  return watchlist.some((s) => s.ticker.toUpperCase() === target);
}

export function heatmapBg(pct: number): string {
  const abs = Math.abs(pct);
  const intensity = Math.min(abs / 5, 1);
  const alpha = 0.12 + intensity * 0.35;
  if (pct >= 0) {
    return `rgba(255,84,102,${alpha.toFixed(2)})`;
  }
  return `rgba(59,130,246,${alpha.toFixed(2)})`;
}
