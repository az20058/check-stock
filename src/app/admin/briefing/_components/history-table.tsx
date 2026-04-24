import type { BriefingRun } from "@/lib/briefing/storage";

function formatTime(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, "0")}:${String(
    d.getMinutes(),
  ).padStart(2, "0")}`;
}

function durationSec(r: BriefingRun): string {
  if (!r.finished_at) return "—";
  const ms = new Date(r.finished_at).getTime() - new Date(r.started_at).getTime();
  return `${(ms / 1000).toFixed(1)}s`;
}

const statusColor: Record<string, string> = {
  success: "text-green-400",
  partial: "text-yellow-400",
  failed: "text-red-400",
  running: "text-blue-400",
};

export default function HistoryTable({ runs }: { runs: BriefingRun[] }) {
  if (runs.length === 0) {
    return <p className="text-sm text-gray-400">실행 이력이 없습니다.</p>;
  }
  return (
    <table className="w-full text-sm">
      <thead className="text-left text-xs text-gray-400 border-b border-gray-700">
        <tr>
          <th className="py-2 pr-3">시작</th>
          <th className="py-2 pr-3">상태</th>
          <th className="py-2 pr-3">트리거</th>
          <th className="py-2 pr-3">소요</th>
          <th className="py-2 pr-3">토큰 (in/out)</th>
          <th className="py-2">에러</th>
        </tr>
      </thead>
      <tbody>
        {runs.map((r) => (
          <tr key={r.id} className="border-b border-gray-800">
            <td className="py-2 pr-3 text-gray-300">{formatTime(r.started_at)}</td>
            <td className={`py-2 pr-3 font-medium ${statusColor[r.status] ?? ""}`}>
              {r.status}
            </td>
            <td className="py-2 pr-3 text-gray-400">{r.triggered_by}</td>
            <td className="py-2 pr-3 text-gray-400">{durationSec(r)}</td>
            <td className="py-2 pr-3 text-gray-400">
              {r.token_usage
                ? `${r.token_usage.input}/${r.token_usage.output} (${r.token_usage.calls}회)`
                : "—"}
            </td>
            <td className="py-2 text-red-300 truncate max-w-[260px]">{r.error ?? ""}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
