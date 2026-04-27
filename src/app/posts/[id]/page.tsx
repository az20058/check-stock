"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { usePostDetail } from "@/hooks/queries";
import TabBar from "@/components/TabBar";
import type { BriefingSession } from "@/types/stock";

const SESSION_LABEL: Record<BriefingSession, string> = {
  us_close: "미국 마감 브리핑",
  us_pre: "미국 개장 전 브리핑",
  kr_close: "한국 마감 브리핑",
};

function formatShortDate(iso: string): string {
  const d = new Date(iso);
  const days = ["일", "월", "화", "수", "목", "금", "토"];
  return `${d.getMonth() + 1}월 ${d.getDate()}일 (${days[d.getDay()]})`;
}

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd} ${hh}:${mi}`;
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  return `${hh}:${mi}`;
}

function formatRelTime(unix: number): string {
  const ms = Date.now() - unix * 1000;
  const min = Math.floor(ms / 60000);
  if (min < 1) return "방금";
  if (min < 60) return `${min}분 전`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}시간 전`;
  const d = Math.floor(h / 24);
  return `${d}일 전`;
}

type SourceTab = "all" | "news-en" | "news-kr" | "macro" | "event";
type SourceType = "news-en" | "news-kr" | "macro" | "event";

interface SourceRow {
  type: SourceType;
  source: string;
  title: string;
  time: string;
  value?: string;
  url?: string;
  key: string;
}

const TYPE_ICON: Record<SourceType, { emoji: string; bg: string; border: string }> = {
  "news-en": { emoji: "📰", bg: "rgba(59,130,246,0.15)", border: "rgba(59,130,246,0.3)" },
  "news-kr": { emoji: "🇰🇷", bg: "rgba(34,197,94,0.15)", border: "rgba(34,197,94,0.3)" },
  macro: { emoji: "📊", bg: "rgba(168,85,247,0.15)", border: "rgba(168,85,247,0.3)" },
  event: { emoji: "📅", bg: "rgba(245,165,36,0.15)", border: "rgba(245,165,36,0.3)" },
};

export default function PostDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { data, isLoading, isError } = usePostDetail(id);
  const [tab, setTab] = useState<SourceTab>("all");

  const allSources = useMemo<SourceRow[]>(() => {
    if (!data) return [];
    const rows: SourceRow[] = [];
    data.sources?.marketNews?.forEach((n, i) => {
      rows.push({
        type: "news-en",
        source: n.source,
        title: n.headline,
        time: formatRelTime(n.datetime),
        url: n.url,
        key: `mn-${i}`,
      });
    });
    data.sources?.koreanNews?.forEach((n, i) => {
      rows.push({
        type: "news-kr",
        source: n.source || "Google News",
        title: n.title,
        time: "",
        key: `kn-${i}`,
      });
    });
    Object.entries(data.sources?.companyNews ?? {}).forEach(([ticker, items]) => {
      items.forEach((n, i) => {
        rows.push({
          type: "news-en",
          source: `${n.source} · ${ticker}`,
          title: n.headline,
          time: formatRelTime(n.datetime),
          key: `cn-${ticker}-${i}`,
        });
      });
    });
    data.briefing?.macros?.forEach((m, i) => {
      rows.push({
        type: "macro",
        source: m.label,
        title: m.label,
        time: "",
        value: `${m.value} (${m.delta})`,
        key: `ma-${i}`,
      });
    });
    data.sources?.economicEvents?.forEach((e, i) => {
      rows.push({
        type: "event",
        source: "Economic Calendar",
        title: e.event,
        time: e.time || "",
        key: `ev-${i}`,
      });
    });
    return rows;
  }, [data]);

  const counts = useMemo(() => {
    const c = { all: allSources.length, "news-en": 0, "news-kr": 0, macro: 0, event: 0 };
    allSources.forEach((s) => {
      c[s.type]++;
    });
    return c;
  }, [allSources]);

  const filtered = useMemo(
    () => (tab === "all" ? allSources : allSources.filter((s) => s.type === tab)),
    [allSources, tab],
  );

  if (isLoading) {
    return (
      <div className="relative h-dvh overflow-hidden" style={{ background: "var(--bg-1)" }}>
        <div className="overflow-y-auto h-full pt-[68px] pb-[calc(72px+env(safe-area-inset-bottom))] px-4 space-y-4">
          <div className="h-12 rounded-xl animate-pulse" style={{ background: "var(--bg-2)" }} />
          <div className="h-32 rounded-xl animate-pulse" style={{ background: "var(--bg-2)" }} />
          <div className="h-48 rounded-xl animate-pulse" style={{ background: "var(--bg-2)" }} />
          <div className="h-64 rounded-xl animate-pulse" style={{ background: "var(--bg-2)" }} />
        </div>
        <TabBar active="home" />
      </div>
    );
  }

  if (isError || !data || !data.briefing) {
    return (
      <div
        className="relative h-dvh overflow-hidden flex items-center justify-center"
        style={{ background: "var(--bg-1)" }}
      >
        <div className="text-center">
          <p style={{ color: "var(--text-1)" }}>포스트를 불러올 수 없습니다</p>
          <Link
            href="/"
            className="inline-block mt-3 px-4 py-2 rounded-lg text-sm font-semibold"
            style={{ background: "var(--accent)", color: "var(--text-0)" }}
          >
            홈으로
          </Link>
        </div>
      </div>
    );
  }

  const { market, briefing, session, startedAt, finishedAt, tokenUsage } = data;
  const isKR = market === "KR";
  const flag = isKR ? "🇰🇷" : "🇺🇸";
  const sessionLabel = `${flag} ${SESSION_LABEL[session]}`;
  const dateText = formatShortDate(startedAt);
  const generatedTime = finishedAt ? formatTime(finishedAt) : formatTime(startedAt);

  const durationStr = (() => {
    if (!finishedAt) return "—";
    const ms = new Date(finishedAt).getTime() - new Date(startedAt).getTime();
    if (!Number.isFinite(ms) || ms <= 0) return "—";
    return `${(ms / 1000).toFixed(1)}s`;
  })();

  const tabs: { id: SourceTab; label: string }[] = [
    { id: "all", label: "전체" },
    { id: "news-en", label: "📰 영문 뉴스" },
    { id: "news-kr", label: "🇰🇷 한국 뉴스" },
    { id: "macro", label: "📊 매크로" },
    { id: "event", label: "📅 이벤트" },
  ];

  return (
    <div className="relative h-dvh overflow-hidden" style={{ background: "var(--bg-1)" }}>
      {/* Sticky top nav */}
      <div
        className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between"
        style={{
          padding: "10px 14px",
          background: "rgba(11,15,25,0.85)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          borderBottom: "1px solid var(--line)",
        }}
      >
        <button
          aria-label="뒤로가기"
          onClick={() => router.back()}
          className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: "var(--bg-2)", border: "1px solid var(--line)" }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path
              d="M10 3L5 8l5 5"
              stroke="var(--text-1)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        <div className="text-center">
          <div className="text-[11px] font-semibold" style={{ color: "var(--text-2)" }}>
            {sessionLabel}
          </div>
          <div className="text-[13px] font-bold" style={{ color: "var(--text-0)" }}>
            {dateText}
          </div>
        </div>
        <div className="w-9 h-9" />
      </div>

      <div className="overflow-y-auto h-full pt-[68px] pb-[calc(72px+env(safe-area-inset-bottom))]">
        {/* Hero */}
        <div style={{ padding: "8px 20px 14px" }}>
          <div
            className="text-[11px] font-semibold uppercase tracking-widest"
            style={{ color: "var(--text-3)", marginBottom: 8, letterSpacing: "0.06em" }}
          >
            오늘의 헤드라인
          </div>
          <div
            style={{
              fontSize: 28,
              fontWeight: 800,
              lineHeight: 1.25,
              letterSpacing: "-0.02em",
              color: "var(--text-0)",
            }}
          >
            {briefing.headlineAccent && (
              <>
                <span style={{ color: "var(--accent)" }}>{briefing.headlineAccent}</span>
                <br />
              </>
            )}
            {briefing.headline}
          </div>
          {briefing.summary.tags.length > 0 && (
            <div className="flex gap-1.5 flex-wrap" style={{ marginTop: 14 }}>
              {briefing.summary.tags.map((t) => (
                <span
                  key={t}
                  className="inline-flex items-center text-xs font-medium rounded-full border"
                  style={{
                    height: 24,
                    padding: "0 10px",
                    background: "var(--bg-3)",
                    color: "var(--text-1)",
                    borderColor: "var(--line)",
                  }}
                >
                  #{t.replace(/^#/, "")}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* AI Full Summary */}
        <div style={{ padding: "0 16px" }}>
          <div
            className="rounded-[20px] border"
            style={{ background: "var(--bg-2)", borderColor: "var(--line)", padding: 18 }}
          >
            <div className="flex items-center gap-2" style={{ marginBottom: 12 }}>
              <span
                className="inline-block w-1.5 h-1.5 rounded-full"
                style={{ background: "var(--accent)" }}
              />
              <span
                className="text-[11px] font-semibold uppercase tracking-widest"
                style={{ color: "var(--accent)", letterSpacing: "0.06em" }}
              >
                AI 풀 요약
              </span>
              <span
                className="ml-auto text-[10px]"
                style={{ color: "var(--text-3)", fontFamily: "var(--font-mono, monospace)" }}
              >
                Claude Haiku 4.5 · {generatedTime}
              </span>
            </div>
            <div
              style={{
                fontSize: 16,
                fontWeight: 700,
                lineHeight: 1.55,
                letterSpacing: "-0.01em",
                color: "var(--text-0)",
                marginBottom: 12,
              }}
            >
              {briefing.summary.body}
            </div>
            {(() => {
              const long = briefing.summary.longBody?.trim();
              const fallback = briefing.summary.sub;
              const paragraphs = long
                ? long.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean)
                : fallback
                  ? [fallback]
                  : [];
              if (paragraphs.length === 0) return null;
              return (
                <div
                  style={{
                    fontSize: 13,
                    lineHeight: 1.7,
                    color: "var(--text-1)",
                    display: "flex",
                    flexDirection: "column",
                    gap: 12,
                  }}
                >
                  {paragraphs.map((p, i) => (
                    <p key={i} style={{ margin: 0 }}>
                      {p}
                    </p>
                  ))}
                </div>
              );
            })()}
            {briefing.summary.koreanContext && (
              <div
                className="rounded-[10px] border"
                style={{
                  marginTop: 14,
                  padding: "10px 12px",
                  background: "var(--bg-3)",
                  borderColor: "var(--line)",
                }}
              >
                <div
                  className="text-[11px] font-semibold uppercase tracking-widest"
                  style={{
                    color: "var(--text-3)",
                    letterSpacing: "0.06em",
                    marginBottom: 4,
                  }}
                >
                  한국 투자자 시각
                </div>
                <div style={{ fontSize: 12, lineHeight: 1.6, color: "var(--text-1)" }}>
                  {briefing.summary.koreanContext}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Causes */}
        {briefing.causes.length > 0 && (
          <>
            <div
              className="flex items-baseline justify-between"
              style={{ padding: "0 20px", marginTop: 24, marginBottom: 10 }}
            >
              <div
                className="text-lg font-bold"
                style={{ color: "var(--text-0)", letterSpacing: "-0.015em" }}
              >
                원인 분석{" "}
                <span style={{ color: "var(--accent)" }}>TOP {briefing.causes.length}</span>
              </div>
            </div>
            <div
              style={{ padding: "0 16px", display: "flex", flexDirection: "column", gap: 10 }}
            >
              {briefing.causes.map((c) => (
                <div
                  key={c.rank}
                  className="rounded-[14px] border"
                  style={{ padding: 16, background: "var(--bg-2)", borderColor: "var(--line)" }}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className="flex items-center justify-center shrink-0"
                      style={{
                        width: 22,
                        height: 22,
                        borderRadius: 7,
                        background:
                          c.rank === 1 ? "var(--accent-soft)" : "var(--bg-3)",
                        color: c.rank === 1 ? "var(--accent)" : "var(--text-0)",
                        border: `1px solid ${
                          c.rank === 1 ? "var(--accent-ring)" : "var(--line)"
                        }`,
                        fontFamily: "var(--font-mono, monospace)",
                        fontSize: 11,
                        fontWeight: 700,
                        marginTop: 1,
                      }}
                    >
                      {c.rank}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div
                        style={{
                          fontSize: 15,
                          fontWeight: 600,
                          letterSpacing: "-0.01em",
                          color: "var(--text-0)",
                          marginBottom: 6,
                        }}
                      >
                        {c.title}
                      </div>
                      <div
                        style={{
                          fontSize: 13,
                          lineHeight: 1.5,
                          color: "var(--text-1)",
                          marginBottom: c.impact || (c.evidence ?? 0) > 0 || c.tags.length > 0 ? 10 : 0,
                        }}
                      >
                        {c.desc}
                      </div>
                      {(c.impact || (c.evidence ?? 0) > 0) && (
                        <div
                          className="flex items-center"
                          style={{ gap: 10, marginBottom: c.tags.length > 0 ? 10 : 0 }}
                        >
                          {c.impact && (
                            <span
                              style={{
                                fontSize: 12,
                                fontWeight: 700,
                                color: "var(--down)",
                                fontFamily: "var(--font-mono, monospace)",
                                letterSpacing: "-0.01em",
                              }}
                            >
                              {c.impact}
                            </span>
                          )}
                          {c.impact && (c.evidence ?? 0) > 0 && (
                            <span
                              style={{
                                width: 1,
                                height: 10,
                                background: "var(--line)",
                              }}
                            />
                          )}
                          {(c.evidence ?? 0) > 0 && (
                            <span
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 4,
                                fontSize: 11,
                                color: "var(--text-2)",
                              }}
                            >
                              <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
                                <path
                                  d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z M14 2v6h6 M16 13H8 M16 17H8 M10 9H8"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                              근거 {c.evidence}건
                            </span>
                          )}
                        </div>
                      )}
                      {c.tags.length > 0 && (
                        <div className="flex gap-1.5 flex-wrap">
                          {c.tags.map((t) => (
                            <span
                              key={t}
                              className="inline-flex items-center text-[10px] rounded border"
                              style={{
                                height: 18,
                                padding: "0 6px",
                                background: "var(--bg-3)",
                                color: "var(--text-2)",
                                borderColor: "var(--line)",
                              }}
                            >
                              #{t.replace(/^#/, "")}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Sources */}
        {allSources.length > 0 && (
          <>
            <div
              className="flex items-baseline justify-between"
              style={{ padding: "0 20px", marginTop: 24, marginBottom: 10 }}
            >
              <div
                className="text-lg font-bold"
                style={{ color: "var(--text-0)", letterSpacing: "-0.015em" }}
              >
                참고 출처
              </div>
              <div className="text-xs" style={{ color: "var(--text-2)" }}>
                {allSources.length}건
              </div>
            </div>

            {/* Tabs */}
            <div
              className="flex gap-1.5 overflow-x-auto scrollbar-none"
              style={{
                padding: "0 16px 8px",
                scrollbarWidth: "none",
              }}
            >
              {tabs.map((t) => {
                const on = tab === t.id;
                const n = counts[t.id];
                return (
                  <button
                    key={t.id}
                    onClick={() => setTab(t.id)}
                    className="shrink-0 rounded-full text-xs font-bold whitespace-nowrap border"
                    style={{
                      padding: "6px 12px",
                      background: on ? "var(--accent-soft)" : "var(--bg-2)",
                      color: on ? "var(--accent)" : "var(--text-2)",
                      borderColor: on ? "var(--accent-ring)" : "var(--line)",
                    }}
                  >
                    {t.label} <span style={{ opacity: 0.7, marginLeft: 2 }}>{n}</span>
                  </button>
                );
              })}
            </div>

            {/* Source list */}
            <div style={{ padding: "0 16px" }}>
              <div
                className="rounded-[14px] border overflow-hidden"
                style={{ background: "var(--bg-2)", borderColor: "var(--line)" }}
              >
                {filtered.length === 0 ? (
                  <div
                    className="text-center text-xs"
                    style={{ padding: "20px 14px", color: "var(--text-3)" }}
                  >
                    이 카테고리의 출처가 없습니다
                  </div>
                ) : (
                  filtered.map((s, i) => {
                    const meta = TYPE_ICON[s.type];
                    const Wrapper = s.url ? "a" : "div";
                    return (
                      <Wrapper
                        key={s.key}
                        {...(s.url ? { href: s.url, target: "_blank", rel: "noreferrer" } : {})}
                        className="grid items-start"
                        style={{
                          gridTemplateColumns: "24px 1fr",
                          gap: 10,
                          padding: "14px",
                          borderTop: i > 0 ? "1px solid var(--line)" : "none",
                        }}
                      >
                        <div
                          className="flex items-center justify-center"
                          style={{
                            width: 24,
                            height: 24,
                            borderRadius: 6,
                            marginTop: 2,
                            background: meta.bg,
                            border: `1px solid ${meta.border}`,
                            fontSize: 11,
                          }}
                        >
                          {meta.emoji}
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <div
                            className="flex items-center gap-1.5"
                            style={{ marginBottom: 4 }}
                          >
                            <span
                              className="text-[11px] font-bold"
                              style={{ color: "var(--text-1)" }}
                            >
                              {s.source}
                            </span>
                            {s.time && (
                              <>
                                <span
                                  style={{
                                    width: 2,
                                    height: 2,
                                    borderRadius: 1,
                                    background: "var(--text-3)",
                                  }}
                                />
                                <span
                                  className="text-[10px]"
                                  style={{
                                    color: "var(--text-3)",
                                    fontFamily: "var(--font-mono, monospace)",
                                  }}
                                >
                                  {s.time}
                                </span>
                              </>
                            )}
                          </div>
                          <div
                            style={{
                              fontSize: 13,
                              fontWeight: 600,
                              lineHeight: 1.4,
                              color: "var(--text-0)",
                              marginBottom: s.value ? 6 : 0,
                            }}
                          >
                            {s.title}
                          </div>
                          {s.value && (
                            <div
                              style={{
                                fontSize: 12,
                                fontWeight: 700,
                                color: "var(--accent)",
                                fontFamily: "var(--font-mono, monospace)",
                              }}
                            >
                              {s.value}
                            </div>
                          )}
                        </div>
                      </Wrapper>
                    );
                  })
                )}
              </div>
            </div>
          </>
        )}

        {/* Pipeline metadata */}
        <div
          className="flex items-baseline justify-between"
          style={{ padding: "0 20px", marginTop: 24, marginBottom: 10 }}
        >
          <div
            className="text-lg font-bold"
            style={{ color: "var(--text-0)", letterSpacing: "-0.015em" }}
          >
            생성 정보
          </div>
        </div>
        <div style={{ padding: "0 16px" }}>
          <div
            className="rounded-[14px] border"
            style={{ background: "var(--bg-2)", borderColor: "var(--line)", padding: 14 }}
          >
            {[
              { k: "모델", v: "Claude Haiku 4.5", mono: false },
              { k: "수집 시각", v: formatDateTime(startedAt), mono: true },
              { k: "생성 시각", v: finishedAt ? formatDateTime(finishedAt) : "—", mono: true },
              { k: "소요 시간", v: durationStr, mono: true },
              {
                k: "토큰 사용",
                v: tokenUsage
                  ? `in ${tokenUsage.input.toLocaleString()} / out ${tokenUsage.output.toLocaleString()}`
                  : "—",
                mono: true,
              },
              { k: "뉴스 소스", v: "Finnhub · Google News · FRED", mono: false },
            ].map((row, i, arr) => (
              <div
                key={row.k}
                className="flex justify-between items-center"
                style={{
                  padding: "8px 0",
                  borderBottom: i < arr.length - 1 ? "1px solid var(--line)" : "none",
                }}
              >
                <span className="text-xs" style={{ color: "var(--text-2)" }}>
                  {row.k}
                </span>
                <span
                  className="text-xs font-semibold"
                  style={{
                    color: "var(--text-1)",
                    fontFamily: row.mono ? "var(--font-mono, monospace)" : "inherit",
                  }}
                >
                  {row.v}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Disclaimer */}
        <div
          style={{
            padding: "20px 20px 10px",
            fontSize: 10,
            color: "var(--text-3)",
            lineHeight: 1.55,
            letterSpacing: "0.01em",
          }}
        >
          AI가 수집된 1차 자료를 바탕으로 생성한 요약입니다. 인용된 출처를 직접 확인하시는 것을
          권장합니다.
        </div>
      </div>

      <TabBar active="home" />
    </div>
  );
}
