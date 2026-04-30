import { describe, it, expect } from "vitest";
import { buildUsPreMarketUser, type PreMarketSnapshot } from "./prompts";

const baseArgs = {
  news: [
    { source: "Reuters", headline: "Headline 1", datetime: 0, summary: "", url: "" },
  ],
  koreanNews: [
    { source: "한경", title: "한국 뉴스 1", pubDate: "" },
  ],
  macros: [{ label: "10Y", value: "4.36%", delta: "+1bp", up: true }],
  dateLabel: "4월 30일 목요일 · 장 시작 전 · 프리마켓",
  prevIndices: [{ label: "S&P 500", value: 711.58, changePct: -0.0155 }],
  prevMovers: [{ ticker: "NVDA", nameKo: "엔비디아", changePct: -1.84 }],
  economicEvents: [
    {
      country: "US",
      event: "Core PCE",
      time: "2026-04-30 12:30:00",
      impact: "high",
      estimate: 0.3,
      prev: 0.4,
    },
  ],
};

describe("buildUsPreMarketUser", () => {
  it("includes all four labeled sections", () => {
    const snap: PreMarketSnapshot[] = [
      {
        label: "S&P 500",
        ticker: "SPY",
        prevClose: 711.58,
        preMarketChangePct: 0.3,
        marketState: "PRE",
      },
    ];
    const result = buildUsPreMarketUser({ ...baseArgs, preMarketSnapshot: snap });

    expect(result).toContain("[전일 미국장 마감 결과 — 회고용 참고]");
    expect(result).toContain('[현재 프리마켓 동향 — "지금" 시점]');
    expect(result).toContain("[오늘 발표 예정 경제 이벤트 — UTC 시각]");
    expect(result).toContain("[관련 뉴스 헤드라인]");
  });

  it("formats prev indices and movers with sign and percent", () => {
    const result = buildUsPreMarketUser({ ...baseArgs, preMarketSnapshot: [] });
    expect(result).toContain("S&P 500: 711.58 (-0.02%)");
    expect(result).toContain("엔비디아 (NVDA): -1.84%");
  });

  it("renders preMarket line with marketState when present", () => {
    const snap: PreMarketSnapshot[] = [
      {
        label: "S&P 500",
        ticker: "SPY",
        prevClose: 711.58,
        preMarketChangePct: 0.3,
        marketState: "PRE",
      },
    ];
    const result = buildUsPreMarketUser({ ...baseArgs, preMarketSnapshot: snap });
    expect(result).toContain("S&P 500 (SPY): 프리마켓 +0.30% (marketState=PRE)");
  });

  it("falls back when preMarketSnapshot is empty", () => {
    const result = buildUsPreMarketUser({ ...baseArgs, preMarketSnapshot: [] });
    expect(result).toContain("(수집 실패 또는 미수집)");
  });

  it("falls back when preMarketSnapshot is undefined", () => {
    const result = buildUsPreMarketUser({ ...baseArgs });
    expect(result).toContain("(수집 실패 또는 미수집)");
  });

  it("marks individual missing preMarket prices", () => {
    const snap: PreMarketSnapshot[] = [
      {
        label: "엔비디아",
        ticker: "NVDA",
        prevClose: 209.25,
        preMarketChangePct: null,
        marketState: "REGULAR",
      },
    ];
    const result = buildUsPreMarketUser({ ...baseArgs, preMarketSnapshot: snap });
    expect(result).toContain("엔비디아 (NVDA): 프리마켓 호가 미수집");
  });

  it("instructs the model to avoid yesterday-recap framing", () => {
    const result = buildUsPreMarketUser({ ...baseArgs });
    expect(result).toContain("오늘 밤");
    expect(result).toMatch(/"어제.*마감".*시작.*금지/);
  });
});
