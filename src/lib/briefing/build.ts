import "server-only";
import { fetchMarketNews } from "@/lib/collectors/market-news";
import { fetchCompanyNews } from "@/lib/collectors/company-news";
import { fetchMacros } from "@/lib/collectors/macros";
import { fetchEconomicCalendar } from "@/lib/collectors/economic-calendar";
import { fetchKoreanNews, fetchKoreanMarketNews } from "@/lib/collectors/korean-news";
import { fetchQuotes } from "@/lib/clients/finnhub";
import { fetchYahooQuotes, toYahooSymbol } from "@/lib/clients/yahoo";
import { getStockMeta } from "@/lib/data/stock-meta";
import { runAiPipeline } from "@/lib/ai/pipeline";
import { startRun, finishRun, failRun } from "./storage";
import type { RawSources, KrRawSources } from "./types";

export const US_MOVER_TICKERS = ["NVDA", "TSLA", "AAPL", "MSFT"] as const;
export const KR_MOVER_TICKERS = ["005930", "000660", "035420", "005380"] as const;

/** @deprecated Use US_MOVER_TICKERS */
export const MOVER_TICKERS = US_MOVER_TICKERS;

export async function runBriefing(triggeredBy: "cron" | "manual"): Promise<string> {
  const runId = await startRun(triggeredBy);
  try {
    // Collect US and KR sources in parallel
    const [
      usCollectionRes,
      krCollectionRes,
    ] = await Promise.all([
      // US 수집
      Promise.allSettled([
        fetchMarketNews(15),
        fetchKoreanNews(20),
        fetchMacros(),
        fetchEconomicCalendar(1),
        fetchQuotes([...US_MOVER_TICKERS]),
        ...US_MOVER_TICKERS.map((t) => fetchCompanyNews(t, 4)),
      ]),
      // KR 수집
      Promise.allSettled([
        fetchKoreanMarketNews(20),
        fetchMacros(),
        fetchYahooQuotes(KR_MOVER_TICKERS.map((t) => toYahooSymbol(t, getStockMeta(t)?.exchange))),
      ]),
    ]);

    // US 결과 언패킹
    const [marketNewsRes, koreanNewsRes, macrosRes, calendarRes, usQuotesRes, ...usCompanyNewsRes] =
      usCollectionRes;

    const marketNews = marketNewsRes.status === "fulfilled" ? marketNewsRes.value : [];
    const koreanNews = koreanNewsRes.status === "fulfilled" ? koreanNewsRes.value : [];
    const macros = macrosRes.status === "fulfilled" ? macrosRes.value : [];
    const economicEvents = calendarRes.status === "fulfilled" ? calendarRes.value : [];
    const usQuotes = usQuotesRes.status === "fulfilled" ? usQuotesRes.value : [];
    const usCompanyNews: Record<string, RawSources["companyNews"][string]> = {};
    US_MOVER_TICKERS.forEach((t, i) => {
      const r = usCompanyNewsRes[i];
      usCompanyNews[t] = r?.status === "fulfilled" ? r.value : [];
    });

    const usSources: RawSources = {
      collectedAt: new Date().toISOString(),
      marketNews,
      koreanNews,
      companyNews: usCompanyNews,
      macros,
      economicEvents,
    };

    // KR 결과 언패킹
    const [krNewsRes, krMacrosRes, krQuotesRes] = krCollectionRes;

    const krMarketNews = krNewsRes.status === "fulfilled" ? krNewsRes.value : [];
    const krMacros = krMacrosRes.status === "fulfilled" ? krMacrosRes.value : macros;
    const krQuotes = krQuotesRes.status === "fulfilled" ? krQuotesRes.value : [];

    const krSources: KrRawSources = {
      collectedAt: new Date().toISOString(),
      koreanMarketNews: krMarketNews,
      companyNews: {},  // KR 종목별 뉴스는 추후 추가
      macros: krMacros,
    };

    // 무버 메타 구성
    const usMovers = US_MOVER_TICKERS.map((t) => {
      const meta = getStockMeta(t);
      const q = usQuotes.find((x) => x.symbol === t);
      return { ticker: t, nameKo: meta?.nameKo ?? t, changePct: q?.dp ?? 0 };
    });

    const krMovers = KR_MOVER_TICKERS.map((t) => {
      const meta = getStockMeta(t);
      const yahooSym = toYahooSymbol(t, meta?.exchange);
      const q = krQuotes.find((x) => x.symbol === yahooSym);
      return { ticker: t, nameKo: meta?.nameKo ?? t, changePct: q?.dp ?? 0 };
    });

    const result = await runAiPipeline({ usSources, krSources, usMovers, krMovers });

    const status: "success" | "partial" =
      marketNews.length > 0 && macros.length > 0 ? "success" : "partial";

    await finishRun(runId, {
      status,
      sources: usSources,
      krSources,
      briefingData: result,
      tokenUsage: result.usage,
    });

    return runId;
  } catch (err) {
    await failRun(runId, err);
    throw err;
  }
}
