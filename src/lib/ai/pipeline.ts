import "server-only";
import { callClaudeJson } from "@/lib/clients/anthropic";
import {
  marketSummarySystem,
  krMarketSummarySystem,
  buildMarketSummaryUser,
  buildKrMarketSummaryUser,
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

function toDateLabel(iso: string, market: "US" | "KR"): string {
  const d = new Date(iso);
  const month = d.getUTCMonth() + 1;
  const day = d.getUTCDate();
  const wd = ["일", "월", "화", "수", "목", "금", "토"][d.getUTCDay()];
  const suffix = market === "KR" ? "장마감 15:30 KST" : "장마감 04:00 ET";
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
  const parsed: MoverReason = moverReasonSchema.parse(res.data);
  return { ticker: m.ticker, reason: parsed.reason };
}

export async function runAiPipeline(args: {
  usSources: RawSources;
  krSources: KrRawSources;
  usMovers: MoverMeta[];
  krMovers: MoverMeta[];
}): Promise<PipelineOutput> {
  const usage: TokenUsage = { input: 0, output: 0, calls: 0 };
  const addUsage = (u: { input: number; output: number }) => {
    usage.input += u.input;
    usage.output += u.output;
    usage.calls += 1;
  };

  const usDateLabel = toDateLabel(args.usSources.collectedAt, "US");
  const krDateLabel = toDateLabel(args.krSources.collectedAt, "KR");

  // 1. US summary + KR summary in parallel
  const [usSummaryRes, krSummaryRes] = await Promise.all([
    callClaudeJson<unknown>({
      system: marketSummarySystem,
      user: buildMarketSummaryUser({
        news: args.usSources.marketNews,
        koreanNews: args.usSources.koreanNews,
        macros: args.usSources.macros,
        dateLabel: usDateLabel,
      }),
      toolName: "submit_market_summary",
      toolDescription: "오늘의 미국 시장 요약 결과를 제출한다",
      inputSchema: marketSummaryJsonSchema,
      maxTokens: 800,
    }),
    callClaudeJson<unknown>({
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
    }),
  ]);

  addUsage(usSummaryRes.usage);
  addUsage(krSummaryRes.usage);

  const usSummary: MarketSummary = marketSummarySchema.parse(usSummaryRes.data);
  const krSummary: MarketSummary = marketSummarySchema.parse(krSummaryRes.data);

  // 2. All mover reasons in parallel (4 US + 4 KR = 8 calls)
  const [usMoverResults, krMoverResults] = await Promise.all([
    Promise.all(
      args.usMovers.map((m) =>
        runMoverReason(m, args.usSources.companyNews[m.ticker] ?? [], addUsage),
      ),
    ),
    Promise.all(
      args.krMovers.map((m) =>
        runMoverReason(m, args.krSources.companyNews[m.ticker] ?? [], addUsage),
      ),
    ),
  ]);

  // 3. Events (US only)
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
  } catch {
    events = [];
  }

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
