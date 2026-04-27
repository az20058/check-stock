"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { usePostDetail } from "@/hooks/queries";
import { formatPrice, formatPct } from "@/lib/format";
import TabBar from "@/components/TabBar";
import Avatar from "@/components/Avatar";
import type { BriefingSession } from "@/types/stock";

const SESSION_LABEL: Record<BriefingSession, string> = {
  us_close: "미국 마감 브리핑",
  us_pre: "미국 개장 전 브리핑",
  kr_close: "한국 마감 브리핑",
};

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  const yy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  return `${yy}.${mm}.${dd} ${hh}:${mi}`;
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

export default function PostDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { data, isLoading, isError } = usePostDetail(id);

  if (isLoading) {
    return (
      <div className="relative h-dvh overflow-hidden" style={{ background: "var(--bg-1)" }}>
        <div className="overflow-y-auto h-full pt-3 pb-[calc(64px+env(safe-area-inset-bottom))] px-4 space-y-4">
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

  const { market, briefing, sources, session } = data;
  const isKR = market === "KR";
  const sessionLabel = SESSION_LABEL[session];
  const flag = isKR ? "🇰🇷" : "🇺🇸";

  return (
    <div className="relative h-dvh overflow-hidden" style={{ background: "var(--bg-1)" }}>
      <div className="overflow-y-auto h-full pt-3 pb-[calc(64px+env(safe-area-inset-bottom))]">
        {/* Top bar */}
        <div className="flex items-center justify-between px-4 pt-1.5">
          <button
            className="w-9 h-9 rounded-xl flex items-center justify-center border"
            style={{ background: "var(--bg-2)", borderColor: "var(--line)" }}
            aria-label="뒤로가기"
            onClick={() => router.back()}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path
                d="M15 19l-7-7 7-7"
                stroke="var(--text-1)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <div className="flex flex-col items-center gap-0.5">
            <span className="text-[11px] font-semibold" style={{ color: "var(--text-2)" }}>
              {flag} {sessionLabel}
            </span>
            <span className="font-mono text-[11px]" style={{ color: "var(--text-3)" }}>
              {formatDateTime(data.startedAt)}
            </span>
          </div>
          <div className="w-9" />
        </div>

        {/* Headline */}
        <div className="px-5 pt-5">
          <p className="text-xs font-medium" style={{ color: "var(--text-2)" }}>
            {briefing.dateLabel}
          </p>
          <h1
            className="text-[26px] font-extrabold tracking-tight leading-tight mt-1"
            style={{ color: "var(--text-0)" }}
          >
            <span style={{ color: "var(--accent)" }}>{briefing.headlineAccent}</span>
            <br />
            {briefing.headline}
          </h1>
        </div>

        {/* Indices */}
        {briefing.indices.length > 0 && (
          <div
            className="flex gap-2 overflow-x-auto px-5 py-3 scrollbar-none"
            style={{ scrollbarWidth: "none" }}
          >
            {briefing.indices.map((idx) => {
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
                  <div className="text-[11px] font-semibold" style={{ color: "var(--text-2)" }}>
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
        )}

        {/* Summary card */}
        <div style={{ padding: "10px 16px 12px" }}>
          <div
            className="rounded-[20px] border"
            style={{
              background:
                "linear-gradient(180deg, rgba(59,130,246,0.08) 0%, rgba(59,130,246,0) 100%)",
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
                {briefing.summary.title || "시장 요약"}
              </span>
            </div>
            <p
              className="text-[17px] font-bold leading-relaxed"
              style={{ color: "var(--text-0)" }}
            >
              {briefing.summary.body}
            </p>
            <p className="text-[13px] mt-2" style={{ color: "var(--text-1)" }}>
              {briefing.summary.sub}
            </p>
            {briefing.summary.tags.length > 0 && (
              <div className="flex gap-1.5 flex-wrap mt-3">
                {briefing.summary.tags.map((tag) => (
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
            )}
          </div>
        </div>

        {/* Causes */}
        {briefing.causes.length > 0 && (
          <div className="px-4 mt-2">
            <h2 className="text-lg font-bold px-1 mb-2" style={{ color: "var(--text-0)" }}>
              핵심 원인 <span style={{ color: "var(--accent)" }}>TOP {briefing.causes.length}</span>
            </h2>
            <div className="flex flex-col gap-2">
              {briefing.causes.map((c) => (
                <div
                  key={c.rank}
                  className="flex gap-3 rounded-[14px] border"
                  style={{
                    padding: "14px",
                    background: "var(--bg-2)",
                    borderColor: "var(--line)",
                  }}
                >
                  <div
                    className="flex items-center justify-center shrink-0 w-7 h-7 rounded-lg text-sm font-bold"
                    style={{
                      background: c.rank === 1 ? "var(--accent)" : "var(--bg-3)",
                      color: c.rank === 1 ? "#fff" : "var(--text-1)",
                    }}
                  >
                    {c.rank}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[15px] font-bold" style={{ color: "var(--text-0)" }}>
                      {c.title}
                    </p>
                    <p
                      className="text-[12px] mt-1 leading-relaxed"
                      style={{ color: "var(--text-2)" }}
                    >
                      {c.desc}
                    </p>
                    {c.tags.length > 0 && (
                      <div className="flex gap-1.5 mt-2 flex-wrap">
                        {c.tags.map((tag) => (
                          <span
                            key={tag}
                            className="text-[10px] rounded-full border h-5 flex items-center px-2"
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
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Movers */}
        {briefing.movers.length > 0 && (
          <div className="px-4 mt-4">
            <h2 className="text-lg font-bold px-1 mb-2" style={{ color: "var(--text-0)" }}>
              주요 종목 변동
            </h2>
            <div className="flex flex-col gap-2">
              {briefing.movers.map((mv) => {
                const up = mv.changePct >= 0;
                return (
                  <Link
                    key={mv.ticker}
                    href={`/report/${mv.ticker}`}
                    className="flex items-center gap-3 rounded-[14px] border"
                    style={{
                      padding: "12px 14px",
                      background: "var(--bg-2)",
                      borderColor: "var(--line)",
                    }}
                  >
                    <Avatar ticker={isKR ? mv.nameKo.slice(0, 2) : mv.ticker} />
                    <div className="flex-1 min-w-0">
                      <div
                        className="text-[13px] font-bold"
                        style={{
                          color: "var(--text-0)",
                          fontFamily: isKR ? "var(--font-sans)" : "var(--font-mono, monospace)",
                        }}
                      >
                        {isKR ? mv.nameKo : mv.ticker}
                      </div>
                      <div
                        className="text-[11px] mt-0.5"
                        style={{ color: "var(--text-3)" }}
                      >
                        {mv.reason}
                      </div>
                    </div>
                    <div className="text-right shrink-0" style={{ minWidth: 58 }}>
                      <div
                        className="font-mono text-sm font-semibold"
                        style={{ color: up ? "var(--up)" : "var(--down)" }}
                      >
                        {formatPct(mv.changePct)}
                      </div>
                      <div
                        className="font-mono text-[11px]"
                        style={{ color: "var(--text-2)" }}
                      >
                        {formatPrice(mv.price, mv.currency)}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* Macros */}
        {briefing.macros.length > 0 && (
          <div className="px-4 mt-4">
            <h2 className="text-lg font-bold px-1 mb-2" style={{ color: "var(--text-0)" }}>
              매크로 지표
            </h2>
            <div className="grid grid-cols-2 gap-2">
              {briefing.macros.map((macro) => (
                <div
                  key={macro.label}
                  className="rounded-xl border p-3"
                  style={{ background: "var(--bg-2)", borderColor: "var(--line)" }}
                >
                  <div
                    className="text-[10px] uppercase tracking-widest font-semibold"
                    style={{ color: "var(--text-3)" }}
                  >
                    {macro.label}
                  </div>
                  <div
                    className="font-mono text-base font-semibold mt-1"
                    style={{ color: "var(--text-0)" }}
                  >
                    {macro.value}
                  </div>
                  <div
                    className="font-mono text-[11px] mt-0.5"
                    style={{ color: macro.up ? "var(--up)" : "var(--down)" }}
                  >
                    {macro.delta}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Events */}
        {briefing.events.length > 0 && (
          <div className="px-4 mt-4">
            <h2 className="text-lg font-bold px-1 mb-2" style={{ color: "var(--text-0)" }}>
              주목 포인트
            </h2>
            <div className="flex flex-col gap-2">
              {briefing.events.map((ev) => (
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
                        background: ev.important ? "var(--accent-soft)" : "var(--bg-3)",
                        color: ev.important ? "var(--accent)" : "var(--text-1)",
                        border: "1px solid",
                        borderColor: ev.important ? "var(--accent-ring)" : "var(--line)",
                      }}
                    >
                      {ev.tag}
                    </span>
                  </div>
                  <p className="text-[15px] font-bold" style={{ color: "var(--text-0)" }}>
                    {ev.title}
                  </p>
                  <p className="text-[12px] mt-0.5" style={{ color: "var(--text-2)" }}>
                    {ev.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Sources */}
        {sources && (
          <div className="px-4 mt-6">
            <div className="flex items-center justify-between px-1 mb-2">
              <h2 className="text-lg font-bold" style={{ color: "var(--text-0)" }}>
                소스 정보
              </h2>
              <span className="text-[11px]" style={{ color: "var(--text-3)" }}>
                AI가 참고한 원문
              </span>
            </div>

            {sources.marketNews?.length > 0 && (
              <div className="mb-3">
                <p
                  className="text-[11px] font-semibold uppercase tracking-widest px-1 mb-1.5"
                  style={{ color: "var(--text-3)" }}
                >
                  시장 뉴스 ({sources.marketNews.length})
                </p>
                <div
                  className="rounded-[14px] border"
                  style={{ background: "var(--bg-2)", borderColor: "var(--line)" }}
                >
                  {sources.marketNews.map((n, i) => (
                    <a
                      key={`${n.url}-${i}`}
                      href={n.url}
                      target="_blank"
                      rel="noreferrer"
                      className="block px-4 py-3"
                      style={i > 0 ? { borderTop: "1px solid var(--line)" } : {}}
                    >
                      <div
                        className="text-[10px] uppercase tracking-wider font-semibold"
                        style={{ color: "var(--text-3)" }}
                      >
                        {n.source} · {formatRelTime(n.datetime)}
                      </div>
                      <div
                        className="text-[13px] font-semibold leading-snug mt-0.5"
                        style={{ color: "var(--text-0)" }}
                      >
                        {n.headline}
                      </div>
                      {n.summary && (
                        <div
                          className="text-[11px] mt-1 line-clamp-2"
                          style={{ color: "var(--text-2)" }}
                        >
                          {n.summary}
                        </div>
                      )}
                    </a>
                  ))}
                </div>
              </div>
            )}

            {sources.koreanNews?.length > 0 && (
              <div className="mb-3">
                <p
                  className="text-[11px] font-semibold uppercase tracking-widest px-1 mb-1.5"
                  style={{ color: "var(--text-3)" }}
                >
                  국내 뉴스 ({sources.koreanNews.length})
                </p>
                <div
                  className="rounded-[14px] border"
                  style={{ background: "var(--bg-2)", borderColor: "var(--line)" }}
                >
                  {sources.koreanNews.map((n, i) => (
                    <div
                      key={`${n.title}-${i}`}
                      className="px-4 py-3"
                      style={i > 0 ? { borderTop: "1px solid var(--line)" } : {}}
                    >
                      <div
                        className="text-[10px] uppercase tracking-wider font-semibold"
                        style={{ color: "var(--text-3)" }}
                      >
                        {n.source || "Google News"}
                      </div>
                      <div
                        className="text-[13px] font-semibold leading-snug mt-0.5"
                        style={{ color: "var(--text-0)" }}
                      >
                        {n.title}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {Object.keys(sources.companyNews ?? {}).length > 0 && (
              <div className="mb-3">
                <p
                  className="text-[11px] font-semibold uppercase tracking-widest px-1 mb-1.5"
                  style={{ color: "var(--text-3)" }}
                >
                  종목별 뉴스
                </p>
                <div className="flex flex-col gap-2">
                  {Object.entries(sources.companyNews).map(([ticker, items]) => (
                    items.length > 0 && (
                      <div
                        key={ticker}
                        className="rounded-[14px] border"
                        style={{ background: "var(--bg-2)", borderColor: "var(--line)" }}
                      >
                        <div
                          className="px-4 py-2 font-mono text-[11px] font-bold"
                          style={{
                            color: "var(--text-0)",
                            borderBottom: "1px solid var(--line)",
                          }}
                        >
                          {ticker}
                        </div>
                        {items.map((n, i) => (
                          <div
                            key={`${ticker}-${n.datetime}-${i}`}
                            className="px-4 py-2.5"
                            style={i > 0 ? { borderTop: "1px solid var(--line)" } : {}}
                          >
                            <div
                              className="text-[10px] uppercase tracking-wider font-semibold"
                              style={{ color: "var(--text-3)" }}
                            >
                              {n.source} · {formatRelTime(n.datetime)}
                            </div>
                            <div
                              className="text-[12px] font-semibold leading-snug mt-0.5"
                              style={{ color: "var(--text-0)" }}
                            >
                              {n.headline}
                            </div>
                          </div>
                        ))}
                      </div>
                    )
                  ))}
                </div>
              </div>
            )}

            {sources.economicEvents?.length > 0 && (
              <div className="mb-3">
                <p
                  className="text-[11px] font-semibold uppercase tracking-widest px-1 mb-1.5"
                  style={{ color: "var(--text-3)" }}
                >
                  경제 일정 ({sources.economicEvents.length})
                </p>
                <div
                  className="rounded-[14px] border"
                  style={{ background: "var(--bg-2)", borderColor: "var(--line)" }}
                >
                  {sources.economicEvents.map((e, i) => (
                    <div
                      key={`${e.event}-${i}`}
                      className="px-4 py-2.5 flex items-baseline gap-2"
                      style={i > 0 ? { borderTop: "1px solid var(--line)" } : {}}
                    >
                      <span
                        className="font-mono text-[11px] shrink-0"
                        style={{ color: "var(--text-2)" }}
                      >
                        {e.time || "—"}
                      </span>
                      <span
                        className="text-[12px] flex-1"
                        style={{ color: "var(--text-0)" }}
                      >
                        {e.event}
                      </span>
                      <span
                        className="text-[10px] uppercase font-semibold shrink-0"
                        style={{
                          color: e.impact === "high" ? "var(--up)" : "var(--text-3)",
                        }}
                      >
                        {e.impact}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="mt-6 mx-4 mb-2">
          <p
            className="text-[11px] leading-relaxed text-center"
            style={{ color: "var(--text-3)" }}
          >
            AI가 뉴스·시장 데이터를 해석한 결과이며 투자 조언이 아닙니다.
            <br />
            데이터 출처: Finnhub, Google News, FRED.
          </p>
        </div>
      </div>

      <TabBar active="home" />
    </div>
  );
}
