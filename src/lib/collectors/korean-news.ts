export interface KoreanNewsItem {
  title: string;
  source: string;
  pubDate: string;
  url: string;
}

// ── Google News RSS ──

const GOOGLE_QUERIES_US = [
  "미국 증시",
  "나스닥 증시",
  "월가 시장",
  "연준 금리",
];

const GOOGLE_QUERIES_KR = [
  "코스피 증시",
  "코스닥 시장",
  "삼성전자 주가",
  "원달러 환율",
];

async function fetchGoogleNewsRss(query: string, limit: number): Promise<KoreanNewsItem[]> {
  const url = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=ko&gl=KR&ceid=KR:ko&when=1d`;

  try {
    const res = await fetch(url, { next: { revalidate: 1800 } });
    if (!res.ok) return [];
    const xml = await res.text();
    return parseRssItems(xml, limit);
  } catch {
    return [];
  }
}

// ── 연합뉴스 RSS ──

async function fetchYonhapNews(limit: number): Promise<KoreanNewsItem[]> {
  try {
    const res = await fetch("https://www.yna.co.kr/rss/economy.xml", {
      next: { revalidate: 1800 },
    });
    if (!res.ok) return [];
    const xml = await res.text();
    return parseRssItems(xml, limit, "연합뉴스");
  } catch {
    return [];
  }
}

// ── 공통 RSS 파서 ──

function parseRssItems(xml: string, limit: number, defaultSource?: string): KoreanNewsItem[] {
  const items: KoreanNewsItem[] = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match;

  while ((match = itemRegex.exec(xml)) !== null && items.length < limit) {
    const block = match[1];

    // CDATA 처리
    let title = block.match(/<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>/)?.[1]?.trim()
      ?? block.match(/<title>([\s\S]*?)<\/title>/)?.[1]?.trim()
      ?? "";
    const source = defaultSource
      ?? block.match(/<source[^>]*>([\s\S]*?)<\/source>/)?.[1]?.trim()
      ?? "";
    const pubDate = block.match(/<pubDate>([\s\S]*?)<\/pubDate>/)?.[1]?.trim() ?? "";
    const url = block.match(/<link>([\s\S]*?)<\/link>/)?.[1]?.trim() ?? "";

    title = title
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&#39;/g, "'")
      .replace(/&quot;/g, '"');

    if (title) {
      items.push({ title, source, pubDate, url });
    }
  }

  return items;
}

// ── 내보내기 ──

function dedup(items: KoreanNewsItem[], limit: number): KoreanNewsItem[] {
  const seen = new Set<string>();
  const result: KoreanNewsItem[] = [];
  for (const item of items) {
    if (seen.has(item.title)) continue;
    seen.add(item.title);
    result.push(item);
    if (result.length >= limit) break;
  }
  return result;
}

/** 미국 시장 관련 한국어 뉴스 */
export async function fetchKoreanNews(limit = 20): Promise<KoreanNewsItem[]> {
  const perQuery = Math.ceil(limit / GOOGLE_QUERIES_US.length);
  const results = await Promise.allSettled([
    ...GOOGLE_QUERIES_US.map((q) => fetchGoogleNewsRss(q, perQuery)),
    fetchYonhapNews(8),
  ]);

  const all: KoreanNewsItem[] = [];
  for (const r of results) {
    if (r.status === "fulfilled") all.push(...r.value);
  }
  return dedup(all, limit);
}

/** 특정 키워드로 한국어 뉴스 검색 (종목 리포트용) */
export async function fetchKoreanNewsByQuery(query: string, limit = 4): Promise<KoreanNewsItem[]> {
  return fetchGoogleNewsRss(query, limit);
}

/** 한국 시장 관련 한국어 뉴스 */
export async function fetchKoreanMarketNews(limit = 20): Promise<KoreanNewsItem[]> {
  const perQuery = Math.ceil(limit / GOOGLE_QUERIES_KR.length);
  const results = await Promise.allSettled([
    ...GOOGLE_QUERIES_KR.map((q) => fetchGoogleNewsRss(q, perQuery)),
    fetchYonhapNews(8),
  ]);

  const all: KoreanNewsItem[] = [];
  for (const r of results) {
    if (r.status === "fulfilled") all.push(...r.value);
  }
  return dedup(all, limit);
}
