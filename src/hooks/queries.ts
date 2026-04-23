import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { BriefingData, StockReport, WatchlistData, Stock } from "@/types/stock";

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

export function useWatchlist() {
  return useQuery({
    queryKey: ["watchlist"],
    queryFn: () => fetchJson<WatchlistData>("/api/watchlist"),
  });
}

export function useSearchStocks(query: string) {
  return useQuery({
    queryKey: ["search", query],
    queryFn: () => fetchJson<Stock[]>(`/api/stocks/search?q=${encodeURIComponent(query)}`),
    enabled: query.length >= 1,
  });
}

export function useToggleWatchlist() {
  const queryClient = useQueryClient();

  const add = useMutation({
    mutationFn: (ticker: string) => fetch(`/api/watchlist/${ticker}`, { method: "POST" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["watchlist"] }),
  });

  const remove = useMutation({
    mutationFn: (ticker: string) => fetch(`/api/watchlist/${ticker}`, { method: "DELETE" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["watchlist"] }),
  });

  return { add, remove };
}
