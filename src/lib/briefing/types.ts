import type { MarketNewsItem } from "@/lib/collectors/market-news";
import type { CompanyNewsItem } from "@/lib/collectors/company-news";
import type { EconomicEvent } from "@/lib/collectors/economic-calendar";
import type { MacroItem } from "@/types/stock";

export interface RawSources {
  collectedAt: string;
  marketNews: MarketNewsItem[];
  companyNews: Record<string, CompanyNewsItem[]>;
  macros: MacroItem[];
  economicEvents: EconomicEvent[];
}

export interface TokenUsage {
  input: number;
  output: number;
  calls: number;
}
