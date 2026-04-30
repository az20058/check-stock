import type { MarketNewsItem } from "@/lib/collectors/market-news";
import type { CompanyNewsItem } from "@/lib/collectors/company-news";
import type { KoreanNewsItem } from "@/lib/collectors/korean-news";
import type { MacroItem } from "@/types/stock";
import type { EconomicEvent } from "@/lib/collectors/economic-calendar";

export const marketSummarySystem = `너는 한국어로 미국 주식시장을 설명하는 애널리스트다.

[핵심 원칙]
- 반드시 오늘(당일) 시장에서 실제로 일어난 일만 다룬다.
- 주어진 뉴스와 데이터에 근거해서만 답한다. 추측·예측·일반론은 절대 쓰지 않는다.
- "~할 수 있다", "~가 예상된다" 같은 모호한 표현 대신, "~했다", "~로 나타났다" 같은 사실 기반 표현을 쓴다.
- 개인 투자자가 5초 안에 이해할 수 있게 핵심만 간결하게 정리한다.
- 한국어 뉴스와 영어 뉴스를 모두 참고하여, 한국 투자자 관점에서 가장 중요한 이슈를 중심으로 정리한다.
- 전문 용어는 피하고, 숫자는 맥락(왜 이 숫자가 중요한가)과 함께 제시한다.
- 한국어로만 답한다.`.trim();

export function buildMarketSummaryUser(args: {
  news: MarketNewsItem[];
  koreanNews: KoreanNewsItem[];
  macros: MacroItem[];
  dateLabel: string;
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

  return `오늘은 ${args.dateLabel}.

[매크로 변화]
${macroLines || "(수집 실패)"}

[영문 주요 뉴스 헤드라인]
${newsLines || "(뉴스 없음)"}

[한국 금융 뉴스 헤드라인]
${koreanNewsLines || "(한국 뉴스 없음)"}

위 정보를 바탕으로 오늘 미국 장의 핵심 스토리를 요약하라.
중요: 반드시 오늘 실제로 일어난 사건과 수치만 언급하라. 과거 이야기나 미래 예측은 쓰지 마라.
- headline: 브리핑 제목 꼬리말 (5~10자)
- headlineAccent: 오늘의 핵심 주제 (예: '나스닥이 흔들린')
- summary.body: 오늘 시장을 움직인 가장 큰 이유 한 문장
- summary.sub: 보조 맥락 1~2문장 (섹터 반응, 한국 투자자 시각 등)
- tags: 3~4개의 해시태그 (#금리, #반도체 등)
- causes: 오늘 시장을 움직인 TOP 3 원인. 각 원인마다 rank(1~3), title(15~25자), desc(30~60자), tags(최대 3개) 포함`;
}

export const krMarketSummarySystem = `너는 한국어로 한국 주식시장을 설명하는 애널리스트다.

[핵심 원칙]
- 반드시 오늘(당일) 코스피·코스닥 시장에서 실제로 일어난 일만 다룬다.
- 외국인 수급, 기관 동향, 원달러 환율 변화를 핵심 관점으로 분석한다.
- 주어진 뉴스와 데이터에 근거해서만 답한다. 추측·예측·일반론은 절대 쓰지 않는다.
- "~할 수 있다", "~가 예상된다" 같은 모호한 표현 대신, "~했다", "~로 나타났다" 같은 사실 기반 표현을 쓴다.
- 개인 투자자가 5초 안에 이해할 수 있게 핵심만 간결하게 정리한다.
- 전문 용어는 피하고, 숫자는 맥락(왜 이 숫자가 중요한가)과 함께 제시한다.
- 한국어로만 답한다.`.trim();

export function buildKrMarketSummaryUser(args: {
  koreanMarketNews: KoreanNewsItem[];
  macros: MacroItem[];
  dateLabel: string;
}): string {
  const newsLines = args.koreanMarketNews
    .slice(0, 15)
    .map((n, i) => `${i + 1}. [${n.source}] ${n.title}`)
    .join("\n");

  const macroLines = args.macros
    .map((m) => `- ${m.label}: ${m.value} (${m.delta})`)
    .join("\n");

  return `오늘은 ${args.dateLabel}.

[매크로 변화]
${macroLines || "(수집 실패)"}

[한국 시장 뉴스 헤드라인]
${newsLines || "(뉴스 없음)"}

위 정보를 바탕으로 오늘 코스피·코스닥 장의 핵심 스토리를 요약하라.
코스피·코스닥 지수 흐름, 외국인 수급, 원달러 환율을 중심으로 분석하라.
중요: 반드시 오늘 실제로 일어난 사건과 수치만 언급하라. 과거 이야기나 미래 예측은 쓰지 마라.
- headline: 브리핑 제목 꼬리말 (5~10자)
- headlineAccent: 오늘의 핵심 주제 (예: '코스피가 반등한')
- summary.body: 오늘 시장을 움직인 가장 큰 이유 한 문장
- summary.sub: 보조 맥락 1~2문장 (외국인 수급, 환율 영향 등)
- tags: 3~4개의 해시태그 (#코스피, #외국인수급 등)
- causes: 오늘 시장을 움직인 TOP 3 원인. 각 원인마다 rank(1~3), title(15~25자), desc(30~60자), tags(최대 3개) 포함`;
}

export const moverReasonSystem = `너는 한국어 증권 리서치 애널리스트다.
종목이 오늘 왜 움직였는지 핵심 이유를 한 줄로 설명한다.
반드시 오늘 발생한 사건에 근거해서만 답한다. 추측이나 일반론은 쓰지 않는다.
주어진 뉴스에 명확한 이유가 없으면 "시장 전반 흐름에 동조"라고 답한다.`.trim();

export function buildMoverReasonUser(args: {
  ticker: string;
  nameKo: string;
  changePct: number;
  news: CompanyNewsItem[];
}): string {
  const direction = args.changePct >= 0 ? "상승" : "하락";
  const newsLines = args.news
    .slice(0, 4)
    .map((n, i) => `${i + 1}. ${n.headline}${n.summary ? ` — ${n.summary.slice(0, 120)}` : ""}`)
    .join("\n");

  return `종목: ${args.nameKo} (${args.ticker})
오늘 ${Math.abs(args.changePct).toFixed(2)}% ${direction}.

[최근 뉴스]
${newsLines || "(관련 뉴스 없음 — 시장 전반 흐름에 동조로 판단)"}

위 정보로 이 종목의 오늘 움직임 이유를 10~20자 이내 한국어 한 줄로 답하라.
반드시 오늘 발생한 사건만 언급하라.
예: "AI 수요 둔화 우려", "Q1 인도량 하회", "서비스 매출 기대".`;
}

export const eventsSystem = `너는 한국어 경제 캘린더 요약가다.
미국 경제 지표·실적 발표 일정을 한국 투자자 관점에서 정리한다.
시간은 KST로 표기한다 (UTC + 9시간).`.trim();

export function buildEventsUser(events: EconomicEvent[]): string {
  if (events.length === 0) {
    return "오늘~내일 주요 경제 이벤트가 없다. events: [] 를 반환하라.";
  }
  const lines = events
    .slice(0, 10)
    .map((e) => `- ${e.time} UTC · ${e.event} · impact=${e.impact} · 예상=${e.estimate ?? "—"} · 이전=${e.prev ?? "—"}`)
    .join("\n");

  return `[경제 캘린더 raw]
${lines}

위 이벤트 중 한국 투자자가 주목할 만한 것 최대 4개를 골라 한국어로 정리하라.
- time: 'KST HH:MM' 형식 (UTC + 9시간)
- title: 이벤트 이름 한국어
- desc: 30자 내외 맥락 ("예상 2.6% YoY · 연준 선호 지표" 같은 톤)
- tag: '중요' 또는 '이벤트'
- important: impact가 high면 true`;
}

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
