"use client";

export default function Avatar({ ticker, size = "md" }: { ticker: string; size?: "md" | "lg" }) {
  const hash = [...ticker].reduce((a, c) => a + c.charCodeAt(0), 0);
  const hue = (hash * 47) % 360;

  const sizeClasses = size === "lg"
    ? "w-11 h-11 rounded-xl text-[13px]"
    : "w-9 h-9 rounded-[10px] text-[11px]";

  return (
    <div
      className={`${sizeClasses} inline-flex items-center justify-center font-mono font-bold tracking-wide`}
      style={{
        background: `linear-gradient(135deg, oklch(0.28 0.04 ${hue}), oklch(0.22 0.03 ${hue}))`,
        color: `oklch(0.85 0.06 ${hue})`,
        border: "1px solid var(--line)",
      }}
    >
      {ticker.slice(0, 4)}
    </div>
  );
}
