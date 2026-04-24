"use client";

import Link from "next/link";
import TabBar from "@/components/TabBar";
import Avatar from "@/components/Avatar";
import Sparkline from "@/components/Sparkline";
import { useStockQuotes } from "@/hooks/queries";
import { useLocalWatchlist } from "@/hooks/useLocalWatchlist";
import { getStockMeta } from "@/lib/data/stock-meta";
import { formatPct, formatPrice } from "@/lib/format";
import { heatmapBg, portfolioStats, sortByAbsChange } from "@/lib/portfolio";
import type { Stock } from "@/types/stock";

export default function WatchlistPage() {
  const { tickers } = useLocalWatchlist();
  const { data: quotes, isLoading, isError } = useStockQuotes(tickers);

  if (isLoading) return (
    <div className="relative h-dvh overflow-hidden" style={{ background: "var(--bg-1)" }}>
      <div className="overflow-y-auto h-full pt-3 pb-[96px] px-4 space-y-4">
        <div className="h-20 rounded-xl animate-pulse" style={{ background: "var(--bg-2)" }} />
        <div className="h-32 rounded-xl animate-pulse" style={{ background: "var(--bg-2)" }} />
        <div className="h-48 rounded-xl animate-pulse" style={{ background: "var(--bg-2)" }} />
        <div className="h-64 rounded-xl animate-pulse" style={{ background: "var(--bg-2)" }} />
      </div>
      <TabBar active="watch" />
    </div>
  );

  const stocks: Stock[] = (quotes ?? []).map((q) => {
    const meta = getStockMeta(q.symbol);
    const changePct = q.dp;
    const price = q.c;
    const change = price - price / (1 + changePct / 100);
    return {
      ticker: q.symbol,
      name: meta?.nameKo ?? q.symbol,
      nameKo: meta?.nameKo ?? q.symbol,
      exchange: "",
      sector: meta?.sector ?? "",
      price,
      change,
      changePct,
      sparkline: [],
    };
  });

  if (isError) return (
    <div className="relative h-dvh overflow-hidden" style={{ background: "var(--bg-1)" }}>
      <div className="flex items-center justify-center h-full">
        <p className="text-sm" style={{ color: "var(--text-2)" }}>데이터를 불러오지 못했습니다.</p>
      </div>
      <TabBar active="watch" />
    </div>
  );

  const { upCount, downCount, upPct } = portfolioStats(stocks);
  const sortedByChange = sortByAbsChange(stocks);

  return (
    <div
      className="relative h-dvh overflow-hidden"
      style={{ background: "var(--bg-1)" }}
    >
      {/* Scrollable content */}
      <div className="overflow-y-auto h-full pt-3 pb-[96px]">

        {/* Header */}
        <div className="flex items-start justify-between px-5 py-2">
          <div>
            <p
              className="text-[11px] uppercase tracking-widest font-semibold"
              style={{ color: "var(--text-3)" }}
            >
              WATCHLIST
            </p>
            <h1
              className="text-[32px] font-extrabold tracking-tight leading-tight mt-1"
              style={{ color: "var(--text-0)" }}
            >
              관심종목
            </h1>
          </div>
          <Link
            href="/search"
            className="flex items-center justify-center rounded-[14px] border"
            style={{
              width: 40,
              height: 40,
              background: "var(--bg-2)",
              borderColor: "var(--line)",
              marginTop: 6,
            }}
            aria-label="종목 추가"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M9 3v12M3 9h12" stroke="var(--text-1)" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </Link>
        </div>

        {/* Portfolio summary card */}
        <div className="mx-4 mt-3.5">
          <div
            className="rounded-[20px] border"
            style={{
              background: "var(--bg-2)",
              borderColor: "var(--line)",
              padding: "18px",
            }}
          >
            <p
              className="text-[11px] uppercase tracking-widest font-semibold"
              style={{ color: "var(--text-3)" }}
            >
              오늘의 내 포트폴리오
            </p>

            <div className="flex items-baseline gap-2 mt-2">
              <span
                className="font-mono text-[34px] font-bold leading-none"
                style={{ color: "var(--down)" }}
              >
                −0.92%
              </span>
              <span
                className="text-xs"
                style={{ color: "var(--text-2)" }}
              >
                평균 · {stocks.length}종목
              </span>
            </div>

            {/* Stacked bar */}
            <div
              className="h-2 rounded overflow-hidden mt-3"
              style={{ background: "var(--bg-3)" }}
            >
              <div className="flex h-full">
                <div
                  style={{
                    width: `${upPct}%`,
                    background: "var(--up)",
                  }}
                />
                <div
                  style={{
                    width: `${100 - upPct}%`,
                    background: "var(--down)",
                  }}
                />
              </div>
            </div>

            {/* Legend */}
            <div className="flex gap-3 mt-2">
              <span
                className="text-xs font-bold"
                style={{ color: "var(--up)" }}
              >
                {upCount} 상승
              </span>
              <span
                className="text-xs font-bold"
                style={{ color: "var(--down)" }}
              >
                {downCount} 하락
              </span>
            </div>
          </div>
        </div>

        {/* 히트맵 section */}
        <div className="mt-5">
          {/* Section header */}
          <div className="flex items-center justify-between px-5 mb-3">
            <h2
              className="text-lg font-bold"
              style={{ color: "var(--text-0)" }}
            >
              히트맵
            </h2>
            <span
              className="text-xs"
              style={{ color: "var(--text-2)" }}
            >
              등락률
            </span>
          </div>

          {/* 4-column heatmap grid */}
          <div className="grid grid-cols-4 gap-1.5 px-4">
            {stocks.map((s) => (
              <Link
                key={s.ticker}
                href={`/report/${s.ticker}`}
                className="aspect-square rounded-[10px] flex flex-col items-center justify-center border"
                style={{
                  background: heatmapBg(s.changePct),
                  borderColor: "var(--line)",
                }}
              >
                <span
                  className="font-mono text-[11px] font-bold"
                  style={{ color: "var(--text-0)" }}
                >
                  {s.ticker}
                </span>
                <span
                  className="font-mono text-[11px] font-semibold"
                  style={{ color: s.changePct >= 0 ? "var(--up)" : "var(--down)" }}
                >
                  {formatPct(s.changePct)}
                </span>
              </Link>
            ))}
          </div>
        </div>

        {/* Sort pills */}
        <div className="flex gap-1.5 px-4 pt-5 pb-2">
          <button
            className="inline-flex items-center gap-1.5 h-7 px-3 rounded-full text-[13px] font-semibold border"
            style={{
              background: "var(--accent-soft)",
              color: "var(--accent)",
              borderColor: "var(--accent-ring)",
            }}
          >
            변동률순
          </button>
          <button
            className="inline-flex items-center gap-1.5 h-7 px-3 rounded-full text-[13px] font-semibold border"
            style={{
              background: "var(--bg-3)",
              color: "var(--text-1)",
              borderColor: "var(--line)",
            }}
          >
            이름순
          </button>
          <button
            className="inline-flex items-center gap-1.5 h-7 px-3 rounded-full text-[13px] font-semibold border"
            style={{
              background: "var(--bg-3)",
              color: "var(--text-1)",
              borderColor: "var(--line)",
            }}
          >
            이벤트
          </button>
        </div>

        {/* Stock list */}
        <div className="px-4">
          <div
            className="rounded-[14px] border overflow-hidden"
            style={{
              background: "var(--bg-2)",
              borderColor: "var(--line)",
            }}
          >
            {sortedByChange.map((s, i) => (
              <Link
                key={s.ticker}
                href={`/report/${s.ticker}`}
                className="grid items-center gap-3"
                style={{
                  gridTemplateColumns: "44px 1fr auto auto",
                  padding: "12px 16px",
                  borderBottom: i < sortedByChange.length - 1 ? "1px solid var(--line)" : "none",
                  display: "grid",
                }}
              >
                <Avatar ticker={s.ticker} />

                <div className="min-w-0">
                  <div
                    className="font-mono text-sm font-bold"
                    style={{ color: "var(--text-0)" }}
                  >
                    {s.ticker}
                  </div>
                  <div
                    className="text-[11px] truncate"
                    style={{ color: "var(--text-2)" }}
                  >
                    {s.nameKo}
                  </div>
                </div>

                <Sparkline data={s.sparkline} up={s.changePct >= 0} width={56} height={22} stroke={1.5} />

                <div className="text-right">
                  <div
                    className="font-mono text-sm font-semibold"
                    style={{ color: "var(--text-0)" }}
                  >
                    {formatPrice(s.price)}
                  </div>
                  <div
                    className="font-mono text-[11px] font-semibold"
                    style={{ color: s.changePct >= 0 ? "var(--up)" : "var(--down)" }}
                  >
                    {formatPct(s.changePct)}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Disclaimer */}
        <p
          className="text-[10px] text-center"
          style={{ color: "var(--text-3)", padding: "20px 20px 10px" }}
        >
          시세는 15분 지연되었을 수 있습니다. 본 정보는 투자 조언이 아닙니다.
        </p>
      </div>

      <TabBar active="watch" />
    </div>
  );
}
