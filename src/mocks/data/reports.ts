import type { StockReport, TimeRange } from "@/types/stock";
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

const nvdaCharts: Record<TimeRange, number[]> = {
  "1D": [440, 438, 442, 436, 431, 428, 432, 425, 420, 418, 422, 415, 410, 412, 408, 405, 410, 414, 412, 408, 411, 412, 410, 413],
  "1W": generateChartData(445, 7, 5, -4.5),
  "1M": generateChartData(480, 30, 8, -2.2),
  "3M": generateChartData(520, 60, 12, -1.8),
  "1Y": generateChartData(380, 252, 15, 0.13),
  "ALL": generateChartData(200, 500, 20, 0.43),
};

export const reportsMap: Record<string, StockReport> = {
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
