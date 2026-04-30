import "server-only";
import { fetchMarketNews } from "@/lib/collectors/market-news";
import { fetchCompanyNews } from "@/lib/collectors/company-news";
import { fetchMacros } from "@/lib/collectors/macros";
import { fetchEconomicCalendar } from "@/lib/collectors/economic-calendar";
import { fetchKoreanNews, fetchKoreanMarketNews } from "@/lib/collectors/korean-news";
import { fetchQuotes } from "@/lib/clients/finnhub";
import type { FinnhubQuote } from "@/lib/clients/finnhub";
import {
  fetchYahooQuotes,
  fetchYahooExtendedQuotes,
  toYahooSymbol,
  KR_INDEX_SYMBOLS,
} from "@/lib/clients/yahoo";
import type { YahooQuote } from "@/lib/clients/yahoo";
import { getStockMeta, inferMarket } from "@/lib/data/stock-meta";
import { runAiPipeline } from "@/lib/ai/pipeline";
import type { PreMarketSnapshot } from "@/lib/ai/prompts";
import { startRun, finishRun, failRun } from "./storage";
import type { RawSources, KrRawSources } from "./types";
import type { BriefingSession, MarketBriefing } from "@/types/stock";

export const US_MOVER_TICKERS = ["NVDA", "TSLA", "AAPL", "MSFT"] as const;
export const KR_MOVER_TICKERS = ["005930", "000660", "035420", "005380"] as const;

/** @deprecated Use US_MOVER_TICKERS */
export const MOVER_TICKERS = US_MOVER_TICKERS;

const US_INDEX_SYMBOLS = [
  { label: "S&P 500", symbol: "SPY" },
  { label: "NASDAQ", symbol: "QQQ" },
  { label: "DOW", symbol: "DIA" },
  { label: "VIX", symbol: "^VIX" },
];

export async function runBriefing(triggeredBy: "cron" | "manual", session: BriefingSession): Promise<string> {
  const runId = await startRun(triggeredBy, session);
  try {
    const isUS = session === "us_close" || session === "us_pre";
    const isKR = session === "kr_close";

    // 시세 데이터 — 배치 시점 스냅샷으로 DB에 저장
    let usQuotes: FinnhubQuote[] = [];
    let krQuotes: YahooQuote[] = [];

    // US 데이터 수집
    let usSources: RawSources = {
      collectedAt: new Date().toISOString(),
      marketNews: [], koreanNews: [], companyNews: {}, macros: [], economicEvents: [],
    };
    let usMovers: { ticker: string; nameKo: string; changePct: number }[] = [];
    let preMarketSnapshot: PreMarketSnapshot[] = [];

    if (isUS) {
      const yahooPreSymbols = session === "us_pre"
        ? [...US_INDEX_SYMBOLS.map((x) => x.symbol), ...US_MOVER_TICKERS]
        : [];

      const usCollectionRes = await Promise.allSettled([
        fetchMarketNews(15),
        fetchKoreanNews(20),
        fetchMacros(),
        fetchEconomicCalendar(1),
        fetchQuotes([...US_INDEX_SYMBOLS.map((x) => x.symbol), ...US_MOVER_TICKERS]),
        fetchYahooExtendedQuotes(yahooPreSymbols),
        ...US_MOVER_TICKERS.map((t) => fetchCompanyNews(t, 4)),
      ]);

      const [
        marketNewsRes,
        koreanNewsRes,
        macrosRes,
        calendarRes,
        usQuotesRes,
        yahooPreRes,
        ...usCompanyNewsRes
      ] = usCollectionRes;

      // 실패한 collector 로깅
      const usLabels = [
        "marketNews",
        "koreanNews",
        "macros",
        "economicCalendar",
        "usQuotes",
        "yahooPreMarket",
        ...US_MOVER_TICKERS.map((t) => `companyNews:${t}`),
      ];
      usCollectionRes.forEach((r, i) => {
        if (r.status === "rejected") {
          console.error(`[briefing] US collector "${usLabels[i]}" failed:`, r.reason);
        }
      });

      const marketNews = marketNewsRes.status === "fulfilled" ? marketNewsRes.value : [];
      const koreanNews = koreanNewsRes.status === "fulfilled" ? koreanNewsRes.value : [];
      const macros = macrosRes.status === "fulfilled" ? macrosRes.value : [];
      const economicEvents = calendarRes.status === "fulfilled" ? calendarRes.value : [];
      usQuotes = usQuotesRes.status === "fulfilled" ? usQuotesRes.value : [];
      const usCompanyNews: Record<string, RawSources["companyNews"][string]> = {};
      US_MOVER_TICKERS.forEach((t, i) => {
        const r = usCompanyNewsRes[i];
        usCompanyNews[t] = r?.status === "fulfilled" ? r.value : [];
      });

      const yahooPreQuotes = yahooPreRes.status === "fulfilled" ? yahooPreRes.value : [];
      preMarketSnapshot = yahooPreQuotes.map((q) => {
        const idxLabel = US_INDEX_SYMBOLS.find((x) => x.symbol === q.symbol)?.label;
        const meta = idxLabel ? null : getStockMeta(q.symbol);
        return {
          label: idxLabel ?? meta?.nameKo ?? q.symbol,
          ticker: q.symbol,
          prevClose: q.c,
          preMarketChangePct: q.preMarketChangePercent,
          marketState: q.marketState,
        };
      });

      usSources = {
        collectedAt: new Date().toISOString(),
        marketNews,
        koreanNews,
        companyNews: usCompanyNews,
        macros,
        economicEvents,
      };

      usMovers = US_MOVER_TICKERS.map((t) => {
        const meta = getStockMeta(t);
        const q = usQuotes.find((x) => x.symbol === t);
        return { ticker: t, nameKo: meta?.nameKo ?? t, changePct: q?.dp ?? 0 };
      });
    }

    // KR 데이터 수집
    let krSources: KrRawSources = {
      collectedAt: new Date().toISOString(),
      koreanMarketNews: [], companyNews: {}, macros: [],
    };
    let krMovers: { ticker: string; nameKo: string; changePct: number }[] = [];

    if (isKR) {
      const krCollectionRes = await Promise.allSettled([
        fetchKoreanMarketNews(20),
        fetchMacros(),
        fetchYahooQuotes([
          ...KR_INDEX_SYMBOLS.map((x) => x.symbol),
          ...KR_MOVER_TICKERS.map((t) => toYahooSymbol(t, getStockMeta(t)?.exchange)),
        ]),
      ]);

      const [krNewsRes, krMacrosRes, krQuotesRes] = krCollectionRes;

      // 실패한 collector 로깅
      const krLabels = ["koreanMarketNews", "macros", "yahooQuotes"];
      krCollectionRes.forEach((r, i) => {
        if (r.status === "rejected") {
          console.error(`[briefing] KR collector "${krLabels[i]}" failed:`, r.reason);
        }
      });

      const krMarketNews = krNewsRes.status === "fulfilled" ? krNewsRes.value : [];
      const krMacros = krMacrosRes.status === "fulfilled" ? krMacrosRes.value : [];
      krQuotes = krQuotesRes.status === "fulfilled" ? krQuotesRes.value : [];

      krSources = {
        collectedAt: new Date().toISOString(),
        koreanMarketNews: krMarketNews,
        companyNews: {},  // KR 종목별 뉴스는 추후 추가
        macros: krMacros,
      };

      krMovers = KR_MOVER_TICKERS.map((t) => {
        const meta = getStockMeta(t);
        const yahooSym = toYahooSymbol(t, meta?.exchange);
        const q = krQuotes.find((x) => x.symbol === yahooSym);
        return { ticker: t, nameKo: meta?.nameKo ?? t, changePct: q?.dp ?? 0 };
      });
    }

    const prevIndicesForPre =
      session === "us_pre"
        ? US_INDEX_SYMBOLS.map(({ label, symbol }) => {
            const q = usQuotes.find((x) => x.symbol === symbol);
            return { label, value: q?.c ?? 0, changePct: q?.dp ?? 0 };
          })
        : undefined;

    const result = await runAiPipeline({
      usSources,
      krSources,
      usMovers,
      krMovers,
      session,
      preMarketSnapshot: session === "us_pre" ? preMarketSnapshot : undefined,
      prevIndicesForPre,
    });

    // 시세 스냅샷으로 enriched MarketBriefing 구성 (API에서 실시간 fetch 불필요)
    const usQuoteMap = new Map(usQuotes.map((q) => [q.symbol, q]));
    const krQuoteMap = new Map(krQuotes.map((q) => [q.symbol, q]));

    const enrichedUs: MarketBriefing = {
      market: "US",
      dateLabel: result.us.dateLabel,
      headline: result.us.headline,
      headlineAccent: result.us.headlineAccent,
      indices: US_INDEX_SYMBOLS.map(({ label, symbol }) => {
        const q = usQuoteMap.get(symbol);
        return { label, value: q?.c ?? 0, changePct: q?.dp ?? 0 };
      }),
      summary: result.us.summary,
      movers: result.us.movers.map((m) => {
        const q = usQuoteMap.get(m.ticker);
        const meta = getStockMeta(m.ticker);
        const market = meta?.market ?? inferMarket(m.ticker);
        const currency = meta?.currency ?? "USD";
        const price = q?.c ?? 0;
        const changePct = q?.dp ?? 0;
        const change = price - price / (1 + changePct / 100);
        return {
          ticker: m.ticker, name: meta?.nameKo ?? m.ticker, nameKo: meta?.nameKo ?? m.ticker,
          market, exchange: meta?.exchange ?? "", currency, sector: meta?.sector ?? "",
          price, change, changePct, sparkline: [] as number[], reason: m.reason,
        };
      }),
      macros: result.us.macros,
      events: result.us.events,
      causes: result.us.causes,
    };

    const enrichedKr: MarketBriefing = {
      market: "KR",
      dateLabel: result.kr.dateLabel,
      headline: result.kr.headline,
      headlineAccent: result.kr.headlineAccent,
      indices: KR_INDEX_SYMBOLS.map(({ label, symbol }) => {
        const q = krQuoteMap.get(symbol);
        return { label, value: q?.c ?? 0, changePct: q?.dp ?? 0 };
      }),
      summary: result.kr.summary,
      movers: result.kr.movers.map((m) => {
        const meta = getStockMeta(m.ticker);
        const market = meta?.market ?? inferMarket(m.ticker);
        const currency = meta?.currency ?? "KRW";
        const yahooSym = toYahooSymbol(m.ticker, meta?.exchange);
        const q = krQuoteMap.get(yahooSym);
        const price = q?.c ?? 0;
        const changePct = q?.dp ?? 0;
        const change = price - price / (1 + changePct / 100);
        return {
          ticker: m.ticker, name: meta?.nameKo ?? m.ticker, nameKo: meta?.nameKo ?? m.ticker,
          market, exchange: meta?.exchange ?? "", currency, sector: meta?.sector ?? "",
          price, change, changePct, sparkline: [] as number[], reason: m.reason,
        };
      }),
      macros: result.kr.macros,
      events: result.kr.events,
      causes: result.kr.causes,
    };

    const status: "success" | "partial" =
      (isUS && (usSources.marketNews.length > 0 && usSources.macros.length > 0)) ||
      (isKR && (krSources.koreanMarketNews.length > 0 && krSources.macros.length > 0))
        ? "success" : "partial";

    await finishRun(runId, {
      status,
      sources: usSources,
      krSources,
      briefingData: { us: enrichedUs, kr: enrichedKr },
      tokenUsage: result.usage,
    });

    return runId;
  } catch (err) {
    await failRun(runId, err);
    throw err;
  }
}
