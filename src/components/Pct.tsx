"use client";

export default function Pct({ v, bold = false }: { v: number; bold?: boolean }) {
  const up = v > 0;
  const sign = up ? "+" : "";
  return (
    <span
      className="font-mono tabular-nums tracking-tight"
      style={{ color: up ? "var(--up)" : "var(--down)", fontWeight: bold ? 700 : 500 }}
    >
      {sign}{v.toFixed(2)}%
    </span>
  );
}
