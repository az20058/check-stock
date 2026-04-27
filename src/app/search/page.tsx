"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import TabBar from "@/components/TabBar";
import Avatar from "@/components/Avatar";
import { useSearchStocks } from "@/hooks/queries";
import { useLocalWatchlist } from "@/hooks/useLocalWatchlist";
import type { Stock } from "@/types/stock";

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const { data: results, isLoading } = useSearchStocks(query.trim());
  const { add, remove, isWatched } = useLocalWatchlist();

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  function toggleWatch(ticker: string) {
    if (isWatched(ticker)) {
      remove(ticker);
    } else {
      add(ticker);
    }
  }

  return (
    <div
      className="relative h-dvh overflow-hidden"
      style={{ background: "var(--bg-1)" }}
    >
      <div className="overflow-y-auto h-full pt-3 pb-[calc(72px+env(safe-area-inset-bottom))]">
        {/* Search input */}
        <div className="px-4 pt-2 pb-3">
          <div
            className="flex items-center gap-2.5 rounded-[14px] border px-3.5 h-11"
            style={{ background: "var(--bg-2)", borderColor: "var(--line)" }}
          >
            <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 shrink-0">
              <circle cx="11" cy="11" r="6.5" stroke="var(--text-3)" strokeWidth="2"/>
              <path d="M20 20l-4-4" stroke="var(--text-3)" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="종목명 또는 티커 검색"
              className="flex-1 bg-transparent outline-none text-sm"
              style={{ color: "var(--text-0)" }}
            />
            {query && (
              <button onClick={() => setQuery("")} className="shrink-0">
                <svg viewBox="0 0 20 20" className="w-5 h-5">
                  <circle cx="10" cy="10" r="8" fill="var(--bg-3)"/>
                  <path d="M7 7l6 6M13 7l-6 6" stroke="var(--text-2)" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Results */}
        {query.trim().length === 0 && (
          <div className="flex flex-col items-center justify-center pt-20">
            <svg viewBox="0 0 24 24" fill="none" className="w-12 h-12 mb-3">
              <circle cx="11" cy="11" r="6.5" stroke="var(--text-3)" strokeWidth="1.5"/>
              <path d="M20 20l-4-4" stroke="var(--text-3)" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            <p className="text-sm" style={{ color: "var(--text-3)" }}>
              종목명이나 티커를 입력하세요
            </p>
          </div>
        )}

        {query.trim().length > 0 && isLoading && (
          <div className="px-4 space-y-3 mt-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-14 rounded-xl animate-pulse" style={{ background: "var(--bg-2)" }} />
            ))}
          </div>
        )}

        {query.trim().length > 0 && !isLoading && results && results.length === 0 && (
          <div className="flex flex-col items-center justify-center pt-20">
            <p className="text-sm" style={{ color: "var(--text-3)" }}>
              검색 결과가 없습니다
            </p>
          </div>
        )}

        {results && results.length > 0 && (
          <div className="px-4">
            <div
              className="rounded-[14px] border overflow-hidden"
              style={{ background: "var(--bg-2)", borderColor: "var(--line)" }}
            >
              {results.map((s: Stock, i: number) => {
                const watched = isWatched(s.ticker);
                return (
                  <div
                    key={s.ticker}
                    className="flex items-center gap-3"
                    style={{
                      padding: "12px 16px",
                      borderBottom: i < results.length - 1 ? "1px solid var(--line)" : "none",
                    }}
                  >
                    <Link href={`/report/${s.ticker}`} className="flex items-center gap-3 flex-1 min-w-0">
                      <Avatar ticker={s.ticker} />
                      <div className="min-w-0">
                        <div className="font-mono text-sm font-bold" style={{ color: "var(--text-0)" }}>
                          {s.market === "US" ? "\u{1F1FA}\u{1F1F8}" : "\u{1F1F0}\u{1F1F7}"}{" "}
                          {s.market === "KR" ? s.nameKo : s.ticker}
                        </div>
                        <div className="text-[11px] truncate" style={{ color: "var(--text-2)" }}>
                          {s.market === "KR" ? s.ticker : s.nameKo}
                          {s.sector ? ` \u00B7 ${s.sector}` : ""}
                        </div>
                      </div>
                    </Link>
                    <button
                      onClick={() => toggleWatch(s.ticker)}
                      className="shrink-0 flex items-center justify-center w-9 h-9 rounded-full"
                      style={{ background: watched ? "var(--accent-soft)" : "var(--bg-3)" }}
                    >
                      <svg viewBox="0 0 24 24" fill={watched ? "var(--accent)" : "none"} className="w-5 h-5">
                        <path
                          d="M12 21s-7-4.5-7-10a4 4 0 017-2.6A4 4 0 0119 11c0 5.5-7 10-7 10z"
                          stroke={watched ? "var(--accent)" : "var(--text-3)"}
                          strokeWidth="2"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <TabBar active="search" />
    </div>
  );
}
