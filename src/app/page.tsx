"use client";

import Link from "next/link";
import TabBar from "@/components/TabBar";
import Avatar from "@/components/Avatar";
import Sparkline from "@/components/Sparkline";
import { useBriefing } from "@/hooks/queries";

export default function Home() {
  const { data, isLoading, isError } = useBriefing();

  if (isLoading) return (
    <div className="relative h-dvh overflow-hidden" style={{ background: "var(--bg-1)" }}>
      <div className="overflow-y-auto h-full pt-3 pb-[96px] px-4 space-y-4">
        <div className="h-16 rounded-xl animate-pulse" style={{ background: "var(--bg-2)" }} />
        <div className="h-24 rounded-xl animate-pulse" style={{ background: "var(--bg-2)" }} />
        <div className="h-48 rounded-xl animate-pulse" style={{ background: "var(--bg-2)" }} />
        <div className="h-64 rounded-xl animate-pulse" style={{ background: "var(--bg-2)" }} />
      </div>
      <TabBar active="home" />
    </div>
  );

  if (isError || !data) return (
    <div className="relative h-dvh overflow-hidden flex items-center justify-center" style={{ background: "var(--bg-1)" }}>
      <div className="text-center">
        <p style={{ color: "var(--text-1)" }}>데이터를 불러올 수 없습니다</p>
        <button onClick={() => window.location.reload()} className="mt-3 px-4 py-2 rounded-lg text-sm font-semibold" style={{ background: "var(--accent)", color: "var(--text-0)" }}>
          다시 시도
        </button>
      </div>
    </div>
  );

  return (
    <div
      className="relative h-dvh overflow-hidden"
      style={{ background: "var(--bg-1)" }}
    >
      {/* Scrollable content */}
      <div className="overflow-y-auto h-full pt-3 pb-[96px]">

        {/* Hero greeting */}
        <div style={{ padding: "14px 20px 6px" }}>
          <p
            className="text-xs font-medium"
            style={{ color: "var(--text-2)" }}
          >
            {data.date}
          </p>
          <h1
            className="text-[26px] font-extrabold tracking-tight leading-tight mt-1"
            style={{ color: "var(--text-0)" }}
          >
            {data.headline}{" "}
            <span style={{ color: "var(--accent)" }}>{data.headlineAccent}</span>
          </h1>
        </div>

        {/* Index ticker row */}
        <div className="flex gap-2 overflow-x-auto px-5 py-2 scrollbar-none" style={{ scrollbarWidth: "none" }}>
          {data.indices.map((idx) => {
            const up = idx.changePct >= 0;
            const changeStr = (up ? "+" : "") + idx.changePct.toFixed(2) + "%";
            return (
              <div
                key={idx.label}
                className="min-w-[118px] shrink-0 rounded-[14px] border"
                style={{
                  padding: "10px 12px",
                  background: "var(--bg-2)",
                  borderColor: "var(--line)",
                }}
              >
                <div
                  className="text-[11px] font-semibold"
                  style={{ color: "var(--text-2)" }}
                >
                  {idx.label}
                </div>
                <div
                  className="font-mono text-sm font-semibold mt-0.5"
                  style={{ color: "var(--text-0)" }}
                >
                  {idx.value.toLocaleString()}
                </div>
                <div
                  className="font-mono text-[11px] mt-0.5"
                  style={{ color: up ? "var(--up)" : "var(--down)" }}
                >
                  {changeStr}
                </div>
              </div>
            );
          })}
        </div>

        {/* Market TL;DR card */}
        <div style={{ padding: "14px 16px 12px" }}>
          <div
            className="rounded-[20px] border"
            style={{
              background:
                "linear-gradient(180deg, rgba(59,130,246,0.08) 0%, rgba(59,130,246,0) 100%)",
              borderColor: "var(--accent-ring)",
              padding: "18px",
            }}
          >
            {/* Header dot + label */}
            <div className="flex items-center gap-2 mb-3">
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ background: "var(--accent)" }}
              />
              <span
                className="text-[11px] font-semibold uppercase tracking-widest"
                style={{ color: "var(--accent)" }}
              >
                오늘의 시장 요약
              </span>
            </div>

            {/* Main text */}
            <p
              className="text-[17px] font-bold leading-relaxed"
              style={{ color: "var(--text-0)" }}
            >
              {data.summary.body}
            </p>

            {/* Sub text */}
            <p
              className="text-[13px] mt-2"
              style={{ color: "var(--text-1)" }}
            >
              {data.summary.sub}
            </p>

            {/* Tags */}
            <div className="flex gap-1.5 flex-wrap mt-3">
              {data.summary.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-xs rounded-full border h-6 flex items-center px-2.5"
                  style={{
                    background: "var(--bg-3)",
                    color: "var(--text-1)",
                    borderColor: "var(--line)",
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* 내 관심 종목 변동 section */}
        <div className="px-4 mt-1">
          {/* Section header */}
          <div className="flex items-center justify-between mb-2 px-1">
            <h2
              className="text-lg font-bold"
              style={{ color: "var(--text-0)" }}
            >
              내 관심 종목 변동
            </h2>
            <span
              className="text-xs"
              style={{ color: "var(--text-2)" }}
            >
              전체보기
            </span>
          </div>

          {/* Mover items */}
          <div className="flex flex-col gap-2">
            {data.movers.map((m) => {
              const up = m.changePct >= 0;
              const pctStr = (up ? "+" : "") + m.changePct.toFixed(2) + "%";
              const priceStr = "$" + m.price.toFixed(2);
              return (
                <Link
                  key={m.ticker}
                  href={`/report/${m.ticker}`}
                  className="flex items-center gap-3 rounded-[14px] border"
                  style={{
                    padding: "12px 14px",
                    background: "var(--bg-2)",
                    borderColor: "var(--line)",
                  }}
                >
                  <Avatar ticker={m.ticker} />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span
                        className="font-mono text-sm font-semibold"
                        style={{ color: "var(--text-0)" }}
                      >
                        {m.ticker}
                      </span>
                      <span
                        className="text-[11px]"
                        style={{ color: "var(--text-2)" }}
                      >
                        {m.name}
                      </span>
                    </div>
                    <div
                      className="text-[11px] mt-0.5 truncate"
                      style={{ color: "var(--text-3)" }}
                    >
                      {m.reason}
                    </div>
                  </div>

                  <Sparkline data={m.sparkline} up={up} width={52} height={22} />

                  <div className="text-right shrink-0">
                    <div
                      className="font-mono text-sm font-semibold"
                      style={{ color: up ? "var(--up)" : "var(--down)" }}
                    >
                      {pctStr}
                    </div>
                    <div
                      className="font-mono text-[11px]"
                      style={{ color: "var(--text-2)" }}
                    >
                      {priceStr}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* 매크로 지표 section */}
        <div className="px-4 mt-4">
          <div className="flex items-center justify-between mb-2 px-1">
            <h2
              className="text-lg font-bold"
              style={{ color: "var(--text-0)" }}
            >
              매크로 지표
            </h2>
            <span
              className="text-xs"
              style={{ color: "var(--text-2)" }}
            >
              어제 기준
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {data.macros.map((m) => (
              <div
                key={m.label}
                className="rounded-xl border p-3"
                style={{
                  background: "var(--bg-2)",
                  borderColor: "var(--line)",
                }}
              >
                <div
                  className="text-[10px] uppercase tracking-widest font-semibold"
                  style={{ color: "var(--text-3)" }}
                >
                  {m.label}
                </div>
                <div
                  className="font-mono text-base font-semibold mt-1"
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

        {/* 오늘 주목 포인트 section */}
        <div className="px-4 mt-4">
          <div className="flex items-center justify-between mb-2 px-1">
            <h2
              className="text-lg font-bold"
              style={{ color: "var(--text-0)" }}
            >
              오늘 주목 포인트
            </h2>
          </div>

          <div className="flex flex-col gap-2">
            {data.events.map((ev) => (
              <div
                key={ev.title}
                className="rounded-[14px] border"
                style={{
                  padding: "14px",
                  background: "var(--bg-2)",
                  borderColor: "var(--line)",
                }}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span
                    className="font-mono text-[11px] font-semibold"
                    style={{ color: "var(--text-2)" }}
                  >
                    {ev.time}
                  </span>
                  <span
                    className="text-[11px] font-semibold rounded-full px-2 h-5 flex items-center"
                    style={{
                      background: ev.important
                        ? "var(--accent-soft)"
                        : "var(--bg-3)",
                      color: ev.important ? "var(--accent)" : "var(--text-1)",
                      border: "1px solid",
                      borderColor: ev.important
                        ? "var(--accent-ring)"
                        : "var(--line)",
                    }}
                  >
                    {ev.tag}
                  </span>
                </div>
                <p
                  className="text-[15px] font-bold"
                  style={{ color: "var(--text-0)" }}
                >
                  {ev.title}
                </p>
                <p
                  className="text-[12px] mt-0.5"
                  style={{ color: "var(--text-2)" }}
                >
                  {ev.desc}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Disclaimer */}
        <p
          className="text-[10px]"
          style={{ color: "var(--text-3)", padding: "20px 20px 10px" }}
        >
          본 서비스는 정보 제공을 목적으로 하며 투자 조언이 아닙니다. 모든
          투자 결정의 책임은 이용자에게 있습니다.
        </p>
      </div>

      <TabBar active="home" />
    </div>
  );
}
