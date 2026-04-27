import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";

// .env.local 파싱 (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY)
const envText = readFileSync(".env.local", "utf-8");
const env = Object.fromEntries(
  envText
    .split(/\r?\n/)
    .filter((l) => l && !l.startsWith("#") && l.includes("="))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, "")];
    }),
);

const url = env.SUPABASE_URL;
const key = env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY not found in .env.local");
  process.exit(1);
}

const supa = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const { count: before, error: cErr } = await supa
  .from("briefing_runs")
  .select("*", { count: "exact", head: true });
if (cErr) {
  console.error("count failed:", cErr.message);
  process.exit(1);
}
console.log(`before: ${before} rows`);

const { error: dErr } = await supa
  .from("briefing_runs")
  .delete()
  .gte("started_at", "1970-01-01");
if (dErr) {
  console.error("delete failed:", dErr.message);
  process.exit(1);
}

const { count: after } = await supa
  .from("briefing_runs")
  .select("*", { count: "exact", head: true });
console.log(`after:  ${after} rows`);
console.log(`deleted: ${(before ?? 0) - (after ?? 0)}`);
