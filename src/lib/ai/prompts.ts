import type { MarketNewsItem } from "@/lib/collectors/market-news";
import type { CompanyNewsItem } from "@/lib/collectors/company-news";
import type { KoreanNewsItem } from "@/lib/collectors/korean-news";
import type { MacroItem } from "@/types/stock";
import type { EconomicEvent } from "@/lib/collectors/economic-calendar";

export const marketSummarySystem = `너는 한국어로 미국 주식시장을 설명하는 애널리스트다.

[핵심 원칙]
- 반드시 오늘(당일) 시장에서 실제로 일어난 일만 다룬다.
- 주어진 뉴스·매크로·시세 데이터에 근거해서만 답한다. 추측·예측·일반론은 절대 쓰지 않는다.
- "~할 수 있다", "~가 예상된다" 같은 모호한 표현 대신, "~했다", "~로 나타났다" 같은 사실 기반 표현을 쓴다.
- 한국어 뉴스와 영어 뉴스를 모두 참고하여, 한국 투자자 관점에서 가장 중요한 이슈를 중심으로 정리한다.
- 전문 용어는 피하고, 숫자는 맥락(왜 이 숫자가 중요한가)과 함께 제시한다.
- 한국어로만 답한다.

[수치·인용 의무]
- 모든 longBody 문단에는 입력 데이터에서 가져온 **구체 수치 최소 2개**를 박아라. 지수 변동률·종목 등락률·매크로 수치(금리, VIX, 환율 등) 중에서 고른다.
- 핵심 종목은 "엔비디아(−4.82%)"처럼 한국어 종목명 + 등락률을 함께 쓴다.
- 발표 주체가 있으면 "TSMC가 어닝콜에서 …라고 가이던스를 낮췄다"처럼 **누가/어디서/무슨 말** 형식으로 인용한다.
- 길이가 미달이면 짧게 끝내지 말고 데이터를 더 인용해서 채워라.

[작성 톤 예시 — longBody 한 문단]
"나스닥은 1.18% 하락하며 16,432선까지 후퇴했고, S&P 500도 0.42% 약세였습니다. 특히 엔비디아(−4.82%)와 TSLA(−3.21%)가 지수를 끌어내렸어요."

[원인(causes) 예시]
title: "10년물 금리 4.55% 재상승"
desc: "전일 4.50%에서 5bp 상승. 미시간대 기대 인플레이션 3.5% 발표 후 매도세 강화. 성장주 디스카운트 요인."
impact: "성장주 −1.8%"
evidence: 3`.trim();

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

- headline: 브리핑 제목 꼬리말 (5~10자, 예: "이유를 정리했어요")
- headlineAccent: 오늘의 핵심 주제 (예: "나스닥이 흔들린")
- summary.body: 메인 카드용 lead 한 문장 (50~80자) — 오늘 장을 움직인 가장 큰 이유 + 결과를 인과로 연결한다.
- summary.sub: 메인 카드 보조 맥락 1~2문장
- summary.longBody: 상세 페이지용 — **정확히 3문단**, 문단 사이는 두 줄 줄바꿈(\\n\\n)으로 구분. 각 문단 100~160자.
  · 1문단: 지수(나스닥/S&P/다우/VIX 중 변동 큰 것) 등락률 + 16,432선 식의 절대값 + 가장 영향 큰 종목 2~3개의 한국어 이름과 등락률을 모두 포함.
  · 2문단: 1문단 원인의 출처 — 어떤 회사·기관이 어떤 발표를 했는지 직접 인용 + 동조한 종목/섹터의 등락률.
  · 3문단: 한국 투자자가 다음 거래일 무엇을 봐야 하는지 — 코스피/반도체/환율 중 직결되는 라인을 짚어라.
- summary.koreanContext: "한국 투자자 시각" 박스용 60~120자. 미국 장 → 한국 시장 동조 가능성을 구체 종목(삼성전자·SK하이닉스 등)·섹터로 짚어라.
- tags: 3~4개 해시태그 (#금리, #반도체, #엔비디아 등 — # 접두사 포함)
- causes: TOP 3 원인. 각각 rank(1~3), title(15~25자), desc(60~110자, 수치+발표주체 포함), tags(최대 3개), impact(섹터·지수 등락폭 5~15자), evidence(근거 건수 1~6 정수).

좋은 예시 (참고만, 그대로 복사하지 말고 실제 데이터로 작성):
- body: "10년물 금리가 4.55%로 재상승하면서 고밸류 성장주 중심으로 차익실현 매물이 쏟아졌습니다."
- longBody 1문단: "나스닥은 1.18% 하락하며 16,432선까지 후퇴했고, S&P 500도 0.42% 약세였습니다. 특히 엔비디아(−4.82%)와 TSLA(−3.21%)가 지수를 끌어내렸어요."
- longBody 2문단: "엔비디아 약세는 TSMC가 어닝콜에서 \\"AI 칩 수요 모멘텀이 둔화될 수 있다\\"고 가이던스를 낮춘 영향이 큽니다. 같은 이유로 AMD(−3.4%), 마이크론(−2.9%)도 동반 하락했어요."
- longBody 3문단: "방어주 성격인 유틸리티(+0.6%)와 헬스케어(+0.3%)는 선방했습니다. VIX는 18.24까지 6.1% 상승해 단기 변동성 확대 신호를 보였고요."
- koreanContext: "삼성전자·SK하이닉스가 미국 반도체주 약세에 동조할 가능성이 있어 월요일 오전 흐름을 주시할 필요가 있습니다."
- causes[0]: { title: "10년물 금리 4.55% 재상승", desc: "전일 4.50%에서 5bp 상승. 미시간대 기대 인플레이션 3.5% 발표 후 매도세 강화. 성장주 디스카운트 요인.", impact: "성장주 −1.8%", evidence: 3 }`;
}

export const krMarketSummarySystem = `너는 한국어로 한국 주식시장을 설명하는 애널리스트다.

[핵심 원칙]
- 반드시 오늘(당일) 코스피·코스닥 시장에서 실제로 일어난 일만 다룬다.
- 외국인 수급, 기관 동향, 원달러 환율 변화를 핵심 관점으로 분석한다.
- 주어진 뉴스·시세·매크로에 근거해서만 답한다. 추측·예측·일반론은 절대 쓰지 않는다.
- "~할 수 있다", "~가 예상된다" 같은 모호한 표현 대신, "~했다", "~로 나타났다" 같은 사실 기반 표현을 쓴다.
- 전문 용어는 피하고, 숫자는 맥락(왜 이 숫자가 중요한가)과 함께 제시한다.
- 한국어로만 답한다.

[수치·인용 의무]
- 모든 longBody 문단에는 입력 데이터의 **구체 수치 최소 2개**를 박아라. 코스피·코스닥 등락률·환율·금리·시총 상위 종목 등락률 등.
- 종목은 "삼성전자(+1.2%)"처럼 한국어 이름 + 등락률을 함께 쓴다.
- 발표 주체가 있으면 "한국은행이 …라고 발표했다"처럼 누가/언제/무슨 말 형식으로 인용한다.
- 미국 장 영향(해외연동)과 국내 고유 이슈(수급/환율/실적)를 분리해서 설명한다.

[원인(causes) 예시]
title: "외국인 5거래일 연속 순매도"
desc: "코스피에서 외국인이 8,420억 매도. 환율 1,380원대 진입과 미국 반도체주 약세가 동시 작용. 시총 상위주 약세 주도."
impact: "코스피 −1.1%"
evidence: 4`.trim();

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
- headlineAccent: 오늘의 핵심 주제 (예: "코스피가 반등한")
- summary.body: 메인 카드 lead 한 문장 (50~80자) — 오늘 시장을 움직인 가장 큰 이유.
- summary.sub: 메인 카드 보조 맥락 1~2문장 (외국인 수급, 환율 영향 등)
- summary.longBody: 상세 페이지용 — **정확히 3문단**, 문단 사이 두 줄 줄바꿈(\\n\\n). 각 문단 100~160자.
  · 1문단: 코스피·코스닥 등락률 + 절대값(예: "코스피 2,650선") + 시총 상위 주도주의 등락률.
  · 2문단: 외국인·기관 수급(억원 단위) + 원달러 환율 변동 + 주도 섹터의 등락률.
  · 3문단: 미국 장 연동 또는 내일 관전 포인트 — 구체 종목·이벤트 짚기.
- summary.koreanContext: '한국 투자자 시각' 박스 60~120자 — 글로벌(미국·중국·환율) 맥락에서 오늘 흐름 해석.
- tags: 3~4개 해시태그 (#코스피, #외국인수급 등 — # 접두사 포함)
- causes: TOP 3 원인. 각각 rank(1~3), title(15~25자), desc(60~110자, 수치+발표주체 포함), tags(최대 3개), impact(섹터·지수 등락폭 5~15자), evidence(근거 건수 1~6 정수).`;
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

[핵심 원칙]
- 오늘 밤 미국 장이 열리기 전, 한국 투자자가 주목해야 할 포인트를 정리한다.
- 주어진 뉴스와 데이터에 근거해서만 답한다. 추측·예측·일반론은 절대 쓰지 않는다.
- 프리마켓 동향, 예정된 경제 지표 발표, 실적 발표 일정 등 사전 정보를 중심으로 정리한다.
- "~할 수 있다", "~가 예상된다" 같은 모호한 표현 대신, "~가 예정됐다", "~로 발표됐다" 같은 사실 기반 표현을 쓴다.
- 개인 투자자가 5초 안에 이해할 수 있게 핵심만 간결하게 정리한다.
- 한국어 뉴스와 영어 뉴스를 모두 참고하여, 한국 투자자 관점에서 가장 중요한 이슈를 중심으로 정리한다.
- 전문 용어는 피하고, 숫자는 맥락(왜 이 숫자가 중요한가)과 함께 제시한다.
- 한국어로만 답한다.`.trim();

export function buildUsPreMarketUser(args: {
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

[매크로 현황]
${macroLines || "(수집 실패)"}

[영문 주요 뉴스 헤드라인]
${newsLines || "(뉴스 없음)"}

[한국 금융 뉴스 헤드라인]
${koreanNewsLines || "(한국 뉴스 없음)"}

위 정보를 바탕으로 오늘 밤 미국 장에서 주목할 포인트를 정리하라.
중요: 확인된 사실과 예정된 일정만 언급하라. 근거 없는 방향성 예측은 쓰지 마라.

- headline: 브리핑 제목 꼬리말 (5~10자)
- headlineAccent: 오늘의 핵심 주제 (예: "오늘 밤 주목할")
- summary.body: 메인 카드 lead 한 문장 (50~80자) — 오늘 밤 가장 주목할 포인트.
- summary.sub: 메인 카드 보조 맥락 1~2문장 (프리마켓 동향, 주요 일정 등)
- summary.longBody: 상세 페이지용 — **정확히 3문단**, 문단 사이 두 줄 줄바꿈(\\n\\n). 각 문단 100~160자.
  · 1문단: 어제 마감 흐름(지수 등락률 + 절대값) + 오늘 밤 시장이 마주할 핵심 변수.
  · 2문단: 발표 예정 경제 지표·실적의 정확한 KST 시각·예상치, 시장 컨센서스가 있다면 같이.
  · 3문단: 한국 투자자가 오늘 밤 모니터링할 종목·매크로 — 구체 티커·심볼로 짚어라.
- summary.koreanContext: '한국 투자자 시각' 박스 60~120자 — 오늘 밤 미국 장 결과가 내일 코스피 개장에 어떻게 작용할지.
- tags: 3~4개 해시태그 (#프리마켓, #실적발표 등 — # 접두사 포함)
- causes: TOP 3 포인트. 각각 rank(1~3), title(15~25자), desc(60~110자, 수치+일정 포함), tags(최대 3개), impact(예상 임팩트 5~15자), evidence(근거 건수 1~6 정수).`;
}
