import "server-only";
import { getServerClient } from "@/lib/clients/supabase";
import type { RawSources, KrRawSources, TokenUsage } from "./types";
import type { MarketBriefing } from "@/types/stock";

const TABLE = "briefing_runs";

export type RunStatus = "running" | "success" | "partial" | "failed";

/** enriched 형식: 배치에서 시세 스냅샷 포함하여 저장 */
export interface EnrichedBriefingData {
  us: MarketBriefing;
  kr: MarketBriefing;
}

export interface BriefingRun {
  id: string;
  started_at: string;
  finished_at: string | null;
  status: RunStatus;
  triggered_by: "cron" | "manual";
  session: import("@/types/stock").BriefingSession;
  error: string | null;
  raw_sources: RawSources | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  briefing_data: EnrichedBriefingData | Record<string, any> | null;
  token_usage: TokenUsage | null;
}

export async function startRun(
  triggeredBy: "cron" | "manual",
  session: import("@/types/stock").BriefingSession,
): Promise<string> {
  const supa = getServerClient();
  const { data, error } = await supa
    .from(TABLE)
    .insert({ status: "running", triggered_by: triggeredBy, session })
    .select("id")
    .single();
  if (error || !data) throw new Error(`startRun failed: ${error?.message ?? "no data"}`);
  return data.id as string;
}

export async function finishRun(
  runId: string,
  payload: {
    status: "success" | "partial";
    sources: RawSources;
    krSources: KrRawSources;
    briefingData: EnrichedBriefingData;
    tokenUsage: TokenUsage;
  },
): Promise<void> {
  const supa = getServerClient();
  const { error } = await supa
    .from(TABLE)
    .update({
      finished_at: new Date().toISOString(),
      status: payload.status,
      raw_sources: payload.sources,
      briefing_data: payload.briefingData,
      token_usage: payload.tokenUsage,
    })
    .eq("id", runId);
  if (error) throw new Error(`finishRun failed: ${error.message}`);
}

export async function failRun(runId: string, err: unknown): Promise<void> {
  const supa = getServerClient();
  const message = err instanceof Error ? err.message : String(err);
  await supa
    .from(TABLE)
    .update({
      finished_at: new Date().toISOString(),
      status: "failed",
      error: message.slice(0, 500),
    })
    .eq("id", runId);
}

export async function getLatestSnapshot(
  session?: import("@/types/stock").BriefingSession,
): Promise<BriefingRun | null> {
  const supa = getServerClient();
  let query = supa
    .from(TABLE)
    .select("*")
    .in("status", ["success", "partial"])
    .order("started_at", { ascending: false })
    .limit(1);

  if (session) {
    query = query.eq("session", session);
  }

  const { data, error } = await query.maybeSingle();

  // session 필터로 결과가 있으면 바로 반환
  if (!error && data) return data as BriefingRun;

  // session 필터로 매칭 안 됨 (컬럼 미존재 or 값 null) → session 없이 재시도
  if (session) {
    const { data: fallback } = await supa
      .from(TABLE)
      .select("*")
      .in("status", ["success", "partial"])
      .order("started_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    return (fallback as BriefingRun | null) ?? null;
  }

  return null;
}

export async function getRunById(id: string): Promise<BriefingRun | null> {
  const supa = getServerClient();
  const { data, error } = await supa
    .from(TABLE)
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error || !data) return null;
  return data as BriefingRun;
}

export async function listRecentRuns(limit = 10): Promise<BriefingRun[]> {
  const supa = getServerClient();
  const { data, error } = await supa
    .from(TABLE)
    .select("*")
    .order("started_at", { ascending: false })
    .limit(limit);
  if (error) return [];
  return (data as BriefingRun[]) ?? [];
}
