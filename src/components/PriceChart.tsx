"use client";

import { normalizeChartPoints, pointsToPath } from "@/lib/chart";

export default function PriceChart({
  data, up = false, width = 335, height = 140,
}: {
  data: number[]; up?: boolean; width?: number; height?: number;
}) {
  const padT = 10, padB = 20, padL = 0, padR = 0;
  const pts = normalizeChartPoints(data, { width, height, top: padT, bottom: padB, left: padL, right: padR });
  const d = pointsToPath(pts);
  const h = height - padT - padB;
  const areaD = d + ` L ${width - padR} ${padT + h} L ${padL} ${padT + h} Z`;
  const color = up ? "var(--up)" : "var(--down)";
  const gridY = [0.25, 0.5, 0.75].map((p) => padT + h * p);
  const gradId = `grad-${up ? "up" : "down"}`;
  const last = pts[pts.length - 1];

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      {gridY.map((y, i) => (
        <line key={i} x1={padL} x2={width - padR} y1={y} y2={y} stroke="rgba(255,255,255,0.04)" strokeDasharray="2 3"/>
      ))}
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={up ? "#FF5466" : "#3B82F6"} stopOpacity="0.25"/>
          <stop offset="1" stopColor={up ? "#FF5466" : "#3B82F6"} stopOpacity="0"/>
        </linearGradient>
      </defs>
      <path d={areaD} fill={`url(#${gradId})`}/>
      <path d={d} stroke={color} strokeWidth="2" fill="none" strokeLinejoin="round" strokeLinecap="round"/>
      {last && <circle cx={last[0]} cy={last[1]} r="3.5" fill={color}/>}
      {last && <circle cx={last[0]} cy={last[1]} r="7" fill={color} fillOpacity="0.25"/>}
    </svg>
  );
}
