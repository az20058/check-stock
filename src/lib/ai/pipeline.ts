import "server-only";
import { callClaudeJson } from "@/lib/clients/anthropic";
import type { BriefingSession } from "@/types/stock";

/** Haiku가 schema를 어겨 summary를 stringify하거나 headline에 XML을 섞는 경우를 정상화 */
function sanitizeRawSummary(raw: Record<string, unknown>): Record<string, unknown> {
  const headline = typeof raw.headline === "string" ? raw.headline : "";
  const cleaned = headline.replace(/<[^>]*>/g, "").replace(/\\n/g, " ").replace(/"+$/, "").trim();

  // summary가 stringify된 JSON으로 온 경우 객체로 복구
  let summary: unknown = raw.summary;
  if (typeof summary === "string") {
    try {
      const parsed = JSON.parse(summary);
      if (parsed && typeof parsed === "object") summary = parsed;
    } catch {
      // JSON.parse 실패 — 그대로 두고 zod에서 명확히 reject
    }
  }

  return { ...raw, headline: cleaned || headline, summary };
}
import {
  marketSummarySystem,
  krMarketSummarySystem,
  usPreMarketSystem,
  buildMarketSummaryUser,
  buildKrMarketSummaryUser,
  buildUsPreMarketUser,
  moverReasonSystem,
  buildMoverReasonUser,
  eventsSystem,
  buildEventsUser,
} from "./prompts";
import {
  marketSummarySchema,
  moverReasonSchema,
  eventsSchema,
  marketSummaryJsonSchema,
  moverReasonJsonSchema,
  eventsJsonSchema,
  type MarketSummary,
  type MoverReason,
  type EventsOutput,
} from "@/lib/briefing/schema";
import type { RawSources, KrRawSources, TokenUsage } from "@/lib/briefing/types";
import type { MacroItem } from "@/types/stock";
import { retrieve } from "@/lib/rag/retrieve";
import { getStockMeta } from "@/lib/data/stock-meta";
import { kstToInstant } from "@/lib/utils/datetime";
import type { CompanyNewsItem } from "@/lib/collectors/company-news";

export interface MoverMeta {
  ticker: string;
  nameKo: string;
  changePct: number;
}

export interface MarketBriefingPipeline {
  dateLabel: string;
  headline: string;
  headlineAccent: string;
  summary: MarketSummary["summary"];
  causes: MarketSummary["causes"];
  movers: { ticker: string; reason: string }[];
  events: EventsOutput["events"];
  macros: MacroItem[];
}

export interface PipelineOutput {
  us: MarketBriefingPipeline;
  kr: MarketBriefingPipeline;
  usage: TokenUsage;
}

function toDateLabel(iso: string, session: BriefingSession): string {
  // iso는 KST wall-clock 문자열("YYYY-MM-DDTHH:mm:ss[.sss]"), offset 없음.
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return "";
  const [, y, mo, da] = m;
  // 요일은 KST 날짜 기준. UTC midnight Date를 만들어 getUTCDay로 계산하면 안전.
  const wdIdx = new Date(`${y}-${mo}-${da}T00:00:00Z`).getUTCDay();
  const wd = ["일", "월", "화", "수", "목", "금", "토"][wdIdx];
  const suffix =
    session === "kr_close" ? "장마감 15:30 KST" :
    session === "us_close" ? "장마감 04:00 ET" :
    "장 시작 전 · 프리마켓";
  return `${Number(mo)}월 ${Number(da)}일 ${wd}요일 · ${suffix}`;
}

/**
 * RAG: 의미적으로 가까운 뉴스를 retrieve하여 기존 뉴스에 머지.
 * 첫 배치에는 DB가 비어있으므로 retrieved=[] → 기존 뉴스만 반환.
 * 검색 실패 시 기존 뉴스로 폴백 (절대 throw 안 함).
 */
async function augmentWithRag(
  m: MoverMeta,
  existing: CompanyNewsItem[],
): Promise<CompanyNewsItem[]> {
  try {
    const meta = getStockMeta(m.ticker);
    const direction = m.changePct >= 0 ? "상승" : "하락";
    const query = `${m.nameKo} ${meta?.sector ?? ""} 주가 ${direction} 실적 호재 악재`;
    // 1차: ticker로 필터
    let docs = await retrieve(query, { ticker: m.ticker, topK: 5, daysBack: 7 });
    // 2차: ticker로 매칭 안 되면 (ex: KR 뉴스는 ticker=null로 ingest됨) 종목명 쿼리로 검색
    if (docs.length === 0) {
      docs = await retrieve(`${m.nameKo} ${m.ticker}`, { ticker: null, topK: 3, daysBack: 7 });
    }
    const seen = new Set(existing.map((n) => n.headline));
    const merged: CompanyNewsItem[] = [...existing];
    for (const d of docs) {
      if (seen.has(d.headline)) continue;
      seen.add(d.headline);
      merged.push({
        ticker: m.ticker,
        headline: d.headline,
        summary: d.summary ?? "",
        datetime: Math.floor(kstToInstant(d.publishedAt).getTime() / 1000),
        source: d.source,
        url: d.url ?? "",
      });
    }
    return merged.slice(0, 8);
  } catch (err) {
    console.error(`[pipeline] rag augment failed for ${m.ticker}:`, err);
    return existing;
  }
}

async function runMoverReason(
  m: MoverMeta,
  news: import("@/lib/collectors/company-news").CompanyNewsItem[],
  addUsage: (u: { input: number; output: number }) => void,
): Promise<{ ticker: string; reason: string }> {
  const res = await callClaudeJson<unknown>({
    system: moverReasonSystem,
    user: buildMoverReasonUser({
      ticker: m.ticker,
      nameKo: m.nameKo,
      changePct: m.changePct,
      news,
    }),
    toolName: "submit_mover_reason",
    toolDescription: "종목 움직임 이유를 제출한다",
    inputSchema: moverReasonJsonSchema,
    maxTokens: 150,
  });
  addUsage(res.usage);
  try {
    const parsed: MoverReason = moverReasonSchema.parse(res.data);
    return { ticker: m.ticker, reason: parsed.reason };
  } catch (e) {
    console.error(`[pipeline] mover reason parse failed for ${m.ticker}:`, e, "raw:", JSON.stringify(res.data));
    throw e;
  }
}

export async function runAiPipeline(args: {
  usSources: RawSources;
  krSources: KrRawSources;
  usMovers: MoverMeta[];
  krMovers: MoverMeta[];
  session: BriefingSession;
}): Promise<PipelineOutput> {
  const emptyBriefing: MarketBriefingPipeline = {
    dateLabel: "", headline: "", headlineAccent: "",
    summary: { title: "", body: "", sub: "", longBody: "", koreanContext: "", tags: [] },
    causes: [], movers: [], events: [], macros: [],
  };

  const usage: TokenUsage = { input: 0, output: 0, calls: 0 };
  const addUsage = (u: { input: number; output: number }) => {
    usage.input += u.input;
    usage.output += u.output;
    usage.calls += 1;
  };

  const isUsPre = args.session === "us_pre";

  if (args.session === "us_close" || args.session === "us_pre") {
    const usDateLabel = toDateLabel(args.usSources.collectedAt, args.session);

    // 1. US summary
    const usSummaryRes = await callClaudeJson<unknown>({
      system: isUsPre ? usPreMarketSystem : marketSummarySystem,
      user: isUsPre
        ? buildUsPreMarketUser({
            news: args.usSources.marketNews,
            koreanNews: args.usSources.koreanNews,
            macros: args.usSources.macros,
            dateLabel: usDateLabel,
          })
        : buildMarketSummaryUser({
            news: args.usSources.marketNews,
            koreanNews: args.usSources.koreanNews,
            macros: args.usSources.macros,
            dateLabel: usDateLabel,
          }),
      toolName: "submit_market_summary",
      toolDescription: isUsPre
        ? "오늘 밤 미국 시장 프리뷰를 제출한다"
        : "오늘의 미국 시장 요약 결과를 제출한다",
      inputSchema: marketSummaryJsonSchema,
      maxTokens: 3000,
    });
    addUsage(usSummaryRes.usage);
    let usSummary: MarketSummary;
    try {
      const sanitized = sanitizeRawSummary(usSummaryRes.data as Record<string, unknown>);
      usSummary = marketSummarySchema.parse(sanitized);
    } catch (e) {
      console.error("[pipeline] US summary parse failed:", e, "raw:", JSON.stringify(usSummaryRes.data));
      throw e;
    }

    // 2. US mover reasons in parallel — RAG로 기존 뉴스 보강 후 호출
    const usMoverResults = await Promise.all(
      args.usMovers.map(async (m) => {
        const augmented = await augmentWithRag(m, args.usSources.companyNews[m.ticker] ?? []);
        return runMoverReason(m, augmented, addUsage);
      }),
    );

    // 3. Events
    let events: EventsOutput["events"] = [];
    try {
      const evRes = await callClaudeJson<unknown>({
        system: eventsSystem,
        user: buildEventsUser(args.usSources.economicEvents),
        toolName: "submit_events",
        toolDescription: "경제 캘린더 요약을 제출한다",
        inputSchema: eventsJsonSchema,
        maxTokens: 600,
      });
      addUsage(evRes.usage);
      events = eventsSchema.parse(evRes.data).events;
    } catch { events = []; }

    return {
      us: {
        dateLabel: usDateLabel,
        headline: usSummary.headline,
        headlineAccent: usSummary.headlineAccent,
        summary: usSummary.summary,
        causes: usSummary.causes,
        movers: usMoverResults,
        events,
        macros: args.usSources.macros,
      },
      kr: emptyBriefing,
      usage,
    };
  }

  // kr_close
  const krDateLabel = toDateLabel(args.krSources.collectedAt, args.session);

  const krSummaryArgs = {
    system: krMarketSummarySystem,
    user: buildKrMarketSummaryUser({
      koreanMarketNews: args.krSources.koreanMarketNews,
      macros: args.krSources.macros,
      dateLabel: krDateLabel,
    }),
    toolName: "submit_market_summary",
    toolDescription: "오늘의 한국 시장 요약 결과를 제출한다",
    inputSchema: marketSummaryJsonSchema,
    maxTokens: 3000,
  };

  let krSummary: MarketSummary | null = null;
  let lastRaw: unknown = null;
  let lastErr: unknown = null;
  for (let attempt = 1; attempt <= 2; attempt++) {
    const res = await callClaudeJson<unknown>(krSummaryArgs);
    addUsage(res.usage);
    lastRaw = res.data;
    try {
      const sanitized = sanitizeRawSummary(res.data as Record<string, unknown>);
      krSummary = marketSummarySchema.parse(sanitized);
      break;
    } catch (e) {
      lastErr = e;
      console.error(
        `[pipeline] KR summary parse failed (attempt ${attempt}):`,
        e,
        "raw:",
        JSON.stringify(res.data),
      );
    }
  }
  if (!krSummary) {
    const rawPreview = JSON.stringify(lastRaw).slice(0, 400);
    throw new Error(
      `KR summary schema fail after 2 attempts: ${lastErr instanceof Error ? lastErr.message : String(lastErr)} | raw: ${rawPreview}`,
    );
  }

  const krMoverResults = await Promise.all(
    args.krMovers.map(async (m) => {
      const augmented = await augmentWithRag(m, args.krSources.companyNews[m.ticker] ?? []);
      return runMoverReason(m, augmented, addUsage);
    }),
  );

  return {
    us: emptyBriefing,
    kr: {
      dateLabel: krDateLabel,
      headline: krSummary.headline,
      headlineAccent: krSummary.headlineAccent,
      summary: krSummary.summary,
      causes: krSummary.causes,
      movers: krMoverResults,
      events: [],
      macros: args.krSources.macros,
    },
    usage,
  };
}
