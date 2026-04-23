"use client";

export default function Sparkline({
  data, up = false, width = 72, height = 28, stroke = 2,
}: {
  data: number[]; up?: boolean; width?: number; height?: number; stroke?: number;
}) {
  const min = Math.min(...data), max = Math.max(...data);
  const range = max - min || 1;
  const stepX = width / (data.length - 1);
  const pts = data.map((v, i) => [i * stepX, height - ((v - min) / range) * height]);
  const d = pts.map((p, i) => (i === 0 ? "M" : "L") + p[0].toFixed(1) + " " + p[1].toFixed(1)).join(" ");
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
