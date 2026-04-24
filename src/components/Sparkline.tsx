"use client";

import { normalizeChartPoints, pointsToPath } from "@/lib/chart";

export default function Sparkline({
  data, up = false, width = 72, height = 28, stroke = 2,
}: {
  data: number[]; up?: boolean; width?: number; height?: number; stroke?: number;
}) {
  const pts = normalizeChartPoints(data, { width, height });
  const d = pointsToPath(pts);
  const areaD = d + ` L ${width} ${height} L 0 ${height} Z`;
  const color = up ? "var(--up)" : "var(--down)";
  const fill = up ? "var(--up-soft)" : "var(--down-soft)";

  return (
    <svg className="inline-block align-middle" width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <path d={areaD} fill={fill}/>
      <path d={d} stroke={color} strokeWidth={stroke} fill="none" strokeLinejoin="round" strokeLinecap="round"/>
    </svg>
  );
}
