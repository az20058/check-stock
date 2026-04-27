import { NextResponse } from "next/server";
import { getRunById } from "@/lib/briefing/storage";
import type { RawSources, TokenUsage } from "@/lib/briefing/types";
import type { BriefingSession, MarketBriefing } from "@/types/stock";

export const dynamic = "force-dynamic";

export interface PostDetail {
  id: string;
  startedAt: string;
  finishedAt: string | null;
  session: BriefingSession;
  status: "success" | "partial" | "running" | "failed";
  triggeredBy: "cron" | "manual";
  market: "US" | "KR";
  briefing: MarketBriefing | null;
  sources: RawSources | null;
  tokenUsage: TokenUsage | null;
}

// 오래된 레코드는 causes/events/movers/indices 등이 누락된 형태로 저장되어 있을 수 있어
// 페이지가 안전하게 .length를 호출할 수 있도록 빈 값으로 채운다.
function normalizeBriefing(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  raw: any,
  market: "US" | "KR",
): MarketBriefing | null {
  if (!raw || typeof raw !== "object") return null;
  return {
    market: raw.market ?? market,
    dateLabel: raw.dateLabel ?? "",
    headline: raw.headline ?? "",
    headlineAccent: raw.headlineAccent ?? "",
    indices: Array.isArray(raw.indices) ? raw.indices : [],
    summary: {
      title: raw.summary?.title ?? "",
      body: raw.summary?.body ?? "",
      sub: raw.summary?.sub ?? "",
      tags: Array.isArray(raw.summary?.tags) ? raw.summary.tags : [],
    },
    movers: Array.isArray(raw.movers) ? raw.movers : [],
    macros: Array.isArray(raw.macros) ? raw.macros : [],
    events: Array.isArray(raw.events) ? raw.events : [],
    causes: Array.isArray(raw.causes) ? raw.causes : [],
  };
}

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const run = await getRunById(id);
  if (!run) {
    return NextResponse.json({ error: "포스트를 찾을 수 없습니다" }, { status: 404 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data = run.briefing_data as any;
  const market: "US" | "KR" = run.session === "kr_close" ? "KR" : "US";
  const rawBriefing = market === "KR" ? (data?.kr ?? null) : (data?.us ?? data ?? null);
  const briefing = normalizeBriefing(rawBriefing, market);

  const detail: PostDetail = {
    id: run.id,
    startedAt: run.started_at,
    finishedAt: run.finished_at,
    session: run.session,
    status: run.status,
    triggeredBy: run.triggered_by,
    market,
    briefing,
    sources: run.raw_sources,
    tokenUsage: run.token_usage,
  };
  return NextResponse.json(detail);
}
