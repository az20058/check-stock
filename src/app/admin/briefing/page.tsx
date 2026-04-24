import { listRecentRuns, getLatestSnapshot } from "@/lib/briefing/storage";
import TriggerButton from "./_components/trigger-button";
import HistoryTable from "./_components/history-table";
import SnapshotPreview from "./_components/snapshot-preview";

export const dynamic = "force-dynamic";

export default async function AdminBriefingPage() {
  const [runs, latest] = await Promise.all([listRecentRuns(20), getLatestSnapshot("us_close")]);

  return (
    <div className="min-h-dvh bg-gray-950 text-gray-100 p-8">
      <div className="max-w-5xl mx-auto space-y-8">
        <header>
          <h1 className="text-2xl font-bold">브리핑 배치 관리</h1>
          <p className="text-sm text-gray-400 mt-1">
            수동 트리거 + 최근 실행 이력. Vercel Cron은 1일 2회 (KST 08:30, 20:30) 자동 실행.
          </p>
        </header>

        <section className="space-y-2">
          <TriggerButton />
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-3">최신 스냅샷</h2>
          <SnapshotPreview run={latest} />
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-3">최근 실행 이력</h2>
          <HistoryTable runs={runs} />
        </section>
      </div>
    </div>
  );
}
