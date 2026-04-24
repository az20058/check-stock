# Mock 제거 및 실데이터 전환 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 모든 API 라우트에서 mock 데이터를 제거하고 Finnhub/Claude/Supabase 실데이터로 전환. Watchlist는 클라이언트 localStorage로 이동.

**Architecture:** 5단계 전환 — (1) 종목 메타데이터 정적 테이블 생성, (2) Finnhub 클라이언트 확장 (검색/캔들/프로필), (3) API 라우트 실데이터 전환, (4) Watchlist를 localStorage 훅으로 이동, (5) Mock 코드 정리 및 MSW 제거.

**Tech Stack:** Next.js App Router, Finnhub API, Claude Haiku (anthropic SDK), Supabase, React Query, localStorage

---

## File Structure

| Action | Path | Responsibility |
|--------|------|---------------|
| Create | `src/lib/data/stock-meta.ts` | 주요 종목 한국어명/섹터 정적 매핑 |
| Create | `src/lib/clients/finnhub-search.ts` | Finnhub Symbol Search API |
| Create | `src/lib/clients/finnhub-candles.ts` | Finnhub Stock Candles API |
| Create | `src/lib/report/generate.ts` | 실시간 리포트 생성 (Finnhub + Claude) |
| Create | `src/lib/report/cache.ts` | Supabase 리포트 캐시 (6시간 TTL) |
| Create | `src/hooks/useLocalWatchlist.ts` | localStorage 기반 watchlist 훅 |
| Create | `src/app/api/stocks/quotes/route.ts` | 복수 종목 실시간 시세 조회 |
| Modify | `src/app/api/briefing/route.ts` | mock fallback 제거 |
| Modify | `src/app/api/stocks/search/route.ts` | Finnhub 검색으로 교체 |
| Modify | `src/app/api/stocks/[ticker]/report/route.ts` | 실시간 생성 + 캐시 |
| Modify | `src/lib/briefing/build.ts` | stocksMap mock 의존 제거 |
| Modify | `src/lib/ai/pipeline.ts` | mockBriefing fallback 제거 |
| Modify | `src/hooks/queries.ts` | watchlist 훅 교체 |
| Modify | `src/app/watchlist/page.tsx` | localStorage 훅 사용 |
| Modify | `src/app/report/[ticker]/page.tsx` | localStorage 훅 사용 |
| Modify | `src/app/layout.tsx` | MSWProvider 제거 |
| Delete | `src/app/api/watchlist/route.ts` | 서버 watchlist API 삭제 |
| Delete | `src/app/api/watchlist/[ticker]/route.ts` | 서버 watchlist API 삭제 |
| Delete | `src/lib/server/watchlist-store.ts` | 메모리 저장소 삭제 |
| Delete | `src/mocks/` | 전체 mock 디렉토리 삭제 |

---

### Task 1: 종목 메타데이터 정적 테이블

**Files:**
- Create: `src/lib/data/stock-meta.ts`

- [ ] **Step 1: 종목 메타 데이터 파일 생성**

```typescript
// src/lib/data/stock-meta.ts

/** 주요 종목 한국어명·섹터 매핑 (mock이 아닌 정적 참조 데이터) */
export interface StockMeta {
  nameKo: string;
  sector: string;
}

export const STOCK_META: Record<string, StockMeta> = {
  NVDA: { nameKo: "엔비디아", sector: "반도체" },
  TSLA: { nameKo: "테슬라", sector: "전기차" },
  AAPL: { nameKo: "애플", sector: "기술" },
  MSFT: { nameKo: "마이크로소프트", sector: "기술" },
  GOOGL: { nameKo: "구글", sector: "기술" },
  AMZN: { nameKo: "아마존", sector: "이커머스" },
  META: { nameKo: "메타", sector: "기술" },
  AVGO: { nameKo: "브로드컴", sector: "반도체" },
  TSM: { nameKo: "TSMC", sector: "반도체" },
  "BRK.B": { nameKo: "버크셔해서웨이", sector: "금융" },
  AMD: { nameKo: "AMD", sector: "반도체" },
  NFLX: { nameKo: "넷플릭스", sector: "미디어" },
  INTC: { nameKo: "인텔", sector: "반도체" },
  CRM: { nameKo: "세일즈포스", sector: "기술" },
  ORCL: { nameKo: "오라클", sector: "기술" },
  ADBE: { nameKo: "어도비", sector: "기술" },
  QCOM: { nameKo: "퀄컴", sector: "반도체" },
  PYPL: { nameKo: "페이팔", sector: "핀테크" },
  UBER: { nameKo: "우버", sector: "모빌리티" },
  COIN: { nameKo: "코인베이스", sector: "암호화폐" },
  PLTR: { nameKo: "팔란티어", sector: "AI/데이터" },
  SNOW: { nameKo: "스노우플레이크", sector: "클라우드" },
  SQ: { nameKo: "블록(스퀘어)", sector: "핀테크" },
  SHOP: { nameKo: "쇼피파이", sector: "이커머스" },
  SPOT: { nameKo: "스포티파이", sector: "미디어" },
  BA: { nameKo: "보잉", sector: "항공" },
  DIS: { nameKo: "디즈니", sector: "미디어" },
  V: { nameKo: "비자", sector: "금융" },
  MA: { nameKo: "마스터카드", sector: "금융" },
  JPM: { nameKo: "JP모건", sector: "금융" },
  BAC: { nameKo: "뱅크오브아메리카", sector: "금융" },
  WMT: { nameKo: "월마트", sector: "유통" },
  KO: { nameKo: "코카콜라", sector: "소비재" },
  PEP: { nameKo: "펩시", sector: "소비재" },
  JNJ: { nameKo: "존슨앤존슨", sector: "헬스케어" },
  PFE: { nameKo: "화이자", sector: "헬스케어" },
  UNH: { nameKo: "유나이티드헬스", sector: "헬스케어" },
  XOM: { nameKo: "엑슨모빌", sector: "에너지" },
  CVX: { nameKo: "쉐브론", sector: "에너지" },
  LLY: { nameKo: "일라이릴리", sector: "헬스케어" },
  NVO: { nameKo: "노보노디스크", sector: "헬스케어" },
  COST: { nameKo: "코스트코", sector: "유통" },
  HD: { nameKo: "홈디포", sector: "유통" },
  MCD: { nameKo: "맥도날드", sector: "소비재" },
  SBUX: { nameKo: "스타벅스", sector: "소비재" },
  NKE: { nameKo: "나이키", sector: "소비재" },
  ARM: { nameKo: "ARM", sector: "반도체" },
  SMCI: { nameKo: "슈퍼마이크로", sector: "서버/HW" },
  MSTR: { nameKo: "마이크로스트래티지", sector: "암호화폐" },
  SOFI: { nameKo: "소파이", sector: "핀테크" },
};

export function getStockMeta(ticker: string): StockMeta | undefined {
  return STOCK_META[ticker.toUpperCase()];
}
```

- [ ] **Step 2: lint + tsc 확인**

Run: `npx eslint src/lib/data/stock-meta.ts && npx tsc --noEmit`
Expected: 에러 없음

- [ ] **Step 3: 커밋**

```bash
git add src/lib/data/stock-meta.ts
git commit -m "feat: 종목 한국어명/섹터 정적 메타 테이블 추가"
```

---

### Task 2: Finnhub 클라이언트 확장 (검색 + 캔들)

**Files:**
- Create: `src/lib/clients/finnhub-search.ts`
- Create: `src/lib/clients/finnhub-candles.ts`

- [ ] **Step 1: Finnhub Symbol Search 클라이언트 생성**

```typescript
// src/lib/clients/finnhub-search.ts

export interface FinnhubSearchResult {
  symbol: string;
  description: string;
  type: string;
}

export async function searchSymbols(query: string): Promise<FinnhubSearchResult[]> {
  const key = process.env.FINNHUB_API_KEY;
  if (!key) throw new Error("FINNHUB_API_KEY not set");

  const res = await fetch(
    `https://finnhub.io/api/v1/search?q=${encodeURIComponent(query)}&token=${key}`,
    { next: { revalidate: 300 } },
  );
  if (!res.ok) throw new Error(`Finnhub search ${res.status}`);

  const data = (await res.json()) as { result: FinnhubSearchResult[] };
  return (data.result ?? [])
    .filter((r) => r.type === "Common Stock")
    .slice(0, 20);
}
```

- [ ] **Step 2: Finnhub Stock Candles 클라이언트 생성**

```typescript
// src/lib/clients/finnhub-candles.ts

import type { TimeRange } from "@/types/stock";

interface FinnhubCandleResponse {
  c: number[];  // close prices
  s: string;    // status: "ok" | "no_data"
}

const RESOLUTION_MAP: Record<TimeRange, { resolution: string; daysBack: number }> = {
  "1D": { resolution: "5", daysBack: 1 },
  "1W": { resolution: "30", daysBack: 7 },
  "1M": { resolution: "D", daysBack: 30 },
  "3M": { resolution: "D", daysBack: 90 },
  "1Y": { resolution: "W", daysBack: 365 },
  "ALL": { resolution: "M", daysBack: 365 * 5 },
};

export async function fetchCandles(
  symbol: string,
  range: TimeRange,
): Promise<number[]> {
  const key = process.env.FINNHUB_API_KEY;
  if (!key) throw new Error("FINNHUB_API_KEY not set");

  const { resolution, daysBack } = RESOLUTION_MAP[range];
  const to = Math.floor(Date.now() / 1000);
  const from = to - daysBack * 86400;

  const res = await fetch(
    `https://finnhub.io/api/v1/stock/candle?symbol=${encodeURIComponent(symbol)}&resolution=${resolution}&from=${from}&to=${to}&token=${key}`,
    { next: { revalidate: 300 } },
  );
  if (!res.ok) throw new Error(`Finnhub candles ${res.status}`);

  const data = (await res.json()) as FinnhubCandleResponse;
  if (data.s !== "ok" || !data.c?.length) return [];
  return data.c;
}

export async function fetchAllCandles(
  symbol: string,
): Promise<Record<TimeRange, number[]>> {
  const ranges: TimeRange[] = ["1D", "1W", "1M", "3M", "1Y", "ALL"];
  const results = await Promise.allSettled(
    ranges.map((r) => fetchCandles(symbol, r)),
  );
  const chartData: Record<string, number[]> = {};
  ranges.forEach((r, i) => {
    const res = results[i];
    chartData[r] = res.status === "fulfilled" ? res.value : [];
  });
  return chartData as Record<TimeRange, number[]>;
}
```

- [ ] **Step 3: lint + tsc 확인**

Run: `npx eslint src/lib/clients/finnhub-search.ts src/lib/clients/finnhub-candles.ts && npx tsc --noEmit`
Expected: 에러 없음

- [ ] **Step 4: 커밋**

```bash
git add src/lib/clients/finnhub-search.ts src/lib/clients/finnhub-candles.ts
git commit -m "feat: Finnhub 검색/캔들 API 클라이언트 추가"
```

---

### Task 3: 리포트 생성 + Supabase 캐시

**Files:**
- Create: `src/lib/report/generate.ts`
- Create: `src/lib/report/cache.ts`

- [ ] **Step 1: Supabase 리포트 캐시 모듈 생성**

```typescript
// src/lib/report/cache.ts

import "server-only";
import { getServerClient } from "@/lib/clients/supabase";
import type { StockReport } from "@/types/stock";

const TABLE = "stock_reports";
const CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6시간

export async function getCachedReport(ticker: string): Promise<StockReport | null> {
  const supa = getServerClient();
  const { data, error } = await supa
    .from(TABLE)
    .select("report_data, created_at")
    .eq("ticker", ticker.toUpperCase())
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) return null;

  const age = Date.now() - new Date(data.created_at).getTime();
  if (age > CACHE_TTL_MS) return null;

  return data.report_data as StockReport;
}

export async function saveReport(ticker: string, report: StockReport): Promise<void> {
  const supa = getServerClient();
  await supa.from(TABLE).upsert(
    {
      ticker: ticker.toUpperCase(),
      report_data: report,
      created_at: new Date().toISOString(),
    },
    { onConflict: "ticker" },
  );
}
```

- [ ] **Step 2: 리포트 생성 모듈 생성**

```typescript
// src/lib/report/generate.ts

import "server-only";
import { fetchQuotes } from "@/lib/clients/finnhub";
import { fetchCompanyNews } from "@/lib/collectors/company-news";
import { fetchMacros } from "@/lib/collectors/macros";
import { fetchAllCandles } from "@/lib/clients/finnhub-candles";
import { callClaudeJson } from "@/lib/clients/anthropic";
import { getStockMeta } from "@/lib/data/stock-meta";
import type { StockReport, Stock, Cause, NewsItem, SectorComparison } from "@/types/stock";

const REPORT_SYSTEM = `너는 한국어 증권 리서치 애널리스트다.
개별 종목의 최근 움직임을 분석하여 개인 투자자가 이해할 수 있게 정리한다.
뉴스·데이터에 근거해서만 답하고, 투자 권유는 하지 않는다.`.trim();

const reportJsonSchema = {
  type: "object",
  properties: {
    aiSummary: {
      type: "string",
      description: "종목 움직임 한 줄 요약 (40~80자, 한국어)",
    },
    causes: {
      type: "array",
      items: {
        type: "object",
        properties: {
          rank: { type: "number" },
          title: { type: "string", description: "원인 제목 (한국어, 20자 내외)" },
          desc: { type: "string", description: "상세 설명 (한국어, 50~100자)" },
          tags: { type: "array", items: { type: "string" }, maxItems: 3 },
        },
        required: ["rank", "title", "desc", "tags"],
      },
      maxItems: 3,
    },
    sectorComparisons: {
      type: "array",
      items: {
        type: "object",
        properties: {
          label: { type: "string" },
          changePct: { type: "number" },
          widthPct: { type: "number" },
          primary: { type: "boolean" },
        },
        required: ["label", "changePct", "widthPct", "primary"],
      },
    },
  },
  required: ["aiSummary", "causes", "sectorComparisons"],
} as const;

interface ClaudeReportOutput {
  aiSummary: string;
  causes: Cause[];
  sectorComparisons: SectorComparison[];
}

export async function generateReport(ticker: string): Promise<StockReport> {
  const upperTicker = ticker.toUpperCase();
  const meta = getStockMeta(upperTicker);

  // 병렬 데이터 수집
  const [quotesRes, newsRes, macrosRes, candlesRes] = await Promise.allSettled([
    fetchQuotes([upperTicker]),
    fetchCompanyNews(upperTicker, 6),
    fetchMacros(),
    fetchAllCandles(upperTicker),
  ]);

  const quotes = quotesRes.status === "fulfilled" ? quotesRes.value : [];
  const companyNews = newsRes.status === "fulfilled" ? newsRes.value : [];
  const macros = macrosRes.status === "fulfilled" ? macrosRes.value : [];
  const chartData = candlesRes.status === "fulfilled" ? candlesRes.value : {
    "1D": [], "1W": [], "1M": [], "3M": [], "1Y": [], "ALL": [],
  };

  const quote = quotes.find((q) => q.symbol === upperTicker);
  if (!quote) throw new Error(`No quote data for ${upperTicker}`);

  const price = quote.c;
  const changePct = quote.dp;
  const change = price - price / (1 + changePct / 100);

  const stock: Stock = {
    ticker: upperTicker,
    name: meta?.nameKo ?? upperTicker,
    nameKo: meta?.nameKo ?? upperTicker,
    exchange: "",
    sector: meta?.sector ?? "",
    price,
    change,
    changePct,
    sparkline: chartData["1D"].slice(-8),
  };

  // Claude 분석
  const direction = changePct >= 0 ? "상승" : "하락";
  const newsText = companyNews
    .slice(0, 6)
    .map((n, i) => `${i + 1}. [${n.source}] ${n.headline}${n.summary ? ` — ${n.summary.slice(0, 120)}` : ""}`)
    .join("\n");

  const userPrompt = `종목: ${stock.nameKo} (${upperTicker})
오늘 ${Math.abs(changePct).toFixed(2)}% ${direction}. 현재가 $${price.toFixed(2)}.

[최근 뉴스]
${newsText || "(관련 뉴스 없음)"}

[매크로]
${macros.map((m) => `- ${m.label}: ${m.value} (${m.delta})`).join("\n") || "(없음)"}

위 정보를 바탕으로:
1. aiSummary: 이 종목의 움직임을 한 줄로 요약 (40~80자)
2. causes: 움직임의 원인 TOP 3 (rank, title, desc, tags)
3. sectorComparisons: 이 종목 vs 섹터 vs S&P 500 비교 (changePct, widthPct 포함)`;

  const claudeRes = await callClaudeJson<ClaudeReportOutput>({
    system: REPORT_SYSTEM,
    user: userPrompt,
    toolName: "submit_report",
    toolDescription: "종목 분석 리포트를 제출한다",
    inputSchema: reportJsonSchema,
    maxTokens: 1000,
  });

  // 뉴스를 NewsItem 형태로 변환
  const newsItems: NewsItem[] = companyNews.slice(0, 4).map((n) => {
    const ago = Math.round((Date.now() / 1000 - n.datetime) / 3600);
    return {
      source: n.source.toUpperCase(),
      title: n.headline,
      time: ago > 0 ? `${ago}시간 전` : "방금",
    };
  });

  return {
    stock,
    aiSummary: claudeRes.data.aiSummary,
    causes: claudeRes.data.causes,
    sectorComparisons: claudeRes.data.sectorComparisons,
    news: newsItems,
    macros,
    chartData,
  };
}
```

- [ ] **Step 3: lint + tsc 확인**

Run: `npx eslint src/lib/report/generate.ts src/lib/report/cache.ts && npx tsc --noEmit`
Expected: 에러 없음

- [ ] **Step 4: 커밋**

```bash
git add src/lib/report/generate.ts src/lib/report/cache.ts
git commit -m "feat: 리포트 실시간 생성 + Supabase 캐시 모듈"
```

---

### Task 4: API 라우트 실데이터 전환

**Files:**
- Modify: `src/app/api/briefing/route.ts`
- Modify: `src/app/api/stocks/search/route.ts`
- Modify: `src/app/api/stocks/[ticker]/report/route.ts`
- Create: `src/app/api/stocks/quotes/route.ts`
- Modify: `src/lib/briefing/build.ts`
- Modify: `src/lib/ai/pipeline.ts`

- [ ] **Step 1: `/api/briefing` mock fallback 제거**

`src/app/api/briefing/route.ts`를 다음으로 교체:

```typescript
import { NextResponse } from "next/server";
import { fetchQuotes } from "@/lib/clients/finnhub";
import { getLatestSnapshot } from "@/lib/briefing/storage";
import { getStockMeta } from "@/lib/data/stock-meta";
import type { BriefingData, MarketIndex, Stock } from "@/types/stock";
import { MOVER_TICKERS } from "@/lib/briefing/build";

const indexSymbolMap: { label: string; symbol: string }[] = [
  { label: "SPY", symbol: "SPY" },
  { label: "QQQ", symbol: "QQQ" },
  { label: "DIA", symbol: "DIA" },
  { label: "VIX", symbol: "^VIX" },
];

export const dynamic = "force-dynamic";

export async function GET() {
  // 1. Supabase 스냅샷 조회
  const snapshot = await getLatestSnapshot();
  if (!snapshot?.briefing_data) {
    return NextResponse.json(
      { error: "브리핑 데이터가 아직 생성되지 않았습니다. 배치를 실행해주세요." },
      { status: 503 },
    );
  }

  const snap = snapshot.briefing_data;

  // 2. 실시간 시세 오버레이
  const symbols = [
    ...indexSymbolMap.map((x) => x.symbol),
    ...MOVER_TICKERS,
  ];

  let quotes: Awaited<ReturnType<typeof fetchQuotes>> = [];
  try {
    quotes = await fetchQuotes(symbols);
  } catch {
    // 시세 조회 실패 시 스냅샷 데이터만 사용
  }

  const bySymbol = new Map(quotes.map((q) => [q.symbol, q]));

  // indices 구성
  const indices: MarketIndex[] = indexSymbolMap.map(({ label, symbol }) => {
    const q = bySymbol.get(symbol);
    return { label, value: q?.c ?? 0, changePct: q?.dp ?? 0 };
  });

  // movers 구성
  const movers = snap.movers.map((m) => {
    const q = bySymbol.get(m.ticker);
    const meta = getStockMeta(m.ticker);
    const price = q?.c ?? 0;
    const changePct = q?.dp ?? 0;
    const change = price - price / (1 + changePct / 100);
    return {
      ticker: m.ticker,
      name: meta?.nameKo ?? m.ticker,
      nameKo: meta?.nameKo ?? m.ticker,
      exchange: "",
      sector: meta?.sector ?? "",
      price,
      change,
      changePct,
      sparkline: [] as number[],
      reason: m.reason,
    };
  });

  const briefing: BriefingData = {
    date: snap.date ?? "",
    headline: snap.headline ?? "",
    headlineAccent: snap.headlineAccent ?? "",
    indices,
    summary: snap.summary ?? { title: "", body: "", sub: "", tags: [] },
    movers,
    macros: snap.macros?.length ? snap.macros : [],
    events: snap.events?.length ? snap.events : [],
  };

  return NextResponse.json(briefing);
}
```

- [ ] **Step 2: `/api/stocks/search` Finnhub 검색으로 교체**

`src/app/api/stocks/search/route.ts`를 다음으로 교체:

```typescript
import { NextResponse } from "next/server";
import { searchSymbols } from "@/lib/clients/finnhub-search";
import { getStockMeta } from "@/lib/data/stock-meta";
import type { Stock } from "@/types/stock";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const q = (url.searchParams.get("q") || "").trim();
  if (!q) return NextResponse.json([]);

  try {
    const results = await searchSymbols(q);
    const stocks: Stock[] = results.map((r) => {
      const meta = getStockMeta(r.symbol);
      return {
        ticker: r.symbol,
        name: r.description,
        nameKo: meta?.nameKo ?? r.description,
        exchange: "",
        sector: meta?.sector ?? "",
        price: 0,
        change: 0,
        changePct: 0,
        sparkline: [],
      };
    });
    return NextResponse.json(stocks);
  } catch {
    return NextResponse.json([], { status: 500 });
  }
}
```

- [ ] **Step 3: `/api/stocks/[ticker]/report` 실시간 생성 + 캐시**

`src/app/api/stocks/[ticker]/report/route.ts`를 다음으로 교체:

```typescript
import { NextResponse } from "next/server";
import { getCachedReport, saveReport } from "@/lib/report/cache";
import { generateReport } from "@/lib/report/generate";

export const maxDuration = 30;

export async function GET(
  _: Request,
  { params }: { params: Promise<{ ticker: string }> },
) {
  const { ticker } = await params;
  const upper = ticker.toUpperCase();

  // 1. 캐시 확인
  try {
    const cached = await getCachedReport(upper);
    if (cached) return NextResponse.json(cached);
  } catch {
    // 캐시 조회 실패 — 생성 진행
  }

  // 2. 실시간 생성
  try {
    const report = await generateReport(upper);

    // 3. 비동기로 캐시 저장 (응답 블로킹 안 함)
    saveReport(upper, report).catch(() => {});

    return NextResponse.json(report);
  } catch (err) {
    const message = err instanceof Error ? err.message : "리포트 생성 실패";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
```

- [ ] **Step 4: `/api/stocks/quotes` 신규 라우트 생성**

```typescript
// src/app/api/stocks/quotes/route.ts

import { NextResponse } from "next/server";
import { fetchQuotes } from "@/lib/clients/finnhub";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const tickers = (url.searchParams.get("tickers") || "")
    .split(",")
    .map((t) => t.trim().toUpperCase())
    .filter(Boolean);

  if (tickers.length === 0) {
    return NextResponse.json([]);
  }

  try {
    const quotes = await fetchQuotes(tickers);
    return NextResponse.json(quotes);
  } catch {
    return NextResponse.json([], { status: 500 });
  }
}
```

- [ ] **Step 5: `build.ts`에서 mock 의존 제거**

`src/lib/briefing/build.ts`의 `stocksMap` import를 `stock-meta`로 교체:

```typescript
// 변경 전:
// import { stocksMap } from "@/mocks/data/stocks";

// 변경 후:
import { getStockMeta } from "@/lib/data/stock-meta";
```

그리고 `movers` 생성 부분을 수정:

```typescript
// 변경 전:
// const movers = MOVER_TICKERS.map((t) => {
//   const s = stocksMap[t];
//   const q = quotes.find((x) => x.symbol === t);
//   return {
//     ticker: t,
//     nameKo: s.nameKo,
//     changePct: q?.dp ?? s.changePct,
//   };
// });

// 변경 후:
const movers = MOVER_TICKERS.map((t) => {
  const meta = getStockMeta(t);
  const q = quotes.find((x) => x.symbol === t);
  return {
    ticker: t,
    nameKo: meta?.nameKo ?? t,
    changePct: q?.dp ?? 0,
  };
});
```

- [ ] **Step 6: `pipeline.ts`에서 mock fallback 제거**

`src/lib/ai/pipeline.ts`에서:

```typescript
// 삭제:
// import { briefingData as mockBriefing } from "@/mocks/data/briefing";

// events catch 블록 변경:
// 변경 전:
//   } catch {
//     events = mockBriefing.events;
//   }

// 변경 후:
  } catch {
    events = [];
  }
```

- [ ] **Step 7: lint + tsc 확인**

Run: `npx eslint src/app/api/briefing/route.ts src/app/api/stocks/search/route.ts src/app/api/stocks/\[ticker\]/report/route.ts src/app/api/stocks/quotes/route.ts src/lib/briefing/build.ts src/lib/ai/pipeline.ts && npx tsc --noEmit`
Expected: 에러 없음

- [ ] **Step 8: 커밋**

```bash
git add src/app/api/briefing/route.ts src/app/api/stocks/search/route.ts "src/app/api/stocks/[ticker]/report/route.ts" src/app/api/stocks/quotes/route.ts src/lib/briefing/build.ts src/lib/ai/pipeline.ts
git commit -m "feat: API 라우트 실데이터 전환 — mock fallback 제거"
```

---

### Task 5: Watchlist를 localStorage 훅으로 이동

**Files:**
- Create: `src/hooks/useLocalWatchlist.ts`
- Modify: `src/hooks/queries.ts`
- Modify: `src/app/watchlist/page.tsx`
- Modify: `src/app/report/[ticker]/page.tsx`

- [ ] **Step 1: localStorage 기반 watchlist 훅 생성**

```typescript
// src/hooks/useLocalWatchlist.ts

"use client";

import { useCallback, useSyncExternalStore } from "react";

const STORAGE_KEY = "check-stock:watchlist";
const DEFAULT_TICKERS = ["NVDA", "TSLA", "AAPL", "MSFT", "GOOGL", "AMZN", "META", "AVGO", "TSM"];

function getTickers(): string[] {
  if (typeof window === "undefined") return DEFAULT_TICKERS;
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return DEFAULT_TICKERS;
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : DEFAULT_TICKERS;
  } catch {
    return DEFAULT_TICKERS;
  }
}

function setTickers(tickers: string[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tickers));
  window.dispatchEvent(new StorageEvent("storage", { key: STORAGE_KEY }));
}

let snapshotCache = getTickers();

function subscribe(callback: () => void) {
  const handler = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY || e.key === null) {
      snapshotCache = getTickers();
      callback();
    }
  };
  window.addEventListener("storage", handler);
  return () => window.removeEventListener("storage", handler);
}

function getSnapshot(): string[] {
  return snapshotCache;
}

function getServerSnapshot(): string[] {
  return DEFAULT_TICKERS;
}

export function useLocalWatchlist() {
  const tickers = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const add = useCallback((ticker: string) => {
    const current = getTickers();
    const upper = ticker.toUpperCase();
    if (!current.includes(upper)) {
      setTickers([...current, upper]);
      snapshotCache = [...current, upper];
    }
  }, []);

  const remove = useCallback((ticker: string) => {
    const current = getTickers();
    const upper = ticker.toUpperCase();
    setTickers(current.filter((t) => t !== upper));
    snapshotCache = current.filter((t) => t !== upper);
  }, []);

  const isWatched = useCallback(
    (ticker: string) => tickers.includes(ticker.toUpperCase()),
    [tickers],
  );

  return { tickers, add, remove, isWatched };
}
```

- [ ] **Step 2: `queries.ts`에서 watchlist 관련 훅 제거하고 quotes 훅 추가**

`src/hooks/queries.ts`를 다음으로 교체:

```typescript
import { useQuery } from "@tanstack/react-query";
import type { BriefingData, StockReport, Stock } from "@/types/stock";
import type { FinnhubQuote } from "@/lib/clients/finnhub";

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json() as Promise<T>;
}

export function useBriefing() {
  return useQuery({
    queryKey: ["briefing"],
    queryFn: () => fetchJson<BriefingData>("/api/briefing"),
  });
}

export function useStockReport(ticker: string) {
  return useQuery({
    queryKey: ["report", ticker],
    queryFn: () => fetchJson<StockReport>(`/api/stocks/${ticker}/report`),
    enabled: !!ticker,
  });
}

export function useSearchStocks(query: string) {
  return useQuery({
    queryKey: ["search", query],
    queryFn: () => fetchJson<Stock[]>(`/api/stocks/search?q=${encodeURIComponent(query)}`),
    enabled: query.length >= 1,
  });
}

export function useStockQuotes(tickers: string[]) {
  return useQuery({
    queryKey: ["quotes", tickers.join(",")],
    queryFn: () =>
      fetchJson<FinnhubQuote[]>(
        `/api/stocks/quotes?tickers=${tickers.join(",")}`,
      ),
    enabled: tickers.length > 0,
    refetchInterval: 60_000,
  });
}
```

- [ ] **Step 3: `watchlist/page.tsx`를 localStorage 훅 사용으로 수정**

`src/app/watchlist/page.tsx`의 import 및 데이터 로딩 부분을 수정:

변경 전:
```typescript
import { useWatchlist } from "@/hooks/queries";
// ...
const { data, isLoading, isError } = useWatchlist();
// ...
const { stocks, mostMentioned } = data;
```

변경 후:
```typescript
import { useLocalWatchlist } from "@/hooks/useLocalWatchlist";
import { useStockQuotes } from "@/hooks/queries";
import { getStockMeta } from "@/lib/data/stock-meta";
// ...
const { tickers } = useLocalWatchlist();
const { data: quotes, isLoading, isError } = useStockQuotes(tickers);

// quotes를 Stock[] 형태로 변환
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
```

그리고 "가장 많이 언급된" 섹션은 실데이터가 없으므로 제거합니다.

- [ ] **Step 4: `report/[ticker]/page.tsx`를 localStorage 훅 사용으로 수정**

변경 전:
```typescript
import { useStockReport, useWatchlist, useToggleWatchlist } from "@/hooks/queries";
// ...
const { data: watchlistData } = useWatchlist();
const { add, remove } = useToggleWatchlist();
// ...
const watched = isWatched(watchlistData?.stocks, ticker);
```

변경 후:
```typescript
import { useStockReport } from "@/hooks/queries";
import { useLocalWatchlist } from "@/hooks/useLocalWatchlist";
// ...
const { isWatched, add, remove } = useLocalWatchlist();
// ...
const watched = isWatched(ticker);
```

그리고 toggle 버튼의 onClick도 수정:

변경 전:
```typescript
onClick={() => watched ? remove.mutate(ticker) : add.mutate(ticker)}
```

변경 후:
```typescript
onClick={() => watched ? remove(ticker) : add(ticker)}
```

- [ ] **Step 5: lint + tsc 확인**

Run: `npx eslint src/hooks/useLocalWatchlist.ts src/hooks/queries.ts src/app/watchlist/page.tsx src/app/report/\\[ticker\\]/page.tsx && npx tsc --noEmit`
Expected: 에러 없음

- [ ] **Step 6: 커밋**

```bash
git add src/hooks/useLocalWatchlist.ts src/hooks/queries.ts src/app/watchlist/page.tsx "src/app/report/[ticker]/page.tsx"
git commit -m "feat: watchlist를 localStorage 훅으로 이동"
```

---

### Task 6: Mock 코드 정리 및 MSW 제거

**Files:**
- Delete: `src/app/api/watchlist/route.ts`
- Delete: `src/app/api/watchlist/[ticker]/route.ts`
- Delete: `src/lib/server/watchlist-store.ts`
- Delete: `src/mocks/` (전체 디렉토리)
- Modify: `src/app/layout.tsx`

- [ ] **Step 1: watchlist API 라우트 삭제**

```bash
rm src/app/api/watchlist/route.ts
rm src/app/api/watchlist/\[ticker\]/route.ts
rmdir src/app/api/watchlist/\[ticker\]
rmdir src/app/api/watchlist
```

- [ ] **Step 2: watchlist-store 삭제**

```bash
rm src/lib/server/watchlist-store.ts
```

- [ ] **Step 3: mocks 디렉토리 전체 삭제**

```bash
rm -rf src/mocks
```

- [ ] **Step 4: `layout.tsx`에서 MSWProvider 제거**

변경 전:
```typescript
import MSWProvider from "@/mocks/MSWProvider";
// ...
<MSWProvider>
  <QueryProvider>{children}</QueryProvider>
</MSWProvider>
```

변경 후:
```typescript
// MSWProvider import 삭제
// ...
<QueryProvider>{children}</QueryProvider>
```

- [ ] **Step 5: mock import가 남아있지 않은지 확인**

Run: `grep -r "from \"@/mocks" src/ && echo "MOCK IMPORTS FOUND" || echo "ALL CLEAN"`
Expected: "ALL CLEAN"

- [ ] **Step 6: lint + tsc 확인**

Run: `npx eslint src/app/layout.tsx && npx tsc --noEmit`
Expected: 에러 없음

- [ ] **Step 7: 커밋**

```bash
git add -A
git commit -m "chore: mock 데이터·MSW·서버 watchlist 전체 삭제"
```

---

### Task 7: Supabase stock_reports 테이블 생성

- [ ] **Step 1: Supabase 대시보드 또는 SQL로 테이블 생성**

```sql
CREATE TABLE IF NOT EXISTS stock_reports (
  ticker TEXT PRIMARY KEY,
  report_data JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_stock_reports_created_at ON stock_reports (created_at DESC);
```

이 SQL은 Supabase 대시보드의 SQL Editor에서 실행합니다.

- [ ] **Step 2: 전체 빌드 확인**

Run: `npx tsc --noEmit && npx next build`
Expected: 빌드 성공

- [ ] **Step 3: 최종 커밋 (빌드 확인용)**

필요시 수정 후 커밋.
