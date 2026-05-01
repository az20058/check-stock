import "server-only";
import { embed } from "@/lib/clients/embedding";
import { getServerClient } from "@/lib/clients/supabase";
import { toKstIso } from "@/lib/utils/datetime";

export interface NewsRow {
  source: string;
  ticker: string | null;
  headline: string;
  summary: string | null;
  url: string | null;
  publishedAt: Date;
}

function dedup(items: NewsRow[]): NewsRow[] {
  const seen = new Set<string>();
  const out: NewsRow[] = [];
  for (const n of items) {
    const key = (n.url && n.url.length > 0) ? `u:${n.url}` : `h:${n.headline}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(n);
  }
  return out;
}

function toEmbedText(n: NewsRow): string {
  return n.summary ? `${n.headline}\n${n.summary}` : n.headline;
}

/**
 * 수집된 뉴스를 임베딩하여 news_embeddings에 저장.
 * - URL 중복은 SQL unique index가 ON CONFLICT DO NOTHING으로 흡수
 * - 호출 실패는 로그만 남기고 throw하지 않음 (배치 전체를 막지 않기 위함)
 */
export async function ingestNews(items: NewsRow[]): Promise<{ inserted: number; skipped: number }> {
  if (items.length === 0) return { inserted: 0, skipped: 0 };
  const unique = dedup(items);
  try {
    const vectors = await embed(unique.map(toEmbedText), "document");
    const rows = unique.map((n, i) => ({
      source: n.source,
      ticker: n.ticker,
      headline: n.headline,
      summary: n.summary,
      url: n.url,
      published_at: toKstIso(n.publishedAt),
      embedding: vectors[i],
    }));
    const { error, count } = await getServerClient()
      .from("news_embeddings")
      .upsert(rows, { onConflict: "headline", ignoreDuplicates: true, count: "exact" });
    if (error) {
      console.error("[rag/ingest] upsert failed:", error.message);
      return { inserted: 0, skipped: unique.length };
    }
    return { inserted: count ?? 0, skipped: unique.length - (count ?? 0) };
  } catch (err) {
    console.error("[rag/ingest] error:", err);
    return { inserted: 0, skipped: unique.length };
  }
}
