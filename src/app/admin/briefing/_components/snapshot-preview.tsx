import type { BriefingRun } from "@/lib/briefing/storage";

export default function SnapshotPreview({ run }: { run: BriefingRun | null }) {
  if (!run?.briefing_data) {
    return (
      <div className="rounded-md border border-gray-700 p-4 text-sm text-gray-400">
        아직 성공한 스냅샷이 없습니다. &ldquo;지금 배치 실행&rdquo;을 눌러보세요.
      </div>
    );
  }
  const d = run.briefing_data;
  // US 브리핑 데이터를 미리보기에 사용
  const us = d.us;
  return (
    <div className="rounded-md border border-gray-700 p-4 space-y-4">
      <div>
        <p className="text-xs uppercase text-gray-500 mb-1">HEADLINE (US)</p>
        <p className="text-lg font-semibold text-white">
          <span className="text-blue-400">{us.headlineAccent}</span> {us.headline}
        </p>
        <p className="text-xs text-gray-500 mt-1">{us.dateLabel}</p>
      </div>
      <div>
        <p className="text-xs uppercase text-gray-500 mb-1">{us.summary?.title ?? "요약"}</p>
        <p className="text-sm text-gray-200">{us.summary?.body}</p>
        <p className="text-xs text-gray-400 mt-1">{us.summary?.sub}</p>
        <div className="flex gap-2 mt-2">
          {us.summary?.tags?.map((t: string) => (
            <span key={t} className="text-xs rounded bg-gray-800 px-2 py-1 text-gray-300">
              {t}
            </span>
          ))}
        </div>
      </div>
      <div>
        <p className="text-xs uppercase text-gray-500 mb-2">MOVERS</p>
        <ul className="space-y-1">
          {us.movers?.map((m: { ticker: string; reason: string }) => (
            <li key={m.ticker} className="text-sm">
              <span className="font-mono text-gray-300">{m.ticker}</span>
              <span className="text-gray-500 mx-2">·</span>
              <span className="text-gray-200">{m.reason}</span>
            </li>
          ))}
        </ul>
      </div>
      {us.events && us.events.length > 0 && (
        <div>
          <p className="text-xs uppercase text-gray-500 mb-2">EVENTS</p>
          <ul className="space-y-1">
            {us.events.map((e: { time: string; title: string; desc: string }, i: number) => (
              <li key={i} className="text-sm">
                <span className="text-gray-400">{e.time}</span>
                <span className="text-gray-500 mx-2">·</span>
                <span className="text-gray-200">{e.title}</span>
                <span className="text-gray-500"> — {e.desc}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
