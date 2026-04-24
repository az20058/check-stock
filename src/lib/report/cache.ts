import "server-only";
import { getServerClient } from "@/lib/clients/supabase";
import type { StockReport } from "@/types/stock";

const TABLE = "stock_reports";
const CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6시간

export async function getCachedReport(ticker: string): Promise<StockReport | null> {
  const supa = getServerClient();
  const { data, error } = await supa
    .from(TABLE)
    .select("report_data, created_at")
    .eq("ticker", ticker.toUpperCase())
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) return null;

  const age = Date.now() - new Date(data.created_at).getTime();
  if (age > CACHE_TTL_MS) return null;

  return data.report_data as StockReport;
}

export async function saveReport(ticker: string, report: StockReport): Promise<void> {
  const supa = getServerClient();
  await supa.from(TABLE).upsert(
    {
      ticker: ticker.toUpperCase(),
      report_data: report,
      created_at: new Date().toISOString(),
    },
    { onConflict: "ticker" },
  );
}
