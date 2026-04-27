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
  const briefing: MarketBriefing | null =
    market === "KR" ? (data?.kr ?? null) : (data?.us ?? data ?? null);

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
