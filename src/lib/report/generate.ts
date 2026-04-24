import "server-only";
import { fetchQuotes } from "@/lib/clients/finnhub";
import { fetchCompanyNews } from "@/lib/collectors/company-news";
import { fetchKoreanNews } from "@/lib/collectors/korean-news";
import { fetchMacros } from "@/lib/collectors/macros";
import { fetchAllCandles } from "@/lib/clients/finnhub-candles";
import { callClaudeJson } from "@/lib/clients/anthropic";
import { getStockMeta } from "@/lib/data/stock-meta";
import type { StockReport, Stock, Cause, NewsItem, SectorComparison } from "@/types/stock";

const REPORT_SYSTEM = `너는 한국어 증권 리서치 애널리스트다.
개별 종목의 최근 움직임을 분석하여 개인 투자자가 이해할 수 있게 정리한다.
뉴스·데이터에 근거해서만 답하고, 투자 권유는 하지 않는다.`.trim();

const reportJsonSchema = {
  type: "object",
  properties: {
    aiSummary: {
      type: "string",
      description: "종목 움직임 한 줄 요약 (40~80자, 한국어)",
    },
    causes: {
      type: "array",
      items: {
        type: "object",
        properties: {
          rank: { type: "number" },
          title: { type: "string", description: "원인 제목 (한국어, 20자 내외)" },
          desc: { type: "string", description: "상세 설명 (한국어, 50~100자)" },
          tags: { type: "array", items: { type: "string" }, maxItems: 3 },
        },
        required: ["rank", "title", "desc", "tags"],
      },
      maxItems: 3,
    },
    sectorComparisons: {
      type: "array",
      items: {
        type: "object",
        properties: {
          label: { type: "string" },
          changePct: { type: "number" },
          widthPct: { type: "number" },
          primary: { type: "boolean" },
        },
        required: ["label", "changePct", "widthPct", "primary"],
      },
    },
  },
  required: ["aiSummary", "causes", "sectorComparisons"],
} as const;

interface ClaudeReportOutput {
  aiSummary: string;
  causes: Cause[];
  sectorComparisons: SectorComparison[];
}

export async function generateReport(ticker: string): Promise<StockReport> {
  const upperTicker = ticker.toUpperCase();
  const meta = getStockMeta(upperTicker);

  const nameKo = meta?.nameKo ?? upperTicker;
  const koreanQuery = nameKo !== upperTicker ? nameKo : undefined;

  const [quotesRes, newsRes, koreanNewsRes, macrosRes, candlesRes] = await Promise.allSettled([
    fetchQuotes([upperTicker]),
    fetchCompanyNews(upperTicker, 6),
    koreanQuery ? fetchKoreanNews(6) : Promise.resolve([]),
    fetchMacros(),
    fetchAllCandles(upperTicker),
  ]);

  const quotes = quotesRes.status === "fulfilled" ? quotesRes.value : [];
  const companyNews = newsRes.status === "fulfilled" ? newsRes.value : [];
  const koreanNews = koreanNewsRes.status === "fulfilled" ? koreanNewsRes.value : [];
  const macros = macrosRes.status === "fulfilled" ? macrosRes.value : [];
  const chartData =
    candlesRes.status === "fulfilled"
      ? candlesRes.value
      : { "1D": [], "1W": [], "1M": [], "3M": [], "1Y": [], ALL: [] };

  const quote = quotes.find((q) => q.symbol === upperTicker);
  if (!quote) throw new Error(`No quote data for ${upperTicker}`);

  const price = quote.c;
  const changePct = quote.dp;
  const change = price - price / (1 + changePct / 100);

  const stock: Stock = {
    ticker: upperTicker,
    name: meta?.nameKo ?? upperTicker,
    nameKo: meta?.nameKo ?? upperTicker,
    market: meta?.market ?? "US",
    exchange: meta?.exchange ?? "",
    currency: meta?.currency ?? "USD",
    sector: meta?.sector ?? "",
    price,
    change,
    changePct,
    sparkline: chartData["1D"].slice(-8),
  };

  // Claude 분석
  const direction = changePct >= 0 ? "상승" : "하락";
  const newsText = companyNews
    .slice(0, 6)
    .map(
      (n, i) =>
        `${i + 1}. [${n.source}] ${n.headline}${n.summary ? ` — ${n.summary.slice(0, 120)}` : ""}`,
    )
    .join("\n");

  const userPrompt = `종목: ${stock.nameKo} (${upperTicker})
오늘 ${Math.abs(changePct).toFixed(2)}% ${direction}. 현재가 $${price.toFixed(2)}.

[최근 뉴스]
${newsText || "(관련 뉴스 없음)"}

[매크로]
${macros.map((m) => `- ${m.label}: ${m.value} (${m.delta})`).join("\n") || "(없음)"}

위 정보를 바탕으로:
1. aiSummary: 이 종목의 움직임을 한 줄로 요약 (40~80자)
2. causes: 움직임의 원인 TOP 3 (rank, title, desc, tags)
3. sectorComparisons: 이 종목 vs 섹터 vs S&P 500 비교 (changePct, widthPct 포함)`;

  const claudeRes = await callClaudeJson<ClaudeReportOutput>({
    system: REPORT_SYSTEM,
    user: userPrompt,
    toolName: "submit_report",
    toolDescription: "종목 분석 리포트를 제출한다",
    inputSchema: reportJsonSchema,
    maxTokens: 1000,
  });

  const enNews: NewsItem[] = companyNews.slice(0, 4).map((n) => {
    const ago = Math.round((Date.now() / 1000 - n.datetime) / 3600);
    return {
      source: n.source.toUpperCase(),
      title: n.headline,
      time: ago > 0 ? `${ago}시간 전` : "방금",
      lang: "en",
    };
  });

  const koNews: NewsItem[] = koreanNews
    .filter((n) => nameKo !== upperTicker && n.title.includes(nameKo))
    .slice(0, 4)
    .map((n) => {
      const pubMs = new Date(n.pubDate).getTime();
      const ago = Math.round((Date.now() - pubMs) / 3600_000);
      return {
        source: n.source || "한국 뉴스",
        title: n.title,
        time: ago > 0 ? `${ago}시간 전` : "방금",
        lang: "ko",
      };
    });

  const newsItems: NewsItem[] = [...enNews, ...koNews];

  return {
    stock,
    aiSummary: claudeRes.data.aiSummary,
    causes: claudeRes.data.causes,
    sectorComparisons: claudeRes.data.sectorComparisons,
    news: newsItems,
    macros,
    chartData,
  };
}
