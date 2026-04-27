import "server-only";

const ENDPOINT = "https://api.voyageai.com/v1/embeddings";
const MODEL = "voyage-3";  // 1024차원 multilingual
const MAX_BATCH = 128;     // Voyage 단일 호출 한도

export type EmbedInputType = "document" | "query";

interface VoyageResponse {
  data: { embedding: number[]; index: number }[];
  usage: { total_tokens: number };
}

/**
 * Voyage AI로 텍스트를 1024차원 벡터로 변환.
 * - input_type: ingestion 시 "document", 검색 쿼리는 "query"
 * - 128건 초과 시 자동 분할
 */
export async function embed(
  texts: string[],
  inputType: EmbedInputType = "document",
): Promise<number[][]> {
  const apiKey = process.env.VOYAGE_API_KEY;
  if (!apiKey) throw new Error("VOYAGE_API_KEY not set");
  if (texts.length === 0) return [];

  const out: number[][] = new Array(texts.length);
  for (let i = 0; i < texts.length; i += MAX_BATCH) {
    const batch = texts.slice(i, i + MAX_BATCH);
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        input: batch,
        input_type: inputType,
      }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(`Voyage embed failed: ${res.status} ${body}`);
    }
    const json = (await res.json()) as VoyageResponse;
    for (const d of json.data) out[i + d.index] = d.embedding;
  }
  return out;
}
