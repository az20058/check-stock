import "server-only";
import { fetchMarketNews } from "@/lib/collectors/market-news";
import { fetchCompanyNews } from "@/lib/collectors/company-news";
import { fetchMacros } from "@/lib/collectors/macros";
import { fetchEconomicCalendar } from "@/lib/collectors/economic-calendar";
import { fetchQuotes } from "@/lib/clients/finnhub";
import { getStockMeta } from "@/lib/data/stock-meta";
import { runAiPipeline } from "@/lib/ai/pipeline";
import { startRun, finishRun, failRun } from "./storage";
import type { RawSources } from "./types";

export const MOVER_TICKERS = ["NVDA", "TSLA", "AAPL", "MSFT"] as const;

export async function runBriefing(triggeredBy: "cron" | "manual"): Promise<string> {
  const runId = await startRun(triggeredBy);
  try {
    const [marketNewsRes, macrosRes, calendarRes, quotesRes, ...companyNewsRes] =
      await Promise.allSettled([
        fetchMarketNews(15),
        fetchMacros(),
        fetchEconomicCalendar(1),
        fetchQuotes([...MOVER_TICKERS]),
        ...MOVER_TICKERS.map((t) => fetchCompanyNews(t, 4)),
      ]);

    const marketNews = marketNewsRes.status === "fulfilled" ? marketNewsRes.value : [];
    const macros = macrosRes.status === "fulfilled" ? macrosRes.value : [];
    const economicEvents =
      calendarRes.status === "fulfilled" ? calendarRes.value : [];
    const quotes = quotesRes.status === "fulfilled" ? quotesRes.value : [];
    const companyNews: Record<string, RawSources["companyNews"][string]> = {};
    MOVER_TICKERS.forEach((t, i) => {
      const r = companyNewsRes[i];
      companyNews[t] = r?.status === "fulfilled" ? r.value : [];
    });

    const sources: RawSources = {
      collectedAt: new Date().toISOString(),
      marketNews,
      companyNews,
      macros,
      economicEvents,
    };

    const movers = MOVER_TICKERS.map((t) => {
      const meta = getStockMeta(t);
      const q = quotes.find((x) => x.symbol === t);
      return {
        ticker: t,
        nameKo: meta?.nameKo ?? t,
        changePct: q?.dp ?? 0,
      };
    });

    const result = await runAiPipeline({ sources, movers });

    const status: "success" | "partial" =
      marketNews.length > 0 && macros.length > 0 ? "success" : "partial";

    await finishRun(runId, {
      status,
      sources,
      briefingData: result.briefing,
      tokenUsage: result.usage,
    });

    return runId;
  } catch (err) {
    await failRun(runId, err);
    throw err;
  }
}
