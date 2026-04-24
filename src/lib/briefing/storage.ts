import "server-only";
import { getServerClient } from "@/lib/clients/supabase";
import type { RawSources, KrRawSources, TokenUsage } from "./types";
import type { PipelineOutput } from "@/lib/ai/pipeline";

const TABLE = "briefing_runs";

export type RunStatus = "running" | "success" | "partial" | "failed";

export interface BriefingRun {
  id: string;
  started_at: string;
  finished_at: string | null;
  status: RunStatus;
  triggered_by: "cron" | "manual";
  session: import("@/types/stock").BriefingSession;
  error: string | null;
  raw_sources: RawSources | null;
  briefing_data: Omit<PipelineOutput, "usage"> | null;
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
    briefingData: Omit<PipelineOutput, "usage">;
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
  session: import("@/types/stock").BriefingSession,
): Promise<BriefingRun | null> {
  const supa = getServerClient();
  const { data, error } = await supa
    .from(TABLE)
    .select("*")
    .eq("session", session)
    .in("status", ["success", "partial"])
    .order("started_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) return null;
  return (data as BriefingRun | null) ?? null;
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
