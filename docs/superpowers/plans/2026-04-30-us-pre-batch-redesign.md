# us_pre 배치 데이터/프롬프트 재설계 — 구현 plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** us_pre 배치가 "오늘 밤 미국장" 관점의 본문을 생성하도록 Yahoo 프리마켓 호가를 추가 수집하고 us_pre 프롬프트를 4섹션으로 라벨링한다.

**Architecture:** 기존 Finnhub 수집 경로는 그대로 두고 (UI/storage 호환), us_pre 분기에서만 Yahoo extended quote를 추가 호출한다. 결과를 `preMarketSnapshot`으로 가공해 `runAiPipeline` → `buildUsPreMarketUser`에 전달. 출력 schema는 변경하지 않는다.

**Tech Stack:** TypeScript, Next.js App Router, yahoo-finance2, Anthropic SDK, vitest

**Spec:** [docs/superpowers/specs/2026-04-30-us-pre-batch-redesign-design.md](docs/superpowers/specs/2026-04-30-us-pre-batch-redesign-design.md)

---

## File Structure

| 파일 | 작업 | 책임 |
|---|---|---|
| `src/lib/clients/yahoo.ts` | Modify | `YahooExtendedQuote` 인터페이스 + `fetchYahooExtendedQuotes()` 추가. 기존 `fetchYahooQuotes` 유지 |
| `src/lib/clients/yahoo.test.ts` | Create | `fetchYahooExtendedQuotes` 매핑 테스트 (vitest, yahoo-finance2 mock) |
| `src/lib/ai/prompts.ts` | Modify | `usPreMarketSystem` 강화 + `buildUsPreMarketUser` 시그니처 확장 + 4섹션 라벨링 + `PreMarketSnapshot` export |
| `src/lib/ai/prompts.test.ts` | Create | `buildUsPreMarketUser` 4섹션·결측 fallback·"오늘 밤" 강제 지시 검증 |
| `src/lib/ai/pipeline.ts` | Modify | `runAiPipeline` args에 `preMarketSnapshot?: PreMarketSnapshot[]` + `prevIndicesForPre?` 추가 (타입은 `prompts`에서 import), us_pre 분기에서 새 인자로 `buildUsPreMarketUser` 호출 |
| `src/lib/briefing/build.ts` | Modify | us_pre 분기에서 `fetchYahooExtendedQuotes` 호출, `preMarketSnapshot`/`prevIndicesForPre` 가공, `runAiPipeline`에 전달 |

---

## Task 1: Yahoo extended quote fetcher (TDD)

**Files:**
- Create: `src/lib/clients/yahoo.test.ts`
- Modify: `src/lib/clients/yahoo.ts`

- [ ] **Step 1.1: Write the failing test**

Create `src/lib/clients/yahoo.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from "vitest";

const mockQuote = vi.fn();

vi.mock("yahoo-finance2", () => ({
  default: class {
    quote = mockQuote;
  },
}));

import { fetchYahooExtendedQuotes } from "./yahoo";

describe("fetchYahooExtendedQuotes", () => {
  beforeEach(() => {
    mockQuote.mockReset();
  });

  it("maps preMarket fields correctly", async () => {
    mockQuote.mockResolvedValueOnce({
      symbol: "SPY",
      regularMarketPrice: 700,
      regularMarketChangePercent: -0.5,
      preMarketPrice: 702,
      preMarketChangePercent: 0.3,
      marketState: "PRE",
    });

    const result = await fetchYahooExtendedQuotes(["SPY"]);

    expect(result).toEqual([
      {
        symbol: "SPY",
        c: 700,
        dp: -0.5,
        preMarketPrice: 702,
        preMarketChangePercent: 0.3,
        marketState: "PRE",
      },
    ]);
  });

  it("returns null for missing preMarket fields", async () => {
    mockQuote.mockResolvedValueOnce({
      symbol: "SPY",
      regularMarketPrice: 700,
      regularMarketChangePercent: -0.5,
    });

    const result = await fetchYahooExtendedQuotes(["SPY"]);

    expect(result[0].preMarketPrice).toBeNull();
    expect(result[0].preMarketChangePercent).toBeNull();
    expect(result[0].marketState).toBeNull();
  });

  it("skips rejected symbols and keeps fulfilled ones", async () => {
    mockQuote
      .mockRejectedValueOnce(new Error("network"))
      .mockResolvedValueOnce({
        symbol: "QQQ",
        regularMarketPrice: 600,
        regularMarketChangePercent: 1.0,
        preMarketPrice: 605,
        preMarketChangePercent: 0.8,
        marketState: "PRE",
      });

    const result = await fetchYahooExtendedQuotes(["SPY", "QQQ"]);

    expect(result).toHaveLength(1);
    expect(result[0].symbol).toBe("QQQ");
  });

  it("returns empty array when symbols list is empty", async () => {
    const result = await fetchYahooExtendedQuotes([]);
    expect(result).toEqual([]);
    expect(mockQuote).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 1.2: Run test to verify it fails**

```bash
npx vitest run src/lib/clients/yahoo.test.ts
```

Expected: FAIL — `fetchYahooExtendedQuotes` not exported from `./yahoo`.

- [ ] **Step 1.3: Implement fetchYahooExtendedQuotes**

Modify `src/lib/clients/yahoo.ts` — add the new interface and function below the existing `fetchYahooQuotes` (do not touch the existing function or `toYahooSymbol`/`KR_INDEX_SYMBOLS`):

```ts
export interface YahooExtendedQuote extends YahooQuote {
  preMarketPrice: number | null;
  preMarketChangePercent: number | null;
  marketState: string | null;
}

export async function fetchYahooExtendedQuotes(
  symbols: string[],
): Promise<YahooExtendedQuote[]> {
  if (symbols.length === 0) return [];

  const results = await Promise.allSettled(symbols.map((s) => yf.quote(s)));

  const quotes: YahooExtendedQuote[] = [];
  results.forEach((r, i) => {
    if (r.status === "fulfilled" && r.value) {
      const v = r.value as {
        symbol?: string;
        regularMarketPrice?: number;
        regularMarketChangePercent?: number;
        preMarketPrice?: number;
        preMarketChangePercent?: number;
        marketState?: string;
      };
      quotes.push({
        symbol: v.symbol ?? symbols[i],
        c: v.regularMarketPrice ?? 0,
        dp: v.regularMarketChangePercent ?? 0,
        preMarketPrice:
          typeof v.preMarketPrice === "number" ? v.preMarketPrice : null,
        preMarketChangePercent:
          typeof v.preMarketChangePercent === "number"
            ? v.preMarketChangePercent
            : null,
        marketState: v.marketState ?? null,
      });
    } else if (r.status === "rejected") {
      console.error(
        `[yahoo] extended quote failed for ${symbols[i]}:`,
        r.reason,
      );
    }
  });

  return quotes;
}
```

- [ ] **Step 1.4: Run test to verify it passes**

```bash
npx vitest run src/lib/clients/yahoo.test.ts
```

Expected: 4 tests passing.

- [ ] **Step 1.5: Lint + tsc on modified files**

```bash
npx eslint src/lib/clients/yahoo.ts src/lib/clients/yahoo.test.ts
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 1.6: Commit**

```bash
git add src/lib/clients/yahoo.ts src/lib/clients/yahoo.test.ts
git commit -m "feat(yahoo): fetchYahooExtendedQuotes로 preMarket 호가·marketState 노출"
```

---

## Task 2: us_pre 프롬프트 재설계 (TDD)

**Files:**
- Create: `src/lib/ai/prompts.test.ts`
- Modify: `src/lib/ai/prompts.ts:155-206`

- [ ] **Step 2.1: Write the failing test**

Create `src/lib/ai/prompts.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { buildUsPreMarketUser, type PreMarketSnapshot } from "./prompts";

const baseArgs = {
  news: [
    { source: "Reuters", headline: "Headline 1", datetime: 0, summary: "", url: "" },
  ],
  koreanNews: [
    { source: "한경", title: "한국 뉴스 1", pubDate: "" },
  ],
  macros: [{ label: "10Y", value: "4.36%", delta: "+1bp", up: true }],
  dateLabel: "4월 30일 목요일 · 장 시작 전 · 프리마켓",
  prevIndices: [{ label: "S&P 500", value: 711.58, changePct: -0.0155 }],
  prevMovers: [{ ticker: "NVDA", nameKo: "엔비디아", changePct: -1.84 }],
  economicEvents: [
    {
      country: "US",
      event: "Core PCE",
      time: "2026-04-30 12:30:00",
      impact: "high",
      estimate: 0.3,
      prev: 0.4,
    },
  ],
};

describe("buildUsPreMarketUser", () => {
  it("includes all four labeled sections", () => {
    const snap: PreMarketSnapshot[] = [
      {
        label: "S&P 500",
        ticker: "SPY",
        prevClose: 711.58,
        preMarketChangePct: 0.3,
        marketState: "PRE",
      },
    ];
    const result = buildUsPreMarketUser({ ...baseArgs, preMarketSnapshot: snap });

    expect(result).toContain("[전일 미국장 마감 결과 — 회고용 참고]");
    expect(result).toContain('[현재 프리마켓 동향 — "지금" 시점]');
    expect(result).toContain("[오늘 발표 예정 경제 이벤트 — UTC 시각]");
    expect(result).toContain("[관련 뉴스 헤드라인]");
  });

  it("formats prev indices and movers with sign and percent", () => {
    const result = buildUsPreMarketUser({ ...baseArgs, preMarketSnapshot: [] });
    expect(result).toContain("S&P 500: 711.58 (-0.02%)");
    expect(result).toContain("엔비디아 (NVDA): -1.84%");
  });

  it("renders preMarket line with marketState when present", () => {
    const snap: PreMarketSnapshot[] = [
      {
        label: "S&P 500",
        ticker: "SPY",
        prevClose: 711.58,
        preMarketChangePct: 0.3,
        marketState: "PRE",
      },
    ];
    const result = buildUsPreMarketUser({ ...baseArgs, preMarketSnapshot: snap });
    expect(result).toContain("S&P 500 (SPY): 프리마켓 +0.30% (marketState=PRE)");
  });

  it("falls back when preMarketSnapshot is empty", () => {
    const result = buildUsPreMarketUser({ ...baseArgs, preMarketSnapshot: [] });
    expect(result).toContain("(수집 실패 또는 미수집)");
  });

  it("falls back when preMarketSnapshot is undefined", () => {
    const result = buildUsPreMarketUser({ ...baseArgs });
    expect(result).toContain("(수집 실패 또는 미수집)");
  });

  it("marks individual missing preMarket prices", () => {
    const snap: PreMarketSnapshot[] = [
      {
        label: "엔비디아",
        ticker: "NVDA",
        prevClose: 209.25,
        preMarketChangePct: null,
        marketState: "REGULAR",
      },
    ];
    const result = buildUsPreMarketUser({ ...baseArgs, preMarketSnapshot: snap });
    expect(result).toContain("엔비디아 (NVDA): 프리마켓 호가 미수집");
  });

  it("instructs the model to avoid yesterday-recap framing", () => {
    const result = buildUsPreMarketUser({ ...baseArgs });
    expect(result).toContain("오늘 밤");
    expect(result).toMatch(/"어제.*마감".*시작.*금지/);
  });
});
```

- [ ] **Step 2.2: Run test to verify it fails**

```bash
npx vitest run src/lib/ai/prompts.test.ts
```

Expected: FAIL — `PreMarketSnapshot` not exported, `buildUsPreMarketUser` signature mismatch.

- [ ] **Step 2.3: Replace usPreMarketSystem and buildUsPreMarketUser**

In `src/lib/ai/prompts.ts`, replace lines 155-206 (the existing `usPreMarketSystem` const and `buildUsPreMarketUser` function) with:

```ts
export const usPreMarketSystem = `너는 한국어로 미국 주식시장 프리뷰를 제공하는 애널리스트다.

[중요: 시점 구분]
입력 데이터에는 두 가지 시점이 섞여 있다.
1. [전일 미국장 마감 결과]: 어제 끝난 회고용 참고 데이터다.
2. [현재 프리마켓 동향] + [오늘 발표 예정 경제 이벤트] + [관련 뉴스 헤드라인]: 오늘 밤 미국장의 출발점이다.

너의 임무는 "오늘 밤 미국장 시작 시점에 한국 투자자가 무엇을 봐야 하는가"를 정리하는 것이다.

[작성 규칙]
- headline, headlineAccent, summary.body는 반드시 "오늘 밤 시작 시점" 관점으로 작성한다.
- summary.body는 "어제 ~~ 마감"으로 시작 금지. "오늘 밤 ~~", "프리마켓에서 ~~" 같은 현재/미래 시점으로 시작하라.
- summary.sub에서만 전일 마감 결과를 1문장 맥락으로 활용 가능하다. 본문(body)을 회고로 채우지 마라.
- causes는 "오늘 밤 주목할 TOP 3 포인트" (예정 이벤트, 프리마켓 동향, 흐름의 연속성)로 작성한다.
- 추측·예측은 금지. "~할 수 있다", "~가 예상된다" 대신 "~가 예정됐다", "프리마켓에서 ~%로 출발했다" 같은 사실 표현만 쓴다.
- 한국 투자자 관점(한국 시간, 코스피·반도체주 영향)을 우선한다.
- 한국어로만 답한다.`.trim();

export interface PreMarketSnapshot {
  label: string;
  ticker: string;
  prevClose: number;
  preMarketChangePct: number | null;
  marketState: string | null;
}

export function buildUsPreMarketUser(args: {
  news: MarketNewsItem[];
  koreanNews: KoreanNewsItem[];
  macros: MacroItem[];
  dateLabel: string;
  prevIndices: { label: string; value: number; changePct: number }[];
  prevMovers: { ticker: string; nameKo: string; changePct: number }[];
  preMarketSnapshot?: PreMarketSnapshot[];
  economicEvents: EconomicEvent[];
}): string {
  const newsLines = args.news
    .slice(0, 12)
    .map((n, i) => `${i + 1}. [${n.source}] ${n.headline}`)
    .join("\n");

  const koreanNewsLines = args.koreanNews
    .slice(0, 15)
    .map((n, i) => `${i + 1}. [${n.source}] ${n.title}`)
    .join("\n");

  const macroLines = args.macros
    .map((m) => `- ${m.label}: ${m.value} (${m.delta})`)
    .join("\n");

  const fmtPct = (v: number) => `${v >= 0 ? "+" : ""}${v.toFixed(2)}%`;

  const prevIndexLines = args.prevIndices
    .map((x) => `- ${x.label}: ${x.value} (${fmtPct(x.changePct)})`)
    .join("\n");

  const prevMoverLines = args.prevMovers
    .map((m) => `- ${m.nameKo} (${m.ticker}): ${fmtPct(m.changePct)}`)
    .join("\n");

  const preMarketLines =
    args.preMarketSnapshot && args.preMarketSnapshot.length > 0
      ? args.preMarketSnapshot
          .map((p) => {
            const pctStr =
              p.preMarketChangePct === null || p.preMarketChangePct === undefined
                ? "프리마켓 호가 미수집"
                : `프리마켓 ${fmtPct(p.preMarketChangePct)}`;
            const stateStr = p.marketState ? ` (marketState=${p.marketState})` : "";
            return `- ${p.label} (${p.ticker}): ${pctStr}${stateStr}`;
          })
          .join("\n")
      : "(수집 실패 또는 미수집)";

  const eventLines =
    args.economicEvents.length > 0
      ? args.economicEvents
          .slice(0, 8)
          .map(
            (e) =>
              `- ${e.time} UTC · ${e.event} · impact=${e.impact} · 예상=${e.estimate ?? "—"} · 이전=${e.prev ?? "—"}`,
          )
          .join("\n")
      : "(예정 이벤트 없음)";

  return `오늘은 ${args.dateLabel}. 지금은 미국 정규장 시작 전(프리마켓 시간대)이다.

[전일 미국장 마감 결과 — 회고용 참고]
지수:
${prevIndexLines || "(수집 실패)"}
주도주:
${prevMoverLines || "(수집 실패)"}

[현재 프리마켓 동향 — "지금" 시점]
${preMarketLines}

[매크로 현황 — 전영업일 EOD]
${macroLines || "(수집 실패)"}

[오늘 발표 예정 경제 이벤트 — UTC 시각]
${eventLines}

[관련 뉴스 헤드라인]
영문:
${newsLines || "(없음)"}
한글:
${koreanNewsLines || "(없음)"}

위 정보를 바탕으로 "오늘 밤 미국장에서 한국 투자자가 주목할 포인트"를 작성하라.

중요:
- headline·summary.body는 반드시 "오늘 밤" 관점으로 시작하라. "어제 ~~ 마감"으로 시작 금지.
- 전일 마감 결과는 summary.sub에서 1문장 맥락으로만 활용하라. 본문(body)을 회고로 채우지 마라.
- 프리마켓 호가가 있으면 본문에 활용하라.
- causes는 오늘 밤 주목할 TOP 3 포인트(예정 이벤트, 프리마켓 동향, 흐름의 연속성)로 작성하라.

출력 필드:
- headline: 5~10자 (예: "프리마켓 출발 강세")
- headlineAccent: 오늘의 핵심 주제
- summary.body: 오늘 밤 미국장에서 가장 주목할 포인트 한 문장
- summary.sub: 보조 맥락 1~2문장 (전일 마감 → 오늘 흐름 등)
- tags: 3~4개 해시태그
- causes: 오늘 밤 주목할 TOP 3 포인트. 각 rank(1~3), title(15~25자), desc(30~60자), tags(최대 3개)`;
}
```

- [ ] **Step 2.4: Run test to verify it passes**

```bash
npx vitest run src/lib/ai/prompts.test.ts
```

Expected: 7 tests passing.

- [ ] **Step 2.5: Lint + tsc**

```bash
npx eslint src/lib/ai/prompts.ts src/lib/ai/prompts.test.ts
npx tsc --noEmit
```

Expected: tsc will FAIL because `pipeline.ts` still calls `buildUsPreMarketUser` with the old signature. This is expected — Task 3 fixes it. Eslint should be clean.

- [ ] **Step 2.6: Do NOT commit yet**

Tasks 2 + 3 must be committed together because of the signature break. Move to Task 3.

---

## Task 3: pipeline.ts 시그니처 + us_pre 분기 wiring

**Files:**
- Modify: `src/lib/ai/pipeline.ts:101-145`

- [ ] **Step 3.1: Import PreMarketSnapshot and extend runAiPipeline args**

In `src/lib/ai/pipeline.ts`, the existing import block at lines 12-23 imports from `./prompts`. Update it to also bring in the new type:

```ts
import {
  marketSummarySystem,
  krMarketSummarySystem,
  usPreMarketSystem,
  buildMarketSummaryUser,
  buildKrMarketSummaryUser,
  buildUsPreMarketUser,
  moverReasonSystem,
  buildMoverReasonUser,
  eventsSystem,
  buildEventsUser,
  type PreMarketSnapshot,
} from "./prompts";
```

Then in `runAiPipeline` signature at line 101, change:

```ts
export async function runAiPipeline(args: {
  usSources: RawSources;
  krSources: KrRawSources;
  usMovers: MoverMeta[];
  krMovers: MoverMeta[];
  session: BriefingSession;
}): Promise<PipelineOutput> {
```

to:

```ts
export async function runAiPipeline(args: {
  usSources: RawSources;
  krSources: KrRawSources;
  usMovers: MoverMeta[];
  krMovers: MoverMeta[];
  session: BriefingSession;
  preMarketSnapshot?: PreMarketSnapshot[];
  prevIndicesForPre?: { label: string; value: number; changePct: number }[];
}): Promise<PipelineOutput> {
```

- [ ] **Step 3.2: Update buildUsPreMarketUser call site**

In `src/lib/ai/pipeline.ts`, find the `isUsPre` branch around lines 128-141 (the `user: isUsPre ? buildUsPreMarketUser({...}) : buildMarketSummaryUser({...})` ternary) and replace the `buildUsPreMarketUser` call with:

```ts
        user: isUsPre
          ? buildUsPreMarketUser({
              news: args.usSources.marketNews,
              koreanNews: args.usSources.koreanNews,
              macros: args.usSources.macros,
              dateLabel: usDateLabel,
              prevIndices: args.prevIndicesForPre ?? [],
              prevMovers: args.usMovers,
              preMarketSnapshot: args.preMarketSnapshot,
              economicEvents: args.usSources.economicEvents,
            })
          : buildMarketSummaryUser({
```

(Keep the `buildMarketSummaryUser({...})` branch and everything after unchanged.)

- [ ] **Step 3.3: Verify tsc**

```bash
npx tsc --noEmit
```

Expected: no errors. (Tasks 2 + 3 together restore the type contract.)

- [ ] **Step 3.4: Run prompt + yahoo tests**

```bash
npx vitest run src/lib/ai/prompts.test.ts src/lib/clients/yahoo.test.ts
```

Expected: all passing.

- [ ] **Step 3.5: Lint**

```bash
npx eslint src/lib/ai/pipeline.ts
```

Expected: clean.

- [ ] **Step 3.6: Commit Tasks 2 + 3 together**

```bash
git add src/lib/ai/prompts.ts src/lib/ai/prompts.test.ts src/lib/ai/pipeline.ts
git commit -m "feat(ai): us_pre 프롬프트 4섹션 재구성 — 전일 회고/프리마켓/예정 이벤트/뉴스 분리"
```

---

## Task 4: build.ts에서 fetchYahooExtendedQuotes 호출 + 가공

**Files:**
- Modify: `src/lib/briefing/build.ts:1-15` (import 추가), `src/lib/briefing/build.ts:47-94` (us_pre 분기), `src/lib/briefing/build.ts:142` (runAiPipeline 호출)

- [ ] **Step 4.1: Add imports**

In `src/lib/briefing/build.ts`, change line 9:

```ts
import { fetchYahooQuotes, toYahooSymbol, KR_INDEX_SYMBOLS } from "@/lib/clients/yahoo";
```

to:

```ts
import {
  fetchYahooQuotes,
  fetchYahooExtendedQuotes,
  toYahooSymbol,
  KR_INDEX_SYMBOLS,
} from "@/lib/clients/yahoo";
```

Then add (right after the existing `import { runAiPipeline } from "@/lib/ai/pipeline";` line):

```ts
import type { PreMarketSnapshot } from "@/lib/ai/prompts";
```

- [ ] **Step 4.2: Add Yahoo extended fetch to us_pre collection**

In `src/lib/briefing/build.ts`, the `if (isUS)` block currently calls `Promise.allSettled([...])` with 6+ collectors at lines 48-55. Add a new line at the top of the same block (just before the `Promise.allSettled` call) that prepares the symbol list, and add one more collector to the array.

Replace the current block at lines 47-67:

```ts
    if (isUS) {
      const usCollectionRes = await Promise.allSettled([
        fetchMarketNews(15),
        fetchKoreanNews(20),
        fetchMacros(),
        fetchEconomicCalendar(1),
        fetchQuotes([...US_INDEX_SYMBOLS.map((x) => x.symbol), ...US_MOVER_TICKERS]),
        ...US_MOVER_TICKERS.map((t) => fetchCompanyNews(t, 4)),
      ]);

      const [marketNewsRes, koreanNewsRes, macrosRes, calendarRes, usQuotesRes, ...usCompanyNewsRes] =
        usCollectionRes;

      // 실패한 collector 로깅
      const usLabels = ["marketNews", "koreanNews", "macros", "economicCalendar", "usQuotes",
        ...US_MOVER_TICKERS.map((t) => `companyNews:${t}`)];
      usCollectionRes.forEach((r, i) => {
        if (r.status === "rejected") {
          console.error(`[briefing] US collector "${usLabels[i]}" failed:`, r.reason);
        }
      });
```

with:

```ts
    if (isUS) {
      const yahooPreSymbols = session === "us_pre"
        ? [...US_INDEX_SYMBOLS.map((x) => x.symbol), ...US_MOVER_TICKERS]
        : [];

      const usCollectionRes = await Promise.allSettled([
        fetchMarketNews(15),
        fetchKoreanNews(20),
        fetchMacros(),
        fetchEconomicCalendar(1),
        fetchQuotes([...US_INDEX_SYMBOLS.map((x) => x.symbol), ...US_MOVER_TICKERS]),
        fetchYahooExtendedQuotes(yahooPreSymbols),
        ...US_MOVER_TICKERS.map((t) => fetchCompanyNews(t, 4)),
      ]);

      const [
        marketNewsRes,
        koreanNewsRes,
        macrosRes,
        calendarRes,
        usQuotesRes,
        yahooPreRes,
        ...usCompanyNewsRes
      ] = usCollectionRes;

      // 실패한 collector 로깅
      const usLabels = [
        "marketNews",
        "koreanNews",
        "macros",
        "economicCalendar",
        "usQuotes",
        "yahooPreMarket",
        ...US_MOVER_TICKERS.map((t) => `companyNews:${t}`),
      ];
      usCollectionRes.forEach((r, i) => {
        if (r.status === "rejected") {
          console.error(`[briefing] US collector "${usLabels[i]}" failed:`, r.reason);
        }
      });
```

- [ ] **Step 4.3: Hoist preMarketSnapshot declaration to function scope**

`preMarketSnapshot` must be in scope at the `runAiPipeline` call site (around line 142), but the `if (isUS)` block ends before that. Add a `let` declaration alongside the other top-of-function `let` declarations at lines 37-45 (right after `let usMovers: ... = [];`):

```ts
    let preMarketSnapshot: PreMarketSnapshot[] = [];
```

Then inside the `if (isUS)` block, after the `usCompanyNews` building (just before `usSources = {...}` at line 80), add:

```ts
      const yahooPreQuotes = yahooPreRes.status === "fulfilled" ? yahooPreRes.value : [];
      preMarketSnapshot = yahooPreQuotes.map((q) => {
        const idxLabel = US_INDEX_SYMBOLS.find((x) => x.symbol === q.symbol)?.label;
        const meta = idxLabel ? null : getStockMeta(q.symbol);
        return {
          label: idxLabel ?? meta?.nameKo ?? q.symbol,
          ticker: q.symbol,
          prevClose: q.c,
          preMarketChangePct: q.preMarketChangePercent,
          marketState: q.marketState,
        };
      });
```

Note: `preMarketSnapshot` stays `[]` for `us_close` since `yahooPreSymbols` is empty — the prompt's fallback handles it cleanly. For `kr_close` it stays `[]` (the `if (isUS)` block doesn't run) and isn't passed to `runAiPipeline`.

- [ ] **Step 4.4: Pass preMarketSnapshot + prevIndicesForPre to runAiPipeline**

In `src/lib/briefing/build.ts`, the current call at line 142:

```ts
    const result = await runAiPipeline({ usSources, krSources, usMovers, krMovers, session });
```

Replace with:

```ts
    const prevIndicesForPre =
      session === "us_pre"
        ? US_INDEX_SYMBOLS.map(({ label, symbol }) => {
            const q = usQuotes.find((x) => x.symbol === symbol);
            return { label, value: q?.c ?? 0, changePct: q?.dp ?? 0 };
          })
        : undefined;

    const result = await runAiPipeline({
      usSources,
      krSources,
      usMovers,
      krMovers,
      session,
      preMarketSnapshot: session === "us_pre" ? preMarketSnapshot : undefined,
      prevIndicesForPre,
    });
```

- [ ] **Step 4.5: Verify tsc**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4.6: Lint**

```bash
npx eslint src/lib/briefing/build.ts
```

Expected: clean.

- [ ] **Step 4.7: Run all tests**

```bash
npx vitest run
```

Expected: all existing tests pass + new yahoo + prompts tests pass.

- [ ] **Step 4.8: Commit**

```bash
git add src/lib/briefing/build.ts
git commit -m "feat(briefing): us_pre에서 Yahoo 프리마켓 호가 수집해 pipeline에 전달"
```

---

## Task 5: 통합 검증 및 push

- [ ] **Step 5.1: Full lint**

```bash
npx eslint src/
```

Expected: no errors.

- [ ] **Step 5.2: Full type check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 5.3: Full test suite**

```bash
npx vitest run
```

Expected: all green. Record the test count.

- [ ] **Step 5.4: Side-effect grep — confirm no other callers depend on old signatures**

```bash
grep -rn "buildUsPreMarketUser\|runAiPipeline\|fetchYahooExtendedQuotes" src/ --include="*.ts" --include="*.tsx"
```

Expected callers:
- `buildUsPreMarketUser` — only `src/lib/ai/pipeline.ts` and `src/lib/ai/prompts.test.ts`
- `runAiPipeline` — only `src/lib/briefing/build.ts`
- `fetchYahooExtendedQuotes` — only `src/lib/briefing/build.ts` and `src/lib/clients/yahoo.test.ts`

If any unexpected caller appears, stop and report.

- [ ] **Step 5.5: Smoke test — manual cron trigger (dev server)**

Start dev server in background if not running:

```bash
npm run dev &
```

Wait for "ready". Trigger us_pre via the admin endpoint (assuming admin auth is `Bearer ${CRON_SECRET}` or similar — check `src/app/api/cron/briefing/route.ts` for the actual header). Run:

```bash
curl -i -X POST "http://localhost:3000/api/cron/briefing?session=us_pre" \
  -H "Authorization: Bearer $CRON_SECRET"
```

Expected: HTTP 200 with `{"ok":true,"runId":"..."}`. If 401, set `CRON_SECRET` env var first.

- [ ] **Step 5.6: Inspect the resulting briefing**

Open `http://localhost:3000/admin/briefing` in a browser (Playwright if no GUI):

```bash
npx playwright screenshot --browser=chromium http://localhost:3000/admin/briefing /tmp/admin-briefing.png
```

Read `/tmp/admin-briefing.png` and verify the latest us_pre run shows:
- `summary.body` does NOT start with "어제"
- Either `causes` references "오늘 밤" / "프리마켓" / "예정" or, if Yahoo preMarket was missing, the prompt fallback worked (run still succeeded)

If the body still starts with "어제 ~~ 마감", the prompt is being ignored — capture the raw `briefing_data.us.summary` from Supabase and report.

- [ ] **Step 5.7: Push**

```bash
git push origin claude/epic-panini-45a01f
```

- [ ] **Step 5.8: Final report**

Report back:
- Tests added: yahoo (4 tests), prompts (7 tests)
- Files modified: 4 (yahoo.ts, prompts.ts, pipeline.ts, build.ts)
- Files created: 2 (yahoo.test.ts, prompts.test.ts) + 2 docs
- Smoke test result: PASS / FAIL with screenshot path
- Any deviations from plan
