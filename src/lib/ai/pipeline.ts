import "server-only";
import { callClaudeJson } from "@/lib/clients/anthropic";
import {
  marketSummarySystem,
  buildMarketSummaryUser,
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
import type { RawSources, TokenUsage } from "@/lib/briefing/types";
import type { BriefingData, MacroItem } from "@/types/stock";
import { briefingData as mockBriefing } from "@/mocks/data/briefing";

export interface PipelineOutput {
  briefing: Omit<BriefingData, "indices" | "movers"> & {
    movers: { ticker: string; reason: string }[];
  };
  macros: MacroItem[];
  usage: TokenUsage;
}

function toDateLabel(iso: string): string {
  const d = new Date(iso);
  const month = d.getUTCMonth() + 1;
  const day = d.getUTCDate();
  const wd = ["일", "월", "화", "수", "목", "금", "토"][d.getUTCDay()];
  return `${month}월 ${day}일 ${wd}요일 · 장마감 04:00 ET`;
}

export async function runAiPipeline(args: {
  sources: RawSources;
  movers: { ticker: string; nameKo: string; changePct: number }[];
}): Promise<PipelineOutput> {
  const usage: TokenUsage = { input: 0, output: 0, calls: 0 };
  const addUsage = (u: { input: number; output: number }) => {
    usage.input += u.input;
    usage.output += u.output;
    usage.calls += 1;
  };

  const dateLabel = toDateLabel(args.sources.collectedAt);

  // 1. Market summary (1 call)
  const summaryRes = await callClaudeJson<unknown>({
    system: marketSummarySystem,
    user: buildMarketSummaryUser({
      news: args.sources.marketNews,
      macros: args.sources.macros,
      dateLabel,
    }),
    toolName: "submit_market_summary",
    toolDescription: "오늘의 시장 요약 결과를 제출한다",
    inputSchema: marketSummaryJsonSchema,
    maxTokens: 800,
  });
  addUsage(summaryRes.usage);
  const summary: MarketSummary = marketSummarySchema.parse(summaryRes.data);

  // 2. Movers reasons (parallel)
  const moverResults = await Promise.all(
    args.movers.map(async (m) => {
      const news = args.sources.companyNews[m.ticker] ?? [];
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
    }),
  );

  // 3. Events
  let events: EventsOutput["events"] = [];
  try {
    const evRes = await callClaudeJson<unknown>({
      system: eventsSystem,
      user: buildEventsUser(args.sources.economicEvents),
      toolName: "submit_events",
      toolDescription: "경제 캘린더 요약을 제출한다",
      inputSchema: eventsJsonSchema,
      maxTokens: 600,
    });
    addUsage(evRes.usage);
    events = eventsSchema.parse(evRes.data).events;
  } catch {
    events = mockBriefing.events;
  }

  return {
    briefing: {
      date: summary.date,
      headline: summary.headline,
      headlineAccent: summary.headlineAccent,
      summary: summary.summary,
      movers: moverResults,
      events,
      macros: args.sources.macros,
    },
    macros: args.sources.macros,
    usage,
  };
}
