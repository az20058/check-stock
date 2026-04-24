import { describe, it, expect } from "vitest";
import { portfolioStats, sortByAbsChange, isWatched, heatmapBg } from "./portfolio";
import type { Stock } from "@/types/stock";

function stub(ticker: string, changePct: number): Stock {
  return {
    ticker,
    name: ticker,
    nameKo: ticker,
    market: "US",
    exchange: "NASDAQ",
    currency: "USD",
    sector: "Tech",
    price: 100,
    change: 0,
    changePct,
    sparkline: [1, 2, 3],
  };
}

describe("portfolioStats (P1)", () => {
  it("상승/하락/비율을 계산한다", () => {
    const stocks = [stub("A", 1), stub("B", -1), stub("C", 2), stub("D", -3)];
    expect(portfolioStats(stocks)).toEqual({ upCount: 2, downCount: 2, upPct: 50 });
  });

  it("0%는 상승으로 분류한다 (>= 0)", () => {
    const stocks = [stub("A", 0), stub("B", -1)];
    expect(portfolioStats(stocks)).toEqual({ upCount: 1, downCount: 1, upPct: 50 });
  });

  it("빈 배열에서 NaN/Infinity 없이 0을 반환한다", () => {
    expect(portfolioStats([])).toEqual({ upCount: 0, downCount: 0, upPct: 0 });
  });

  it("전부 상승일 때 upPct가 100", () => {
    const stocks = [stub("A", 1), stub("B", 2)];
    expect(portfolioStats(stocks)).toEqual({ upCount: 2, downCount: 0, upPct: 100 });
  });

  it("전부 하락일 때 upPct가 0", () => {
    const stocks = [stub("A", -1), stub("B", -2)];
    expect(portfolioStats(stocks)).toEqual({ upCount: 0, downCount: 2, upPct: 0 });
  });

  it("반올림으로 upPct 100% 넘지 않는다 (3종목 중 2개 상승 = 67)", () => {
    const stocks = [stub("A", 1), stub("B", 1), stub("C", -1)];
    expect(portfolioStats(stocks).upPct).toBe(67);
  });
});

describe("sortByAbsChange (P1)", () => {
  it("변동률 절대값 내림차순으로 정렬한다", () => {
    const stocks = [stub("A", 1), stub("B", -5), stub("C", 3)];
    const sorted = sortByAbsChange(stocks);
    expect(sorted.map((s) => s.ticker)).toEqual(["B", "C", "A"]);
  });

  it("원본 배열을 변경하지 않는다 (순수 함수)", () => {
    const stocks = [stub("A", 1), stub("B", -5)];
    const before = stocks.map((s) => s.ticker);
    sortByAbsChange(stocks);
    expect(stocks.map((s) => s.ticker)).toEqual(before);
  });

  it("빈 배열은 빈 배열을 반환한다", () => {
    expect(sortByAbsChange([])).toEqual([]);
  });
});

describe("isWatched (P1)", () => {
  const wl = [stub("NVDA", 0), stub("AAPL", 0)];

  it("일치하면 true", () => {
    expect(isWatched(wl, "NVDA")).toBe(true);
  });

  it("대소문자 구분 없이 비교한다", () => {
    expect(isWatched(wl, "nvda")).toBe(true);
    expect(isWatched(wl, "Aapl")).toBe(true);
  });

  it("없으면 false", () => {
    expect(isWatched(wl, "TSLA")).toBe(false);
  });

  it("watchlist가 undefined면 false (로딩 중 시나리오)", () => {
    expect(isWatched(undefined, "NVDA")).toBe(false);
  });

  it("빈 watchlist에서 false", () => {
    expect(isWatched([], "NVDA")).toBe(false);
  });
});

describe("heatmapBg (P2)", () => {
  it("양수는 빨강 계열 (rgba 255,84,102)", () => {
    expect(heatmapBg(1)).toMatch(/^rgba\(255,84,102,/);
  });

  it("음수는 파랑 계열 (rgba 59,130,246)", () => {
    expect(heatmapBg(-1)).toMatch(/^rgba\(59,130,246,/);
  });

  it("0은 양수 처리 (>= 0)", () => {
    expect(heatmapBg(0)).toMatch(/^rgba\(255,84,102,/);
  });

  it("절대값이 클수록 알파가 커진다 (상한 0.47)", () => {
    const small = heatmapBg(0.1);
    const big = heatmapBg(10);
    const alpha = (s: string) => parseFloat(s.match(/,([0-9.]+)\)$/)![1]);
    expect(alpha(small)).toBeLessThan(alpha(big));
    expect(alpha(big)).toBeCloseTo(0.47, 2);
  });

  it("변동률 |5| 이상에서 알파가 포화된다", () => {
    expect(heatmapBg(5)).toBe(heatmapBg(10));
    expect(heatmapBg(-5)).toBe(heatmapBg(-100));
  });
});
