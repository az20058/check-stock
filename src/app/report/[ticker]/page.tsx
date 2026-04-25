"use client";

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { useStockReport } from "@/hooks/queries";
import { useLocalWatchlist } from "@/hooks/useLocalWatchlist";
import type { TimeRange, NewsItem } from "@/types/stock";
import { inferMarket } from "@/lib/data/stock-meta";
import { formatPrice, formatChange } from "@/lib/format";
import TabBar from "@/components/TabBar";
import Avatar from "@/components/Avatar";
import PriceChart from "@/components/PriceChart";
import Pct from "@/components/Pct";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

const segments: TimeRange[] = ["1D", "1W", "1M", "3M", "1Y", "ALL"];

export default function ReportPage() {
  const params = useParams();
  const router = useRouter();
  const ticker = (params.ticker as string).toUpperCase();
  const { data, isLoading, isError } = useStockReport(ticker);
  const { isWatched, add, remove } = useLocalWatchlist();
  const [range, setRange] = useState<TimeRange>("1D");

  const watched = isWatched(ticker);

  if (isLoading) {
    return (
      <div className="relative h-dvh overflow-hidden" style={{ background: "var(--bg-1)" }}>
        <div className="overflow-y-auto h-full pt-3 pb-[calc(64px+env(safe-area-inset-bottom))] px-4 space-y-4">
          <div className="h-10 rounded-xl animate-pulse" style={{ background: "var(--bg-2)" }} />
          <div className="h-24 rounded-xl animate-pulse" style={{ background: "var(--bg-2)" }} />
          <div className="h-48 rounded-xl animate-pulse" style={{ background: "var(--bg-2)" }} />
          <div className="h-32 rounded-xl animate-pulse" style={{ background: "var(--bg-2)" }} />
          <div className="h-48 rounded-xl animate-pulse" style={{ background: "var(--bg-2)" }} />
        </div>
        <TabBar active="watch" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div
        className="relative h-dvh overflow-hidden flex items-center justify-center"
        style={{ background: "var(--bg-1)" }}
      >
        <div className="text-center">
          <p style={{ color: "var(--text-1)" }}>데이터를 불러올 수 없습니다</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-3 px-4 py-2 rounded-lg text-sm font-semibold"
            style={{ background: "var(--accent)", color: "var(--text-0)" }}
          >
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  const { stock, aiSummary, causes, sectorComparisons, news, macros, chartData } = data;
  const market = stock.market ?? inferMarket(ticker);
  const currency = stock.currency ?? (market === "KR" ? "KRW" : "USD");
  const up = stock.changePct >= 0;
  const changeSign = up ? "+" : "";

  return (
    <div className="relative h-dvh overflow-hidden" style={{ background: "var(--bg-1)" }}>
      {/* Scrollable content */}
      <div className="overflow-y-auto h-full pt-3 pb-[calc(64px+env(safe-area-inset-bottom))]">

        {/* Top bar */}
        <div className="flex items-center justify-between px-4 pt-1.5">
          {/* Back button */}
          <button
            className="w-9 h-9 rounded-xl flex items-center justify-center border"
            style={{ background: "var(--bg-2)", borderColor: "var(--line)" }}
            aria-label="뒤로가기"
            onClick={() => router.back()}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M15 19l-7-7 7-7" stroke="var(--text-1)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          {/* Center: exchange + ticker */}
          <div className="flex flex-col items-center gap-0.5">
            <span
              className="text-[11px] font-semibold"
              style={{ color: "var(--text-2)" }}
            >
              {market === "KR" ? "🇰🇷" : "🇺🇸"} {stock.exchange}
            </span>
            <span
              className="font-mono text-sm font-bold"
              style={{ color: "var(--text-0)" }}
            >
              {stock.ticker}
            </span>
          </div>

          {/* Star button — toggle watchlist */}
          <button
            className="w-9 h-9 rounded-xl flex items-center justify-center border"
            style={{ background: "var(--bg-2)", borderColor: "var(--line)" }}
            aria-label={watched ? "관심종목 제거" : "관심종목 추가"}
            onClick={() => watched ? remove(ticker) : add(ticker)}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill={watched ? "var(--accent)" : "none"} stroke={watched ? "none" : "var(--text-2)"} strokeWidth="2">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
          </button>
        </div>

        {/* Hero */}
        <div className="px-5 pt-4 pb-2">
          <div className="flex items-center gap-3 mb-3">
            <Avatar ticker={stock.ticker} size="lg" />
            <div>
              <div className="text-lg font-bold" style={{ color: "var(--text-0)" }}>
                {market === "KR" ? stock.nameKo : stock.nameKo}
              </div>
              <div className="text-xs" style={{ color: "var(--text-2)" }}>
                {market === "KR" ? `${stock.ticker} · ${stock.sector}` : `${stock.name} · ${stock.sector}`}
              </div>
            </div>
          </div>

          <div
            className="font-mono text-[34px] font-bold tracking-tight"
            style={{ color: "var(--text-0)" }}
          >
            {formatPrice(stock.price, currency)}
          </div>

          <div className="flex items-center gap-2 mt-1">
            <span
              className="font-mono text-[15px] font-semibold"
              style={{ color: up ? "var(--up)" : "var(--down)" }}
            >
              {formatChange(stock.change, currency)} ({changeSign}{stock.changePct.toFixed(2)}%)
            </span>
            <span
              className="inline-flex items-center h-[22px] px-2 rounded-md text-[11px] font-semibold"
              style={{
                background: up ? "var(--up-soft)" : "var(--down-soft)",
                color: up ? "var(--up)" : "var(--down)",
              }}
            >
              장마감
            </span>
          </div>
        </div>

        {/* Chart card */}
        <div className="mx-4 mt-3">
          <div
            className="rounded-[20px] border overflow-hidden"
            style={{
              background: "var(--bg-2)",
              borderColor: "var(--line)",
              padding: "14px 4px 10px",
            }}
          >
            {/* Chart header */}
            <div className="flex items-center justify-between px-3 mb-2">
              <span
                className="uppercase tracking-widest text-[11px] font-semibold"
                style={{ color: "var(--text-3)" }}
              >
                일봉
              </span>
              <span
                className="font-mono text-xs"
                style={{ color: "var(--text-2)" }}
              >
                4.23 · 4.24
              </span>
            </div>

            {/* Chart */}
            <div className="flex justify-center">
              <PriceChart data={chartData[range]} up={up} width={311} height={128} />
            </div>

            {/* Segmented control */}
            <div className="flex justify-center mt-3">
              <div
                className="inline-flex p-1 rounded-xl border gap-0.5"
                style={{ background: "var(--bg-2)", borderColor: "var(--line)" }}
              >
                {segments.map((seg) => (
                  <span
                    key={seg}
                    className="px-3 py-1.5 text-xs font-semibold rounded-[9px] cursor-pointer"
                    style={
                      range === seg
                        ? { background: "var(--bg-4)", color: "var(--text-0)" }
                        : { color: "var(--text-2)" }
                    }
                    onClick={() => setRange(seg)}
                  >
                    {seg}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* AI 한 줄 요약 */}
        <div className="mx-4 mt-4">
          <div
            className="rounded-[20px] border"
            style={{
              background: "linear-gradient(180deg, rgba(59,130,246,0.08) 0%, rgba(59,130,246,0) 100%)",
              borderColor: "var(--accent-ring)",
              padding: "18px",
            }}
          >
            <div className="flex items-center gap-2 mb-3">
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ background: "var(--accent)" }}
              />
              <span
                className="text-[11px] font-semibold uppercase tracking-widest"
                style={{ color: "var(--accent)" }}
              >
                AI 한 줄 요약
              </span>
            </div>
            <p
              className="text-base font-bold leading-relaxed"
              style={{ color: "var(--text-0)" }}
            >
              {aiSummary}
            </p>
          </div>
        </div>

        {/* 어제 변동 원인 TOP 3 */}
        <div className="mt-6">
          <div className="flex items-baseline gap-1.5 px-5 mb-3">
            <h2 className="text-lg font-bold" style={{ color: "var(--text-0)" }}>
              어제 {up ? "상승" : "하락"} 원인{" "}
              <span style={{ color: "var(--accent)" }}>TOP 3</span>
            </h2>
            <span className="text-xs" style={{ color: "var(--text-2)" }}>중요도순</span>
          </div>

          <div className="px-4 flex flex-col gap-3">
            {causes.map((c) => {
              const isAccent = c.rank === 1;
              return (
                <div
                  key={c.rank}
                  className="rounded-[14px] border"
                  style={{
                    padding: "14px",
                    background: "var(--bg-2)",
                    borderColor: "var(--line)",
                  }}
                >
                  <div className="flex items-start gap-3">
                    {/* Rank badge */}
                    <span
                      className="w-[22px] h-[22px] rounded-[7px] border flex items-center justify-center font-mono text-[11px] font-bold shrink-0"
                      style={
                        isAccent
                          ? {
                              background: "var(--accent-soft)",
                              color: "var(--accent)",
                              borderColor: "var(--accent-ring)",
                            }
                          : {
                              background: "var(--bg-3)",
                              color: "var(--text-2)",
                              borderColor: "var(--line)",
                            }
                      }
                    >
                      {c.rank}
                    </span>

                    <div className="flex-1 min-w-0">
                      <div
                        className="text-[13px] font-bold leading-snug"
                        style={{ color: "var(--text-0)" }}
                      >
                        {c.title}
                      </div>
                      <p
                        className="text-xs leading-relaxed mt-1.5"
                        style={{ color: "var(--text-1)" }}
                      >
                        {c.desc}
                      </p>
                      <div className="flex gap-1.5 flex-wrap mt-2">
                        {c.tags.map((tag) => (
                          <span
                            key={tag}
                            className="text-[11px] rounded-full border px-2 h-[20px] flex items-center"
                            style={{
                              background: "var(--bg-3)",
                              color: "var(--text-2)",
                              borderColor: "var(--line)",
                            }}
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 섹터 대비 */}
        <div className="mt-6 px-4">
          <h2 className="text-lg font-bold px-1 mb-3" style={{ color: "var(--text-0)" }}>
            섹터 대비
          </h2>
          <div
            className="rounded-[20px] border"
            style={{
              background: "var(--bg-2)",
              borderColor: "var(--line)",
              padding: "16px",
            }}
          >
            <div className="flex flex-col gap-3.5">
              {sectorComparisons.map((item) => (
                <div key={item.label}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span
                      className="text-[13px]"
                      style={{
                        color: item.primary ? "var(--text-0)" : "var(--text-2)",
                        fontWeight: item.primary ? 700 : 400,
                      }}
                    >
                      {item.label}
                    </span>
                    <Pct v={item.changePct} bold={item.primary} />
                  </div>
                  <div
                    className="h-1.5 rounded-full w-full"
                    style={{ background: "var(--bg-3)" }}
                  >
                    <div
                      className="h-1.5 rounded-full"
                      style={{
                        width: `${item.widthPct}%`,
                        background: item.primary ? "var(--down)" : "var(--bg-4)",
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 관련 뉴스 */}
        <div className="mt-6 px-4">
          <div className="flex items-center justify-between px-1 mb-3">
            <h2 className="text-lg font-bold" style={{ color: "var(--text-0)" }}>
              관련 뉴스
            </h2>
            <span
              className="text-xs font-semibold"
              style={{ color: "var(--text-2)" }}
            >
              {news.length}건
            </span>
          </div>
          <NewsTabs news={news} />
        </div>

        {/* 매크로 맥락 */}
        <div className="mt-6 px-4">
          <h2 className="text-lg font-bold px-1 mb-3" style={{ color: "var(--text-0)" }}>
            매크로 맥락
          </h2>
          <div className="grid grid-cols-2 gap-2">
            {macros.map((m) => (
              <div
                key={m.label}
                className="rounded-[14px] border"
                style={{
                  padding: "12px 14px",
                  background: "var(--bg-2)",
                  borderColor: "var(--line)",
                }}
              >
                <div
                  className="text-[11px] font-semibold"
                  style={{ color: "var(--text-2)" }}
                >
                  {m.label}
                </div>
                <div
                  className="font-mono text-[17px] font-bold mt-1"
                  style={{ color: "var(--text-0)" }}
                >
                  {m.value}
                </div>
                <div
                  className="font-mono text-[11px] mt-0.5"
                  style={{ color: m.up ? "var(--up)" : "var(--down)" }}
                >
                  {m.delta}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Disclaimer */}
        <div className="mt-6 mx-4 mb-2">
          <p
            className="text-[11px] leading-relaxed text-center"
            style={{ color: "var(--text-3)" }}
          >
            AI가 뉴스·공시·시장 데이터를 해석한 결과이며 투자 조언이 아닙니다. 데이터 출처: Finnhub, SEC EDGAR, FRED.
          </p>
        </div>

      </div>

      <TabBar active="watch" />
    </div>
  );
}

function NewsTabs({ news }: { news: NewsItem[] }) {
  const overseas = news.filter((n) => n.lang === "en");
  const domestic = news.filter((n) => n.lang === "ko");
  const defaultTab = domestic.length > 0 ? "domestic" : "overseas";

  const renderList = (items: typeof news) => {
    if (items.length === 0) {
      return (
        <div
          className="rounded-[20px] border py-8 text-center"
          style={{ background: "var(--bg-2)", borderColor: "var(--line)" }}
        >
          <p className="text-sm" style={{ color: "var(--text-3)" }}>
            관련 뉴스가 없습니다
          </p>
        </div>
      );
    }
    return (
      <div
        className="rounded-[20px] border"
        style={{
          background: "var(--bg-2)",
          borderColor: "var(--line)",
          padding: "0 16px",
        }}
      >
        {items.map((item, i) => (
          <div
            key={`${item.source}-${item.title}-${i}`}
            className="flex gap-2.5 py-3"
            style={i > 0 ? { borderTop: "1px solid var(--line)" } : {}}
          >
            <div
              className="w-14 h-14 rounded-[10px] shrink-0"
              style={{
                background: "var(--bg-3)",
                backgroundImage:
                  "repeating-linear-gradient(45deg, transparent, transparent 4px, rgba(255,255,255,0.03) 4px, rgba(255,255,255,0.03) 8px)",
              }}
            />
            <div className="flex-1 min-w-0 flex flex-col justify-center gap-0.5">
              <div
                className="text-[10px] uppercase tracking-wider font-semibold"
                style={{ color: "var(--text-3)" }}
              >
                {item.source}
              </div>
              <div
                className="text-[13px] font-semibold leading-snug"
                style={{ color: "var(--text-0)" }}
              >
                {item.title}
              </div>
              <div className="text-[11px]" style={{ color: "var(--text-3)" }}>
                {item.time}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <Tabs defaultValue={defaultTab}>
      <TabsList className="w-full mb-3">
        <TabsTrigger value="overseas">
          해외 {overseas.length > 0 && <span className="text-[11px] opacity-60">{overseas.length}</span>}
        </TabsTrigger>
        <TabsTrigger value="domestic">
          국내 {domestic.length > 0 && <span className="text-[11px] opacity-60">{domestic.length}</span>}
        </TabsTrigger>
      </TabsList>
      <TabsContent value="overseas">{renderList(overseas)}</TabsContent>
      <TabsContent value="domestic">{renderList(domestic)}</TabsContent>
    </Tabs>
  );
}
