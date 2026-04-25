import YahooFinance from "yahoo-finance2";

export interface YahooQuote {
  symbol: string;
  c: number;   // regularMarketPrice
  dp: number;  // regularMarketChangePercent
}

const yf = new YahooFinance({ suppressNotices: ["yahooSurvey"] });

export async function fetchYahooQuotes(symbols: string[]): Promise<YahooQuote[]> {
  if (symbols.length === 0) return [];

  try {
    const results = await Promise.allSettled(
      symbols.map((s) => yf.quote(s)),
    );

    const quotes: YahooQuote[] = [];
    results.forEach((r, i) => {
      if (r.status === "fulfilled" && r.value) {
        quotes.push({
          symbol: r.value.symbol ?? symbols[i],
          c: r.value.regularMarketPrice ?? 0,
          dp: r.value.regularMarketChangePercent ?? 0,
        });
      } else if (r.status === "rejected") {
        console.error(`[yahoo] quote failed for ${symbols[i]}:`, r.reason);
      }
    });

    return quotes;
  } catch (err) {
    console.error("[yahoo] fetchYahooQuotes failed:", err);
    return [];
  }
}

/** 내부 티커(005930) → Yahoo 심볼(005930.KS) 변환 */
export function toYahooSymbol(ticker: string, exchange?: string): string {
  // 숫자 6자리면 한국 종목
  if (/^\d{6}$/.test(ticker)) {
    return exchange === "KOSDAQ" ? `${ticker}.KQ` : `${ticker}.KS`;
  }
  return ticker;
}

/** KR 인덱스 심볼 */
export const KR_INDEX_SYMBOLS = [
  { label: "KOSPI", symbol: "^KS11" },
  { label: "KOSDAQ", symbol: "^KQ11" },
  { label: "USD/KRW", symbol: "KRW=X" },
];
