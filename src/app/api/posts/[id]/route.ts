import { NextResponse } from "next/server";
import { getRunById } from "@/lib/briefing/storage";
import type { RawSources, TokenUsage } from "@/lib/briefing/types";
import type { BriefingSession, MarketBriefing, MarketIndex, Stock } from "@/types/stock";
import { getStockMeta, inferMarket } from "@/lib/data/stock-meta";

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

function num(v: unknown, fallback = 0): number {
  return typeof v === "number" && Number.isFinite(v) ? v : fallback;
}

function str(v: unknown, fallback = ""): string {
  return typeof v === "string" ? v : fallback;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeIndex(raw: any): MarketIndex {
  return {
    label: str(raw?.label),
    value: num(raw?.value),
    changePct: num(raw?.changePct),
  };
}

function normalizeMover(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  raw: any,
  defaultMarket: "US" | "KR",
): Stock & { reason: string } {
  const ticker = str(raw?.ticker);
  const meta = ticker ? getStockMeta(ticker) : undefined;
  const market = (raw?.market as "US" | "KR" | undefined) ?? meta?.market ?? inferMarket(ticker);
  const currency =
    (raw?.currency as "USD" | "KRW" | undefined) ??
    meta?.currency ??
    (defaultMarket === "KR" ? "KRW" : "USD");
  return {
    ticker,
    name: str(raw?.name, meta?.nameKo ?? ticker),
    nameKo: str(raw?.nameKo, meta?.nameKo ?? ticker),
    market,
    exchange: str(raw?.exchange, meta?.exchange ?? ""),
    currency,
    sector: str(raw?.sector, meta?.sector ?? ""),
    price: num(raw?.price),
    change: num(raw?.change),
    changePct: num(raw?.changePct),
    sparkline: Array.isArray(raw?.sparkline) ? raw.sparkline.filter((n: unknown) => typeof n === "number") : [],
    reason: str(raw?.reason),
  };
}

// 오래된 레코드는 causes/events/movers/indices 등이 누락되거나 항목 내부 필드가
// undefined인 채로 저장되어 있을 수 있어 toFixed/toLocaleString 등에서 터지지 않도록
// 안전한 기본값으로 채운다.
function normalizeBriefing(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  raw: any,
  market: "US" | "KR",
): MarketBriefing | null {
  if (!raw || typeof raw !== "object") return null;
  return {
    market: raw.market ?? market,
    dateLabel: str(raw.dateLabel),
    headline: str(raw.headline),
    headlineAccent: str(raw.headlineAccent),
    indices: Array.isArray(raw.indices) ? raw.indices.map(normalizeIndex) : [],
    summary: {
      title: str(raw.summary?.title),
      body: str(raw.summary?.body),
      sub: str(raw.summary?.sub),
      longBody: typeof raw.summary?.longBody === "string" ? raw.summary.longBody : undefined,
      koreanContext: typeof raw.summary?.koreanContext === "string" ? raw.summary.koreanContext : undefined,
      tags: Array.isArray(raw.summary?.tags) ? raw.summary.tags.filter((t: unknown) => typeof t === "string") : [],
    },
    movers: Array.isArray(raw.movers) ? raw.movers.map((m: unknown) => normalizeMover(m, market)) : [],
    macros: Array.isArray(raw.macros)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ? raw.macros.map((m: any) => ({
          label: str(m?.label),
          value: str(m?.value),
          delta: str(m?.delta),
          up: Boolean(m?.up),
        }))
      : [],
    events: Array.isArray(raw.events)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ? raw.events.map((e: any) => ({
          time: str(e?.time),
          title: str(e?.title),
          desc: str(e?.desc),
          tag: str(e?.tag),
          important: Boolean(e?.important),
        }))
      : [],
    causes: Array.isArray(raw.causes)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ? raw.causes.map((c: any, i: number) => ({
          rank: num(c?.rank, i + 1),
          title: str(c?.title),
          desc: str(c?.desc),
          tags: Array.isArray(c?.tags) ? c.tags.filter((t: unknown) => typeof t === "string") : [],
        }))
      : [],
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
