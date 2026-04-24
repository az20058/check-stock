import type { MarketNewsItem } from "@/lib/collectors/market-news";
import type { CompanyNewsItem } from "@/lib/collectors/company-news";
import type { EconomicEvent } from "@/lib/collectors/economic-calendar";
import type { KoreanNewsItem } from "@/lib/collectors/korean-news";
import type { MacroItem } from "@/types/stock";

export interface RawSources {
  collectedAt: string;
  marketNews: MarketNewsItem[];
  koreanNews: KoreanNewsItem[];
  companyNews: Record<string, CompanyNewsItem[]>;
  macros: MacroItem[];
  economicEvents: EconomicEvent[];
}

/** KR 시장 전용 수집 소스 */
export interface KrRawSources {
  collectedAt: string;
  koreanMarketNews: KoreanNewsItem[];
  companyNews: Record<string, CompanyNewsItem[]>;
  macros: MacroItem[];
}

export interface TokenUsage {
  input: number;
  output: number;
  calls: number;
}
