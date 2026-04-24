/** 주요 종목 한국어명·섹터 매핑 (정적 참조 데이터) */
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
