import { NextResponse } from "next/server";
import { listRecentRuns } from "@/lib/briefing/storage";
import type { BriefingSession, MarketBriefing } from "@/types/stock";

export const dynamic = "force-dynamic";

export interface PostListItem {
  id: string;
  startedAt: string;
  session: BriefingSession;
  status: "success" | "partial" | "running" | "failed";
  triggeredBy: "cron" | "manual";
  market: "US" | "KR";
  dateLabel: string;
  headline: string;
  headlineAccent: string;
  summary: string;
  tags: string[];
  moverCount: number;
}

function pickMarket(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any,
  session: BriefingSession,
): { market: "US" | "KR"; m: MarketBriefing | null } {
  if (!data) return { market: session === "kr_close" ? "KR" : "US", m: null };
  if (session === "kr_close") {
    const kr = data?.kr ?? data;
    return { market: "KR", m: kr ?? null };
  }
  const us = data?.us ?? data;
  return { market: "US", m: us ?? null };
}

export async function GET() {
  const runs = await listRecentRuns(20);
  const posts: PostListItem[] = runs
    .filter((r) => r.status === "success" || r.status === "partial")
    .map((r) => {
      const { market, m } = pickMarket(r.briefing_data, r.session);
      return {
        id: r.id,
        startedAt: r.started_at,
        session: r.session,
        status: r.status as "success" | "partial",
        triggeredBy: r.triggered_by,
        market,
        dateLabel: m?.dateLabel ?? "",
        headline: m?.headline ?? "",
        headlineAccent: m?.headlineAccent ?? "",
        summary: m?.summary?.body ?? "",
        tags: m?.summary?.tags ?? [],
        moverCount: m?.movers?.length ?? 0,
      };
    });
  return NextResponse.json(posts);
}
