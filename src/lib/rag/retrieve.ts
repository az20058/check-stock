import "server-only";
import { embed } from "@/lib/clients/embedding";
import { getServerClient } from "@/lib/clients/supabase";

export interface RetrievedDoc {
  id: string;
  headline: string;
  summary: string | null;
  url: string | null;
  source: string;
  ticker: string | null;
  publishedAt: string;
  similarity: number;
}

interface MatchRow {
  id: string;
  headline: string;
  summary: string | null;
  url: string | null;
  source: string;
  ticker: string | null;
  published_at: string;
  similarity: number;
}

/**
 * pgvector 코사인 유사도 검색.
 * - ticker로 필터하면 종목별 RAG, null이면 전체 뉴스에서 검색
 * - daysBack은 최근 N일 이내 뉴스만
 */
export async function retrieve(
  query: string,
  opts: { ticker?: string | null; topK?: number; daysBack?: number } = {},
): Promise<RetrievedDoc[]> {
  const [qVec] = await embed([query], "query");
  const { data, error } = await getServerClient().rpc("match_news", {
    query_embedding: qVec,
    match_count: opts.topK ?? 5,
    filter_ticker: opts.ticker ?? null,
    filter_days: opts.daysBack ?? 7,
  });
  if (error) {
    console.error("[rag/retrieve] error:", error.message);
    return [];
  }
  return (data as MatchRow[]).map((r) => ({
    id: r.id,
    headline: r.headline,
    summary: r.summary,
    url: r.url,
    source: r.source,
    ticker: r.ticker,
    publishedAt: r.published_at,
    similarity: r.similarity,
  }));
}
