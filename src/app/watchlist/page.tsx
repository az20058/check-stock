"use client";

import Link from "next/link";
import StatusBar from "@/components/StatusBar";
import TabBar from "@/components/TabBar";
import Avatar from "@/components/Avatar";
import Sparkline from "@/components/Sparkline";
import { useWatchlist } from "@/hooks/queries";

function formatPct(pct: number): string {
  return (pct >= 0 ? "+" : "") + pct.toFixed(2) + "%";
}

function heatmapBg(pct: number): string {
  const abs = Math.abs(pct);
  const intensity = Math.min(abs / 5, 1);
  const alpha = 0.12 + intensity * 0.35;
  if (pct >= 0) {
    return `rgba(255,84,102,${alpha.toFixed(2)})`;
  }
  return `rgba(59,130,246,${alpha.toFixed(2)})`;
}

export default function WatchlistPage() {
  const { data, isLoading, isError } = useWatchlist();

  if (isLoading) return (
    <div className="relative h-dvh overflow-hidden" style={{ background: "var(--bg-1)" }}>
      <StatusBar time="--:--" />
      <div className="overflow-y-auto h-full pt-[54px] pb-[96px] px-4 space-y-4">
        <div className="h-20 rounded-xl animate-pulse" style={{ background: "var(--bg-2)" }} />
        <div className="h-32 rounded-xl animate-pulse" style={{ background: "var(--bg-2)" }} />
        <div className="h-48 rounded-xl animate-pulse" style={{ background: "var(--bg-2)" }} />
        <div className="h-64 rounded-xl animate-pulse" style={{ background: "var(--bg-2)" }} />
      </div>
      <TabBar active="watch" />
    </div>
  );

  if (isError || !data) return (
    <div className="relative h-dvh overflow-hidden" style={{ background: "var(--bg-1)" }}>
      <StatusBar time="--:--" />
      <div className="flex items-center justify-center h-full">
        <p className="text-sm" style={{ color: "var(--text-2)" }}>데이터를 불러오지 못했습니다.</p>
      </div>
      <TabBar active="watch" />
    </div>
  );

  const { stocks, mostMentioned } = data;

  const upCount = stocks.filter((s) => s.changePct >= 0).length;
  const downCount = stocks.filter((s) => s.changePct < 0).length;
  const upPct = stocks.length > 0 ? Math.round((upCount / stocks.length) * 100) : 0;

  const sortedByChange = [...stocks].sort((a, b) => Math.abs(b.changePct) - Math.abs(a.changePct));

  return (
    <div
      className="relative h-dvh overflow-hidden"
      style={{ background: "var(--bg-1)" }}
    >
      <StatusBar time="9:14" />

      {/* Scrollable content */}
      <div className="overflow-y-auto h-full pt-[54px] pb-[96px]">

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
                    {"$" + s.price.toFixed(2)}
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

        {/* 가장 많이 언급된 section */}
        <div className="px-4 mt-6">
          <div className="flex items-center justify-between mb-3">
            <h2
              className="text-lg font-bold"
              style={{ color: "var(--text-0)" }}
            >
              가장 많이 언급된
            </h2>
            <span
              className="text-xs"
              style={{ color: "var(--text-2)" }}
            >
              뉴스 기준
            </span>
          </div>

          <div
            className="rounded-[14px] border overflow-hidden"
            style={{
              background: "var(--bg-2)",
              borderColor: "var(--line)",
            }}
          >
            {mostMentioned.map((item, i) => (
              <Link
                key={item.ticker}
                href={`/report/${item.ticker}`}
                className="flex items-center gap-3"
                style={{
                  padding: "12px 16px",
                  borderBottom: i < mostMentioned.length - 1 ? "1px solid var(--line)" : "none",
                }}
              >
                {/* Rank badge */}
                <div
                  className="flex items-center justify-center rounded-[7px] border font-mono text-[11px] font-bold shrink-0"
                  style={{
                    width: 22,
                    height: 22,
                    background: "var(--bg-3)",
                    borderColor: "var(--line)",
                    color: "var(--text-0)",
                  }}
                >
                  {i + 1}
                </div>

                <div className="flex-1 min-w-0">
                  <span
                    className="font-mono text-sm font-bold"
                    style={{ color: "var(--text-0)" }}
                  >
                    {item.ticker}
                  </span>
                  <span
                    className="text-[11px] ml-1.5"
                    style={{ color: "var(--text-2)" }}
                  >
                    {item.name}
                  </span>
                </div>

                <span
                  className="font-mono text-xs font-semibold shrink-0"
                  style={{ color: "var(--text-1)" }}
                >
                  {item.count}건
                </span>
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
