"use client";

import Link from "next/link";
import { useState } from "react";
import TabBar from "@/components/TabBar";
import Avatar from "@/components/Avatar";
import Sparkline from "@/components/Sparkline";
import { useStockQuotes } from "@/hooks/queries";
import { useLocalWatchlist } from "@/hooks/useLocalWatchlist";
import { getStockMeta, inferMarket } from "@/lib/data/stock-meta";
import { formatPct, formatPrice } from "@/lib/format";
import { heatmapBg, portfolioStats, sortByAbsChange } from "@/lib/portfolio";
import type { Stock } from "@/types/stock";

export default function WatchlistPage() {
  const { tickers } = useLocalWatchlist();
  const { data: quotes, isLoading, isError } = useStockQuotes(tickers);
  const [filter, setFilter] = useState<"전체" | "US" | "KR">("전체");

  if (tickers.length === 0) return (
    <div className="relative h-dvh overflow-hidden" style={{ background: "var(--bg-1)" }}>
      <div className="overflow-y-auto h-full pt-3 pb-[calc(72px+env(safe-area-inset-bottom))]">
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

        <div className="px-4 mt-8">
          <div
            className="rounded-[20px] border flex flex-col items-center text-center"
            style={{
              background: "var(--bg-2)",
              borderColor: "var(--line)",
              padding: "32px 24px",
            }}
          >
            <div
              className="flex items-center justify-center rounded-full"
              style={{
                width: 56,
                height: 56,
                background: "var(--accent-soft)",
                marginBottom: 16,
              }}
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                <path
                  d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 16.8 5.8 21.3l2.4-7.4L2 9.4h7.6L12 2z"
                  stroke="var(--accent)"
                  strokeWidth="2"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <h2
              className="text-lg font-bold"
              style={{ color: "var(--text-0)" }}
            >
              아직 관심종목이 없어요
            </h2>
            <p
              className="text-sm mt-2 leading-relaxed"
              style={{ color: "var(--text-2)" }}
            >
              관심 있는 종목을 등록하면<br />
              포트폴리오 요약과 히트맵을 볼 수 있어요.
            </p>
            <Link
              href="/search"
              className="inline-flex items-center justify-center gap-2 rounded-[14px] font-bold mt-6"
              style={{
                background: "var(--accent)",
                color: "var(--bg-1)",
                padding: "12px 20px",
                fontSize: 14,
              }}
            >
              <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
                <path d="M9 3v12M3 9h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              종목 추가하기
            </Link>
          </div>
        </div>
      </div>
      <TabBar active="watch" />
    </div>
  );

  if (isLoading) return (
    <div className="relative h-dvh overflow-hidden" style={{ background: "var(--bg-1)" }}>
      <div className="overflow-y-auto h-full pt-3 pb-[calc(72px+env(safe-area-inset-bottom))] px-4 space-y-4">
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
    const market = meta?.market ?? inferMarket(q.symbol);
    const changePct = q.dp;
    const price = q.c;
    const change = price - price / (1 + changePct / 100);
    return {
      ticker: q.symbol,
      name: meta?.nameKo ?? q.symbol,
      nameKo: meta?.nameKo ?? q.symbol,
      market,
      exchange: "",
      currency: meta?.currency ?? (market === "KR" ? "KRW" : "USD"),
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

  const filtered = filter === "전체" ? stocks : stocks.filter((s) => s.market === filter);
  const { upCount, downCount, upPct, avgChangePct } = portfolioStats(filtered);
  const sortedByChange = sortByAbsChange(filtered);

  const portfolioLabel =
    filter === "전체" ? "전체 포트폴리오" :
    filter === "US" ? "🇺🇸 미국 종목" :
    "🇰🇷 한국 종목";

  return (
    <div
      className="relative h-dvh overflow-hidden"
      style={{ background: "var(--bg-1)" }}
    >
      {/* Scrollable content */}
      <div className="overflow-y-auto h-full pt-3 pb-[calc(72px+env(safe-area-inset-bottom))]">

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

        {/* Market filter pills */}
        <div className="flex gap-1.5 px-5 pt-2 pb-1">
          {(["전체", "US", "KR"] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className="inline-flex items-center gap-1.5 h-7 px-3 rounded-full text-[12px] font-bold border"
              style={{
                background: filter === f ? "var(--accent-soft)" : "var(--bg-3)",
                color: filter === f ? "var(--accent)" : "var(--text-2)",
                borderColor: filter === f ? "var(--accent-ring)" : "var(--line)",
              }}>
              {f === "전체" ? "전체" : f === "US" ? "🇺🇸 미국" : "🇰🇷 한국"}
            </button>
          ))}
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
              {portfolioLabel}
            </p>

            <div className="flex items-baseline gap-2 mt-2">
              <span
                className="font-mono text-[34px] font-bold leading-none"
                style={{ color: avgChangePct >= 0 ? "var(--up)" : "var(--down)" }}
              >
                {avgChangePct >= 0 ? "+" : ""}{avgChangePct.toFixed(2)}%
              </span>
              <span
                className="text-xs"
                style={{ color: "var(--text-2)" }}
              >
                평균 · {filtered.length}종목
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
            {filtered.map((s) => (
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
                    {s.market === "US" ? "🇺🇸" : "🇰🇷"}{" "}
                    {s.market === "KR" ? s.nameKo : s.ticker}
                  </div>
                  <div
                    className="text-[11px] truncate"
                    style={{ color: "var(--text-2)" }}
                  >
                    {s.market === "KR" ? s.ticker : s.nameKo}
                  </div>
                </div>

                <Sparkline data={s.sparkline} up={s.changePct >= 0} width={56} height={22} stroke={1.5} />

                <div className="text-right">
                  <div
                    className="font-mono text-sm font-semibold"
                    style={{ color: "var(--text-0)" }}
                  >
                    {formatPrice(s.price, s.currency)}
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
