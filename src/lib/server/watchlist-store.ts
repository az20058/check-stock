const INITIAL_TICKERS = [
  "NVDA",
  "TSLA",
  "AAPL",
  "MSFT",
  "GOOGL",
  "AMZN",
  "META",
  "AVGO",
  "TSM",
  "BRK.B",
];

const globalKey = Symbol.for("check-stock.watchlist");
type GlobalWithStore = typeof globalThis & { [globalKey]?: Set<string> };
const g = globalThis as GlobalWithStore;

if (!g[globalKey]) {
  g[globalKey] = new Set(INITIAL_TICKERS);
}

export const watchlistTickers: Set<string> = g[globalKey]!;
