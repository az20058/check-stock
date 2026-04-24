"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function TriggerButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function onClick() {
    setPending(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/briefing/trigger", { method: "POST" });
      const data = (await res.json()) as { ok: boolean; runId?: string; error?: string };
      if (!res.ok || !data.ok) {
        setMessage(`실패: ${data.error ?? res.statusText}`);
      } else {
        setMessage(`완료 (run ${data.runId?.slice(0, 8)})`);
        router.refresh();
      }
    } catch (err) {
      setMessage(`네트워크 오류: ${err instanceof Error ? err.message : "unknown"}`);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={onClick}
        disabled={pending}
        className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50 hover:bg-blue-500"
      >
        {pending ? "실행 중..." : "지금 배치 실행"}
      </button>
      {message && <span className="text-sm text-gray-300">{message}</span>}
    </div>
  );
}
