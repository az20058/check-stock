import { http, HttpResponse, delay } from "msw";
import { briefingData } from "./data/briefing";
import { allStocks } from "./data/stocks";
import { getReport } from "./data/reports";

const watchlistTickers = new Set([
  "NVDA", "TSLA", "AAPL", "MSFT", "GOOGL", "AMZN", "META", "AVGO", "TSM", "BRK.B",
]);

export const handlers = [
  http.get("/api/briefing", async () => {
    await delay(200);
    return HttpResponse.json(briefingData);
  }),

  http.get("/api/stocks/:ticker/report", async ({ params }) => {
    await delay(200);
    const report = getReport(params.ticker as string);
    if (!report) {
      return HttpResponse.json({ error: "Not found" }, { status: 404 });
    }
    return HttpResponse.json(report);
  }),

  http.get("/api/watchlist", async () => {
    await delay(200);
    const stocks = allStocks.filter((s) => watchlistTickers.has(s.ticker));
    const mostMentioned = [
      { ticker: "NVDA", name: "엔비디아", count: 24 },
      { ticker: "TSLA", name: "테슬라", count: 18 },
      { ticker: "MSFT", name: "마이크로소프트", count: 11 },
    ];
    return HttpResponse.json({ stocks, mostMentioned });
  }),

  http.post("/api/watchlist/:ticker", async ({ params }) => {
    const ticker = (params.ticker as string).toUpperCase();
    watchlistTickers.add(ticker);
    return HttpResponse.json({ ok: true });
  }),

  http.delete("/api/watchlist/:ticker", async ({ params }) => {
    const ticker = (params.ticker as string).toUpperCase();
    watchlistTickers.delete(ticker);
    return HttpResponse.json({ ok: true });
  }),

  http.get("/api/stocks/search", async ({ request }) => {
    await delay(100);
    const url = new URL(request.url);
    const q = (url.searchParams.get("q") || "").toLowerCase();
    if (!q) return HttpResponse.json([]);
    const results = allStocks.filter(
      (s) =>
        s.ticker.toLowerCase().includes(q) ||
        s.name.toLowerCase().includes(q) ||
        s.nameKo.includes(q),
    );
    return HttpResponse.json(results);
  }),
];
