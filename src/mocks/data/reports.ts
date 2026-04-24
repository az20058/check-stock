import type { Stock, StockReport, TimeRange } from "@/types/stock";
import { stocksMap } from "./stocks";

function generateChartData(base: number, points: number, volatility: number, trend: number): number[] {
  const data: number[] = [base];
  let val = base;
  for (let i = 1; i < points; i++) {
    val = val + trend + (Math.sin(i * 0.5) * volatility) + ((i % 3 === 0 ? 1 : -1) * volatility * 0.5);
    data.push(Math.round(val * 100) / 100);
  }
  return data;
}

function chartsFromPrice(price: number, changePct: number): Record<TimeRange, number[]> {
  const trend1D = (price * changePct) / 100 / 24;
  const trend1W = (price * changePct) / 100 / 7;
  const v = Math.max(price * 0.01, 0.5);
  return {
    "1D": generateChartData(price - (price * changePct) / 100, 24, v, trend1D),
    "1W": generateChartData(price - (price * changePct) / 100, 7, v * 1.2, trend1W),
    "1M": generateChartData(price * 1.05, 30, v * 1.5, -price * 0.002),
    "3M": generateChartData(price * 1.15, 60, v * 2, -price * 0.003),
    "1Y": generateChartData(price * 0.9, 252, v * 3, price * 0.0005),
    "ALL": generateChartData(price * 0.5, 500, v * 4, price * 0.001),
  };
}

const nvdaCharts: Record<TimeRange, number[]> = {
  "1D": [440, 438, 442, 436, 431, 428, 432, 425, 420, 418, 422, 415, 410, 412, 408, 405, 410, 414, 412, 408, 411, 412, 410, 413],
  "1W": generateChartData(445, 7, 5, -4.5),
  "1M": generateChartData(480, 30, 8, -2.2),
  "3M": generateChartData(520, 60, 12, -1.8),
  "1Y": generateChartData(380, 252, 15, 0.13),
  "ALL": generateChartData(200, 500, 20, 0.43),
};

const reportsMap: Record<string, StockReport> = {
  NVDA: {
    stock: stocksMap.NVDA,
    aiSummary: "금리 상승 + AI 수요 둔화 우려 + 경쟁사 호실적 3중 악재로 평균 거래량 1.9배 수반한 매물 출회.",
    causes: [
      {
        rank: 1,
        title: "10년물 금리 4.55%로 재상승",
        desc: "고밸류 성장주 할인율 상승 → PER 80배 반도체주 직격. 같은 날 SOXX(반도체 ETF)도 −2.3% 동반 하락.",
        tags: ["#매크로", "#섹터"],
      },
      {
        rank: 2,
        title: 'TSMC "2026 AI 칩 수요 모멘텀 둔화" 가이던스',
        desc: "대만 어닝콜에서 언급. 엔비디아 최대 파운드리 공급사라 동반 하락 압력. AMD(−3.1%), AVGO(−2.8%)도 유사 패턴.",
        tags: ["#공급망", "#어닝"],
      },
      {
        rank: 3,
        title: "대형 기관투자자 차익실현 정황",
        desc: "평균 거래량 대비 1.9배 · 장 마감 30분간 물량 집중. 13F 공시 앞두고 포지션 조정으로 추정.",
        tags: ["#수급"],
      },
    ],
    sectorComparisons: [
      { label: "NVDA", changePct: -4.82, widthPct: 100, primary: true },
      { label: "반도체 섹터 (SOXX)", changePct: -2.31, widthPct: 48, primary: false },
      { label: "NASDAQ 100", changePct: -1.18, widthPct: 24, primary: false },
      { label: "S&P 500", changePct: -0.42, widthPct: 9, primary: false },
    ],
    news: [
      { source: "REUTERS", title: "美 10년물 금리 4.55% 돌파, 연준 인하 기대 후퇴", time: "3시간 전" },
      { source: "BLOOMBERG", title: "TSMC, 2026년 AI 칩 수요 모멘텀 둔화 전망", time: "5시간 전" },
      { source: "CNBC", title: "엔비디아, 대형 기관 매물 출회… 차익실현 관측", time: "7시간 전" },
      { source: "한경", title: '서학개미 "반도체 조정은 기회" vs 전문가 "조심"', time: "9시간 전" },
    ],
    macros: [
      { label: "10Y Yield", value: "4.55%", delta: "+5bp", up: true },
      { label: "VIX", value: "18.24", delta: "+1.05", up: true },
      { label: "XLK (기술주)", value: "−1.82%", delta: "상대적 약세", up: false },
      { label: "거래량", value: "1.9×", delta: "평균 대비", up: true },
    ],
    chartData: nvdaCharts,
  },
};

function generateFallbackReport(stock: Stock): StockReport {
  const up = stock.changePct >= 0;
  const pctAbs = Math.abs(stock.changePct).toFixed(2);
  const direction = up ? "상승" : "하락";
  const sectorLabel = `${stock.sector} 섹터`;

  return {
    stock,
    aiSummary: up
      ? `${stock.nameKo} ${pctAbs}% ${direction}. ${stock.sector} 섹터 강세 흐름에 합류하며 매수세 유입.`
      : `${stock.nameKo} ${pctAbs}% ${direction}. 매크로 변동성 확대와 ${stock.sector} 섹터 전반 약세 영향.`,
    causes: up
      ? [
          {
            rank: 1,
            title: `${stock.sector} 섹터 강세 순환매 유입`,
            desc: `섹터 ETF 대비 초과 수익. 기관 매수 창구에서 순매수 우위 관찰.`,
            tags: ["#수급", `#${stock.sector}`],
          },
          {
            rank: 2,
            title: "매크로 위험 선호 회복",
            desc: "위험 자산 선호 회복 + 달러 약세로 성장주에 우호적 환경 조성.",
            tags: ["#매크로"],
          },
          {
            rank: 3,
            title: "실적 기대감",
            desc: "다음 분기 가이던스 상향 루머 + 애널리스트 컨센서스 상향 조정.",
            tags: ["#실적"],
          },
        ]
      : [
          {
            rank: 1,
            title: "매크로 역풍",
            desc: "금리 상승 · 달러 강세로 위험 자산 전반 압박. 고밸류 종목 우선 조정.",
            tags: ["#매크로"],
          },
          {
            rank: 2,
            title: `${sectorLabel} 동반 약세`,
            desc: `${stock.sector} 섹터 전반 투자심리 악화. 주요 피어 종목도 유사 등락률 기록.`,
            tags: ["#섹터"],
          },
          {
            rank: 3,
            title: "차익실현 수급",
            desc: "최근 단기 상승 구간에서 차익실현 물량 출회. 거래량 증가 동반.",
            tags: ["#수급"],
          },
        ],
    sectorComparisons: [
      { label: stock.ticker, changePct: stock.changePct, widthPct: 100, primary: true },
      { label: sectorLabel, changePct: stock.changePct * 0.6, widthPct: 60, primary: false },
      { label: "S&P 500", changePct: -0.42, widthPct: 18, primary: false },
    ],
    news: [
      { source: "REUTERS", title: `${stock.nameKo}, ${direction}세 지속… 거래량 확대`, time: "2시간 전" },
      { source: "BLOOMBERG", title: `${stock.sector} 섹터, 매크로 변동성에 민감 반응`, time: "4시간 전" },
      { source: "CNBC", title: `애널리스트 "${stock.nameKo} 목표주가 조정 가능성"`, time: "6시간 전" },
      { source: "한경", title: `서학개미 ${stock.nameKo} 순${up ? "매수" : "매도"} 우위`, time: "8시간 전" },
    ],
    macros: [
      { label: "10Y Yield", value: "4.55%", delta: "+5bp", up: true },
      { label: "VIX", value: "18.24", delta: "+1.05", up: true },
      { label: "DXY (달러)", value: "106.18", delta: "+0.32%", up: true },
      { label: "WTI 원유", value: "$82.41", delta: "−0.74%", up: false },
    ],
    chartData: chartsFromPrice(stock.price, stock.changePct),
  };
}

export function getReport(ticker: string): StockReport | null {
  const upper = ticker.toUpperCase();
  if (reportsMap[upper]) return reportsMap[upper];
  const stock = stocksMap[upper];
  return stock ? generateFallbackReport(stock) : null;
}
