export type TimeRange = "1D" | "1W" | "1M" | "3M" | "1Y" | "ALL";

export type MarketCode = "US" | "KR";

export type BriefingSession = "us_close" | "us_pre" | "kr_close";

export interface Stock {
  ticker: string;
  name: string;
  nameKo: string;
  market: MarketCode;
  exchange: string;
  currency: "USD" | "KRW";
  sector: string;
  price: number;
  change: number;
  changePct: number;
  sparkline: number[];
}

export interface MarketIndex {
  label: string;
  value: number;
  changePct: number;
}

export interface MacroItem {
  label: string;
  value: string;
  delta: string;
  up: boolean;
}

export interface EventItem {
  time: string;
  title: string;
  desc: string;
  tag: string;
  important: boolean;
}

export interface Cause {
  rank: number;
  title: string;
  desc: string;
  tags: string[];
}

export interface MarketBriefing {
  market: MarketCode;
  dateLabel: string;
  headline: string;
  headlineAccent: string;
  indices: MarketIndex[];
  summary: {
    title: string;
    body: string;
    sub: string;
    /** 상세 페이지용 3문단 풀 요약 (구레코드 호환을 위해 optional) */
    longBody?: string;
    /** 한국 투자자 시각 박스 (구레코드 호환을 위해 optional) */
    koreanContext?: string;
    tags: string[];
  };
  movers: (Stock & { reason: string })[];
  macros: MacroItem[];
  events: EventItem[];
  causes: Cause[];
}

export interface BriefingData {
  generatedAt: string;
  session: BriefingSession;
  us: MarketBriefing;
  kr: MarketBriefing;
}

export interface NewsItem {
  source: string;
  title: string;
  time: string;
  lang: "en" | "ko";
}

export interface SectorComparison {
  label: string;
  changePct: number;
  widthPct: number;
  primary: boolean;
}

export interface StockReport {
  stock: Stock;
  aiSummary: string;
  causes: Cause[];
  sectorComparisons: SectorComparison[];
  news: NewsItem[];
  macros: MacroItem[];
  chartData: Record<TimeRange, number[]>;
}

export interface WatchlistData {
  stocks: Stock[];
  mostMentioned: { ticker: string; name: string; count: number }[];
}
