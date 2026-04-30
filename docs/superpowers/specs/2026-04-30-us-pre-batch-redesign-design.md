# us_pre 배치 데이터/프롬프트 재설계

**날짜**: 2026-04-30
**관련 파일**: `src/lib/clients/yahoo.ts`, `src/lib/briefing/build.ts`, `src/lib/ai/pipeline.ts`, `src/lib/ai/prompts.ts`

## 배경

us_pre cron은 KST 20:00 (UTC 11:00 = ET 07:00, 서머타임 기준)에 실행된다. 이는 미국 정규장 시작(ET 09:30) 약 2시간 30분 전이다.

현재 데이터 수집 경로는 us_close와 거의 동일하다:
- 시세: Finnhub `/quote` — 정규장 시작 전이면 **전일 종가**만 반환
- 매크로: FRED EOD — ET 07:00에는 **전일 EOD 값**이 최신
- 뉴스: Finnhub `/news?category=general` — 시간 필터 없음, 자연히 "전일 마감 후 ~ 오늘 새벽" 회고형이 대부분

결과적으로 us_pre의 입력 데이터는 본질적으로 "전일 us_close와 동일"하고, AI는 받은 데이터에 충실하게 `summary.body = "어제 미국증시는 ~~ 마감"` 형태로 회고형 본문을 생성한다. dateLabel만 "프리마켓"이고 내용은 us_close 재탕인 상태.

증거: 2026-04-29 21:58 UTC us_close (`29469435`)와 2026-04-30 12:25 UTC us_pre (`98e5b46d`)의 `macros` / `indices` / `movers` 값이 완전히 동일.

## 목표

us_pre 결과물의 본문이 "오늘 밤 미국장 시작 시점" 관점으로 작성되도록 한다. 구체적으로:
- AI가 "전일 마감 결과는 회고용"이고 "오늘 밤은 별개"임을 인지하도록 입력을 라벨링한다
- 실제 "지금 시점" 정보(프리마켓 호가)를 입력으로 추가한다
- 출력 schema와 UI는 변경하지 않는다 (회귀 위험 최소화)

## 비-목표

- UI에 프리마켓 칩/필드 추가 (B-2 옵션, 다음 사이클 후보)
- 뉴스 시간 필터링 (C 옵션, 다음 사이클 후보)
- us_close / kr_close 흐름 변경
- 출력 schema (`marketSummarySchema`) 변경
- DB 마이그레이션
- vercel cron 시각 변경
- us_pre의 잦은 schema 실패(별도 버그) 수정

## 설계

### 1. Yahoo client 확장

**위치**: `src/lib/clients/yahoo.ts`

`yahoo-finance2`의 `quote()` 응답에는 이미 `preMarketPrice`, `preMarketChangePercent`, `marketState`가 포함된다. 기존 `fetchYahooQuotes`는 이 필드들을 버리고 있다.

신규 함수 추가:

```ts
export interface YahooExtendedQuote extends YahooQuote {
  preMarketPrice: number | null;
  preMarketChangePercent: number | null;
  marketState: string | null; // "PRE" | "REGULAR" | "POST" | "CLOSED" | "PREPRE" | "POSTPOST" 등
}

export async function fetchYahooExtendedQuotes(symbols: string[]): Promise<YahooExtendedQuote[]>
```

기존 `fetchYahooQuotes`는 그대로 둔다 (kr_close에서 사용 중).

### 2. 데이터 수집 분기

**위치**: `src/lib/briefing/build.ts`, us_pre 분기 ([build.ts:47-94](src/lib/briefing/build.ts:47))

기존 Finnhub `fetchQuotes` 호출은 그대로 유지 (UI/storage가 의존). us_pre일 때만 추가로 Yahoo extended quote를 가져온다.

```ts
const yahooSymbols = [
  { ticker: "SPY", label: "S&P 500" },     // ^GSPC는 selector 미지원 케이스 있어 SPY로 통일
  { ticker: "QQQ", label: "NASDAQ" },
  { ticker: "DIA", label: "DOW" },
  ...US_MOVER_TICKERS.map(t => ({ ticker: t, label: getStockMeta(t)?.nameKo ?? t })),
];

// Promise.allSettled에 추가
fetchYahooExtendedQuotes(yahooSymbols.map(x => x.ticker))
```

수집 결과를 `preMarketSnapshot` 형태로 가공:

```ts
interface PreMarketSnapshot {
  label: string;             // "S&P 500", "엔비디아"
  ticker: string;
  prevClose: number;          // regularMarketPrice (어제 종가)
  preMarketChangePct: number | null; // preMarketChangePercent (현재 호가 변동률)
  marketState: string | null;
}
```

### 3. AI pipeline 시그니처

**위치**: `src/lib/ai/pipeline.ts`, `runAiPipeline` ([pipeline.ts:101-107](src/lib/ai/pipeline.ts:101))

```ts
runAiPipeline(args: {
  usSources: RawSources;
  krSources: KrRawSources;
  usMovers: MoverMeta[];
  krMovers: MoverMeta[];
  session: BriefingSession;
  preMarketSnapshot?: PreMarketSnapshot[];  // 신규, us_pre 시에만 전달
})
```

us_pre 분기에서만 사용. 다른 세션에서는 무시. optional이라 기존 호출부 영향 없음.

### 4. 프롬프트 재설계

**위치**: `src/lib/ai/prompts.ts`

#### `usPreMarketSystem` 강화

핵심 추가 지시:
- 사용자가 받는 입력에는 "[전일 미국장 마감 결과]"와 "[현재 프리마켓 동향]" 두 가지 시점이 있음을 명시
- `headline`, `headlineAccent`, `summary.body`는 **반드시 "오늘 밤 시작 시점" 관점**으로 작성
- `summary.sub`는 전일 마감 결과를 "참고 맥락"으로 1문장만 언급 가능
- `causes`는 "오늘 밤 주목할 포인트" (예정 이벤트, 프리마켓 동향, 전일 마감의 연속성)
- 금지 표현: 본문에 "어제 ~~ 마감"으로 시작 / 전일 결과 회고로 본문 채우기

#### `buildUsPreMarketUser` 재구성

입력을 4개 명확한 섹션으로 분리:

```
오늘은 {dateLabel}. 지금은 미국 정규장 시작 약 N시간 전이다.

[전일 미국장 마감 결과 — 회고용]
지수: S&P 500 ..., NASDAQ ..., DOW ...
주도주: NVDA ..., TSLA ..., AAPL ..., MSFT ...

[현재 프리마켓 동향 — "지금" 시점]
S&P 500 (SPY): 프리마켓 +0.3% (marketState=PRE)
NASDAQ (QQQ): 프리마켓 +0.5%
... (preMarketChangePct가 null이면 "프리마켓 호가 미수집" 표기)

[오늘 발표 예정 경제 이벤트 — 오늘 밤~내일 새벽 KST]
- KST 21:30 · Core PCE Price Index MoM · impact=high · 예상 0.3% · 이전 0.4%
- ...

[관련 뉴스 헤드라인]
영문: ...
한글: ...

위 정보를 바탕으로 "오늘 밤 미국장에서 한국 투자자가 주목할 포인트"를 작성하라.
중요: headline·summary.body는 "오늘 밤 무엇을 볼 것인가"로 시작하라.
전일 마감 결과는 summary.sub에서 한 줄 맥락으로만 활용하고 본문 회고로 쓰지 마라.
```

`buildUsPreMarketUser` 시그니처에 `preMarketSnapshot?: PreMarketSnapshot[]` 추가.

### 5. 출력 매핑

**위치**: [build.ts:144-175](src/lib/briefing/build.ts:144) (변경 없음)

`enrichedUs`는 기존대로 Finnhub 시세(`usQuoteMap`)로 매핑. `preMarketSnapshot`은 AI 입력으로만 사용되고 storage/UI에는 도달하지 않는다.

## 데이터 흐름

```
cron(11:00 UTC) → /api/cron/briefing?session=us_pre
  → runBriefing("cron", "us_pre")
  → Promise.allSettled([
      fetchMarketNews, fetchKoreanNews, fetchMacros, fetchEconomicCalendar,
      fetchQuotes(Finnhub),                    // 기존: 어제 종가 (UI/storage용)
      fetchYahooExtendedQuotes(yahooSymbols),  // 신규: 어제 종가 + 프리마켓 호가
      ...US_MOVER_TICKERS.map(fetchCompanyNews)
    ])
  → preMarketSnapshot 가공
  → runAiPipeline({ usSources, ..., session: "us_pre", preMarketSnapshot })
  → buildUsPreMarketUser가 4섹션 라벨링한 프롬프트 생성
  → Claude → MarketSummary (기존 schema 그대로)
  → enrichedUs = Finnhub 시세로 매핑 (UI/storage 호환 유지)
  → finishRun
```

## 에러 처리

| 시나리오 | 동작 |
|---|---|
| Yahoo fetch 전체 실패 | `preMarketSnapshot = []` 또는 `undefined`, 프롬프트의 `[현재 프리마켓 동향]` 섹션에 "(수집 실패)" 표기. 배치는 성공으로 진행. |
| 일부 종목만 실패 | 성공한 것만 snapshot에 포함. 실패한 종목은 섹션에서 누락. |
| `preMarketChangePercent`가 null/undefined (휴장일·장중 등) | 해당 종목 라인을 "프리마켓 호가 미수집"으로 표기. `marketState` 값을 같이 노출해서 AI가 컨텍스트 인지. |
| `marketState !== "PRE"` (예: 이미 정규장 시작 후 수동 트리거) | 프롬프트 상단 "지금은 미국 정규장 시작 약 N시간 전이다" 문장을 "현재 marketState=REGULAR (정규장 진행 중)" 등으로 분기. |

## 테스트

신규 유닛 테스트 (vitest, 기능 구현 전 작성):

1. **`buildUsPreMarketUser` 텍스트 라벨링** (`src/lib/ai/prompts.test.ts`)
   - 정상 케이스: 인덱스/movers/preMarket 데이터 모두 있을 때 4섹션이 정확히 생성되는지
   - preMarket 누락 케이스: `preMarketSnapshot = []` 또는 `undefined`일 때 "(수집 실패)" 라벨이 포함되는지
   - 일부 종목 preMarket 결측: 결측 종목 라인이 "프리마켓 호가 미수집"으로 표기되는지

2. **`fetchYahooExtendedQuotes` 매핑** (`src/lib/clients/yahoo.test.ts`)
   - mock된 yahoo response에서 preMarketPrice/Percent, marketState가 올바르게 매핑되는지
   - preMarket 필드가 undefined일 때 null로 안전 변환되는지

us_close / kr_close 회귀 방지: 기존 테스트(있다면) 통과 확인. 없으면 build.ts의 us_close 분기를 직접 호출하는 smoke test 추가는 본 작업 범위 밖.

## 영향 범위 / 호환성

| 항목 | 영향 |
|---|---|
| DB schema | 변경 없음 |
| `MarketBriefing` 타입 | 변경 없음 |
| `marketSummarySchema` | 변경 없음 |
| `page.tsx`, `_components/` | 변경 없음 |
| us_close 흐름 | 변경 없음 |
| kr_close 흐름 | 변경 없음 |
| us_pre 흐름 | 입력 데이터 보강 + 프롬프트 변경. 출력 schema 동일 → storage·UI 호환 |
| vercel.json cron | 변경 없음 |
| 외부 API 호출 추가 | us_pre 1회 실행당 Yahoo `quote()` 7회 (인덱스 3 + movers 4). yahoo-finance2 무료, rate limit 영향 미미 |
| 토큰 사용량 | us_pre 입력 프롬프트가 약 200~400 토큰 증가 예상. 출력은 변동 미미 |

## 롤백

문제 발생 시 `pipeline.ts`의 us_pre 분기에서 `preMarketSnapshot`을 무시하고 기존 `buildUsPreMarketUser` 호출부를 복원하면 즉시 이전 동작으로 회귀. Yahoo client의 신규 함수는 호출되지 않으면 무영향.
