import { useQuery } from "@tanstack/react-query";
import type { BriefingData, StockReport, Stock } from "@/types/stock";
import type { FinnhubQuote } from "@/lib/clients/finnhub";

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json() as Promise<T>;
}

export function useBriefing() {
  return useQuery({
    queryKey: ["briefing"],
    queryFn: () => fetchJson<BriefingData>("/api/briefing"),
  });
}

export function useStockReport(ticker: string) {
  return useQuery({
    queryKey: ["report", ticker],
    queryFn: () => fetchJson<StockReport>(`/api/stocks/${ticker}/report`),
    enabled: !!ticker,
  });
}

export function useSearchStocks(query: string) {
  return useQuery({
    queryKey: ["search", query],
    queryFn: () => fetchJson<Stock[]>(`/api/stocks/search?q=${encodeURIComponent(query)}`),
    enabled: query.length >= 1,
  });
}

export function useStockQuotes(tickers: string[]) {
  return useQuery({
    queryKey: ["quotes", tickers.join(",")],
    queryFn: () =>
      fetchJson<FinnhubQuote[]>(
        `/api/stocks/quotes?tickers=${tickers.join(",")}`,
      ),
    enabled: tickers.length > 0,
    refetchInterval: 60_000,
  });
}
