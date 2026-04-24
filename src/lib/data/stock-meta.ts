import type { MarketCode } from "@/types/stock";

/** 주요 종목 한국어명·섹터·시장 매핑 (정적 참조 데이터) */
export interface StockMeta {
  nameKo: string;
  sector: string;
  market: MarketCode;
  exchange: string;
  currency: "USD" | "KRW";
}

export const STOCK_META: Record<string, StockMeta> = {
  // ── US ──
  NVDA: { nameKo: "엔비디아", sector: "반도체", market: "US", exchange: "NASDAQ", currency: "USD" },
  TSLA: { nameKo: "테슬라", sector: "전기차", market: "US", exchange: "NASDAQ", currency: "USD" },
  AAPL: { nameKo: "애플", sector: "기술", market: "US", exchange: "NASDAQ", currency: "USD" },
  MSFT: { nameKo: "마이크로소프트", sector: "기술", market: "US", exchange: "NASDAQ", currency: "USD" },
  GOOGL: { nameKo: "구글", sector: "기술", market: "US", exchange: "NASDAQ", currency: "USD" },
  AMZN: { nameKo: "아마존", sector: "이커머스", market: "US", exchange: "NASDAQ", currency: "USD" },
  META: { nameKo: "메타", sector: "기술", market: "US", exchange: "NASDAQ", currency: "USD" },
  AVGO: { nameKo: "브로드컴", sector: "반도체", market: "US", exchange: "NASDAQ", currency: "USD" },
  TSM: { nameKo: "TSMC", sector: "반도체", market: "US", exchange: "NYSE", currency: "USD" },
  "BRK.B": { nameKo: "버크셔해서웨이", sector: "금융", market: "US", exchange: "NYSE", currency: "USD" },
  AMD: { nameKo: "AMD", sector: "반도체", market: "US", exchange: "NASDAQ", currency: "USD" },
  NFLX: { nameKo: "넷플릭스", sector: "미디어", market: "US", exchange: "NASDAQ", currency: "USD" },
  INTC: { nameKo: "인텔", sector: "반도체", market: "US", exchange: "NASDAQ", currency: "USD" },
  CRM: { nameKo: "세일즈포스", sector: "기술", market: "US", exchange: "NYSE", currency: "USD" },
  ORCL: { nameKo: "오라클", sector: "기술", market: "US", exchange: "NYSE", currency: "USD" },
  ADBE: { nameKo: "어도비", sector: "기술", market: "US", exchange: "NASDAQ", currency: "USD" },
  QCOM: { nameKo: "퀄컴", sector: "반도체", market: "US", exchange: "NASDAQ", currency: "USD" },
  PYPL: { nameKo: "페이팔", sector: "핀테크", market: "US", exchange: "NASDAQ", currency: "USD" },
  UBER: { nameKo: "우버", sector: "모빌리티", market: "US", exchange: "NYSE", currency: "USD" },
  COIN: { nameKo: "코인베이스", sector: "암호화폐", market: "US", exchange: "NASDAQ", currency: "USD" },
  PLTR: { nameKo: "팔란티어", sector: "AI/데이터", market: "US", exchange: "NYSE", currency: "USD" },
  SNOW: { nameKo: "스노우플레이크", sector: "클라우드", market: "US", exchange: "NYSE", currency: "USD" },
  SQ: { nameKo: "블록(스퀘어)", sector: "핀테크", market: "US", exchange: "NYSE", currency: "USD" },
  SHOP: { nameKo: "쇼피파이", sector: "이커머스", market: "US", exchange: "NYSE", currency: "USD" },
  SPOT: { nameKo: "스포티파이", sector: "미디어", market: "US", exchange: "NYSE", currency: "USD" },
  BA: { nameKo: "보잉", sector: "항공", market: "US", exchange: "NYSE", currency: "USD" },
  DIS: { nameKo: "디즈니", sector: "미디어", market: "US", exchange: "NYSE", currency: "USD" },
  V: { nameKo: "비자", sector: "금융", market: "US", exchange: "NYSE", currency: "USD" },
  MA: { nameKo: "마스터카드", sector: "금융", market: "US", exchange: "NYSE", currency: "USD" },
  JPM: { nameKo: "JP모건", sector: "금융", market: "US", exchange: "NYSE", currency: "USD" },
  BAC: { nameKo: "뱅크오브아메리카", sector: "금융", market: "US", exchange: "NYSE", currency: "USD" },
  WMT: { nameKo: "월마트", sector: "유통", market: "US", exchange: "NYSE", currency: "USD" },
  KO: { nameKo: "코카콜라", sector: "소비재", market: "US", exchange: "NYSE", currency: "USD" },
  PEP: { nameKo: "펩시", sector: "소비재", market: "US", exchange: "NASDAQ", currency: "USD" },
  JNJ: { nameKo: "존슨앤존슨", sector: "헬스케어", market: "US", exchange: "NYSE", currency: "USD" },
  PFE: { nameKo: "화이자", sector: "헬스케어", market: "US", exchange: "NYSE", currency: "USD" },
  UNH: { nameKo: "유나이티드헬스", sector: "헬스케어", market: "US", exchange: "NYSE", currency: "USD" },
  XOM: { nameKo: "엑슨모빌", sector: "에너지", market: "US", exchange: "NYSE", currency: "USD" },
  CVX: { nameKo: "쉐브론", sector: "에너지", market: "US", exchange: "NYSE", currency: "USD" },
  LLY: { nameKo: "일라이릴리", sector: "헬스케어", market: "US", exchange: "NYSE", currency: "USD" },
  NVO: { nameKo: "노보노디스크", sector: "헬스케어", market: "US", exchange: "NYSE", currency: "USD" },
  COST: { nameKo: "코스트코", sector: "유통", market: "US", exchange: "NASDAQ", currency: "USD" },
  HD: { nameKo: "홈디포", sector: "유통", market: "US", exchange: "NYSE", currency: "USD" },
  MCD: { nameKo: "맥도날드", sector: "소비재", market: "US", exchange: "NYSE", currency: "USD" },
  SBUX: { nameKo: "스타벅스", sector: "소비재", market: "US", exchange: "NASDAQ", currency: "USD" },
  NKE: { nameKo: "나이키", sector: "소비재", market: "US", exchange: "NYSE", currency: "USD" },
  ARM: { nameKo: "ARM", sector: "반도체", market: "US", exchange: "NASDAQ", currency: "USD" },
  SMCI: { nameKo: "슈퍼마이크로", sector: "서버/HW", market: "US", exchange: "NASDAQ", currency: "USD" },
  MSTR: { nameKo: "마이크로스트래티지", sector: "암호화폐", market: "US", exchange: "NASDAQ", currency: "USD" },
  SOFI: { nameKo: "소파이", sector: "핀테크", market: "US", exchange: "NASDAQ", currency: "USD" },

  // ── KR ──
  "005930": { nameKo: "삼성전자", sector: "반도체", market: "KR", exchange: "KOSPI", currency: "KRW" },
  "000660": { nameKo: "SK하이닉스", sector: "반도체", market: "KR", exchange: "KOSPI", currency: "KRW" },
  "035420": { nameKo: "NAVER", sector: "IT서비스", market: "KR", exchange: "KOSPI", currency: "KRW" },
  "005380": { nameKo: "현대차", sector: "자동차", market: "KR", exchange: "KOSPI", currency: "KRW" },
  "000270": { nameKo: "기아", sector: "자동차", market: "KR", exchange: "KOSPI", currency: "KRW" },
  "035720": { nameKo: "카카오", sector: "IT서비스", market: "KR", exchange: "KOSPI", currency: "KRW" },
  "051910": { nameKo: "LG화학", sector: "화학", market: "KR", exchange: "KOSPI", currency: "KRW" },
  "006400": { nameKo: "삼성SDI", sector: "배터리", market: "KR", exchange: "KOSPI", currency: "KRW" },
  "068270": { nameKo: "셀트리온", sector: "바이오", market: "KR", exchange: "KOSPI", currency: "KRW" },
  "055550": { nameKo: "신한지주", sector: "금융", market: "KR", exchange: "KOSPI", currency: "KRW" },
  "105560": { nameKo: "KB금융", sector: "금융", market: "KR", exchange: "KOSPI", currency: "KRW" },
  "003670": { nameKo: "포스코퓨처엠", sector: "소재", market: "KR", exchange: "KOSPI", currency: "KRW" },
};

export function getStockMeta(ticker: string): StockMeta | undefined {
  return STOCK_META[ticker] ?? STOCK_META[ticker.toUpperCase()];
}

/** 티커로 시장 코드 추론 (6자리 숫자면 KR, 아니면 US) */
export function inferMarket(ticker: string): "US" | "KR" {
  return /^\d{6}$/.test(ticker) ? "KR" : "US";
}
