export interface YahooQuote {
  symbol: string;
  c: number;   // regularMarketPrice
  dp: number;  // regularMarketChangePercent
}

const YAHOO_BASE = "https://query1.finance.yahoo.com/v7/finance/quote";

export async function fetchYahooQuotes(symbols: string[]): Promise<YahooQuote[]> {
  if (symbols.length === 0) return [];

  const res = await fetch(
    `${YAHOO_BASE}?symbols=${symbols.join(",")}`,
    {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; check-stock/1.0)" },
      next: { revalidate: 60 },
    },
  );
  if (!res.ok) throw new Error(`Yahoo Finance ${res.status}`);

  const json = (await res.json()) as {
    quoteResponse?: {
      result?: Array<{
        symbol: string;
        regularMarketPrice: number;
        regularMarketChangePercent: number;
      }>;
    };
  };

  return (json.quoteResponse?.result ?? []).map((q) => ({
    symbol: q.symbol,
    c: q.regularMarketPrice,
    dp: q.regularMarketChangePercent,
  }));
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
