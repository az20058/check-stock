import type { BriefingData } from "@/types/stock";
import { stocksMap } from "./stocks";

export const briefingData: BriefingData = {
  date: "4월 24일 금요일 · 장마감 04:00 ET",
  headline: "이유를 정리했어요",
  headlineAccent: "나스닥이 흔들린",
  indices: [
    { label: "SPY", value: 708.45, changePct: -0.39 },
    { label: "QQQ", value: 651.42, changePct: -0.56 },
    { label: "DIA", value: 493.0, changePct: -0.36 },
    { label: "VIX", value: 18.24, changePct: 6.1 },
  ],
  summary: {
    title: "오늘의 시장 요약",
    body: "10년물 금리가 4.55%로 재상승하면서 고밸류 성장주 중심으로 차익실현 매물이 쏟아졌습니다.",
    sub: "엔비디아 어닝 가이던스 우려까지 겹쳐 반도체 섹터가 2.3% 하락. 방어주 성격의 유틸리티·헬스케어는 상대적으로 선방했어요.",
    tags: ["#금리", "#반도체", "#엔비디아"],
  },
  movers: [
    { ...stocksMap.NVDA, sparkline: [440, 438, 442, 436, 431, 428, 432, 425, 420, 418, 422, 415, 410, 412], reason: "AI 수요 둔화 우려" },
    { ...stocksMap.TSLA, sparkline: [180, 178, 176, 174, 177, 175, 172, 170, 169, 171, 168, 166, 167, 168], reason: "Q1 인도량 하회" },
    { ...stocksMap.AAPL, sparkline: [184, 185, 184, 186, 185, 187, 186, 185, 186, 187, 186, 186, 187, 187], reason: "서비스 매출 기대" },
    { ...stocksMap.MSFT, sparkline: [408, 406, 405, 404, 406, 405, 403, 404, 403, 402, 403, 402, 402, 402], reason: "금리 민감도" },
  ],
  macros: [
    { label: "10Y Treasury", value: "4.55%", delta: "+5bp", up: true },
    { label: "VIX", value: "18.24", delta: "+1.05", up: true },
    { label: "DXY (달러)", value: "106.18", delta: "+0.32%", up: true },
    { label: "WTI 원유", value: "$82.41", delta: "−0.74%", up: false },
  ],
  events: [
    { time: "KST 21:30", title: "미국 3월 PCE 물가지수 발표", desc: "예상 2.6% YoY · 연준 선호 지표", tag: "중요", important: true },
    { time: "KST 06:00", title: "MSFT · GOOGL 실적 발표", desc: "애프터마켓 · 가이던스 주목", tag: "이벤트", important: false },
  ],
};
