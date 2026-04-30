import { describe, it, expect, vi, beforeEach } from "vitest";

const mockQuote = vi.hoisted(() => vi.fn());

vi.mock("yahoo-finance2", () => ({
  default: class {
    quote = mockQuote;
  },
}));

import { fetchYahooExtendedQuotes } from "./yahoo";

describe("fetchYahooExtendedQuotes", () => {
  beforeEach(() => {
    mockQuote.mockReset();
  });

  it("maps preMarket fields correctly", async () => {
    mockQuote.mockResolvedValueOnce({
      symbol: "SPY",
      regularMarketPrice: 700,
      regularMarketChangePercent: -0.5,
      preMarketPrice: 702,
      preMarketChangePercent: 0.3,
      marketState: "PRE",
    });

    const result = await fetchYahooExtendedQuotes(["SPY"]);

    expect(result).toEqual([
      {
        symbol: "SPY",
        c: 700,
        dp: -0.5,
        preMarketPrice: 702,
        preMarketChangePercent: 0.3,
        marketState: "PRE",
      },
    ]);
  });

  it("returns null for missing preMarket fields", async () => {
    mockQuote.mockResolvedValueOnce({
      symbol: "SPY",
      regularMarketPrice: 700,
      regularMarketChangePercent: -0.5,
    });

    const result = await fetchYahooExtendedQuotes(["SPY"]);

    expect(result[0].preMarketPrice).toBeNull();
    expect(result[0].preMarketChangePercent).toBeNull();
    expect(result[0].marketState).toBeNull();
  });

  it("skips rejected symbols and keeps fulfilled ones", async () => {
    mockQuote
      .mockRejectedValueOnce(new Error("network"))
      .mockResolvedValueOnce({
        symbol: "QQQ",
        regularMarketPrice: 600,
        regularMarketChangePercent: 1.0,
        preMarketPrice: 605,
        preMarketChangePercent: 0.8,
        marketState: "PRE",
      });

    const result = await fetchYahooExtendedQuotes(["SPY", "QQQ"]);

    expect(result).toHaveLength(1);
    expect(result[0].symbol).toBe("QQQ");
  });

  it("returns empty array when symbols list is empty", async () => {
    const result = await fetchYahooExtendedQuotes([]);
    expect(result).toEqual([]);
    expect(mockQuote).not.toHaveBeenCalled();
  });
});
