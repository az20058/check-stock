export interface KoreanNewsItem {
  title: string;
  source: string;
  pubDate: string;
}

const QUERIES = [
  "미국 증시",
  "나스닥 증시",
  "월가 시장",
  "연준 금리",
];

async function fetchGoogleNewsRss(query: string, limit: number): Promise<KoreanNewsItem[]> {
  const url = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=ko&gl=KR&ceid=KR:ko&when=1d`;

  try {
    const res = await fetch(url, { next: { revalidate: 1800 } });
    if (!res.ok) return [];
    const xml = await res.text();

    const items: KoreanNewsItem[] = [];
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    let match;

    while ((match = itemRegex.exec(xml)) !== null && items.length < limit) {
      const block = match[1];
      const title = block.match(/<title>([\s\S]*?)<\/title>/)?.[1]?.trim() ?? "";
      const source = block.match(/<source[^>]*>([\s\S]*?)<\/source>/)?.[1]?.trim() ?? "";
      const pubDate = block.match(/<pubDate>([\s\S]*?)<\/pubDate>/)?.[1]?.trim() ?? "";

      if (title) {
        items.push({
          title: title.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&#39;/g, "'").replace(/&quot;/g, '"'),
          source,
          pubDate,
        });
      }
    }

    return items;
  } catch {
    return [];
  }
}

export async function fetchKoreanNews(limit = 20): Promise<KoreanNewsItem[]> {
  const perQuery = Math.ceil(limit / QUERIES.length);
  const results = await Promise.allSettled(
    QUERIES.map((q) => fetchGoogleNewsRss(q, perQuery)),
  );

  const all: KoreanNewsItem[] = [];
  const seen = new Set<string>();

  for (const r of results) {
    if (r.status !== "fulfilled") continue;
    for (const item of r.value) {
      if (seen.has(item.title)) continue;
      seen.add(item.title);
      all.push(item);
    }
  }

  return all.slice(0, limit);
}
