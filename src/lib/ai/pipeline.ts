import "server-only";
import { callClaudeJson } from "@/lib/clients/anthropic";
import type { BriefingSession } from "@/types/stock";

/** Claude가 XML 태그를 섞어 출력하는 경우 headline 정리 */
function sanitizeRawSummary(raw: Record<string, unknown>): Record<string, unknown> {
  const headline = typeof raw.headline === "string" ? raw.headline : "";
  // headline에 XML/HTML 태그가 포함된 경우 제거
  const cleaned = headline.replace(/<[^>]*>/g, "").replace(/\\n/g, " ").replace(/"+$/, "").trim();
  return { ...raw, headline: cleaned || headline };
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
  const d = new Date(iso);
  const month = d.getUTCMonth() + 1;
  const day = d.getUTCDate();
  const wd = ["일", "월", "화", "수", "목", "금", "토"][d.getUTCDay()];
  const suffix =
    session === "kr_close" ? "장마감 15:30 KST" :
    session === "us_close" ? "장마감 04:00 ET" :
    "장 시작 전 · 프리마켓";
  return `${month}월 ${day}일 ${wd}요일 · ${suffix}`;
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
    summary: { title: "", body: "", sub: "", tags: [] },
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
      maxTokens: 800,
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

    // 2. US mover reasons in parallel
    const usMoverResults = await Promise.all(
      args.usMovers.map((m) =>
        runMoverReason(m, args.usSources.companyNews[m.ticker] ?? [], addUsage),
      ),
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
        dateLabel: usSummary.dateLabel,
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

  const krSummaryRes = await callClaudeJson<unknown>({
    system: krMarketSummarySystem,
    user: buildKrMarketSummaryUser({
      koreanMarketNews: args.krSources.koreanMarketNews,
      macros: args.krSources.macros,
      dateLabel: krDateLabel,
    }),
    toolName: "submit_market_summary",
    toolDescription: "오늘의 한국 시장 요약 결과를 제출한다",
    inputSchema: marketSummaryJsonSchema,
    maxTokens: 800,
  });
  addUsage(krSummaryRes.usage);
  let krSummary: MarketSummary;
  try {
    const sanitized = sanitizeRawSummary(krSummaryRes.data as Record<string, unknown>);
    krSummary = marketSummarySchema.parse(sanitized);
  } catch (e) {
    console.error("[pipeline] KR summary parse failed:", e, "raw:", JSON.stringify(krSummaryRes.data));
    throw e;
  }

  const krMoverResults = await Promise.all(
    args.krMovers.map((m) =>
      runMoverReason(m, args.krSources.companyNews[m.ticker] ?? [], addUsage),
    ),
  );

  return {
    us: emptyBriefing,
    kr: {
      dateLabel: krSummary.dateLabel,
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
