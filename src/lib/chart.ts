export interface ChartPadding {
  top?: number;
  bottom?: number;
  left?: number;
  right?: number;
}

export interface NormalizeOptions extends ChartPadding {
  width: number;
  height: number;
}

export function normalizeChartPoints(
  data: readonly number[],
  opts: NormalizeOptions,
): [number, number][] {
  if (data.length === 0) return [];

  const { width, height } = opts;
  const padT = opts.top ?? 0;
  const padB = opts.bottom ?? 0;
  const padL = opts.left ?? 0;
  const padR = opts.right ?? 0;

  const w = width - padL - padR;
  const h = height - padT - padB;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  if (data.length === 1) {
    return [[padL, padT + h - ((data[0] - min) / range) * h]];
  }

  const stepX = w / (data.length - 1);
  return data.map((v, i) => [padL + i * stepX, padT + h - ((v - min) / range) * h]);
}

export function pointsToPath(points: readonly [number, number][]): string {
  return points
    .map((p, i) => (i === 0 ? "M" : "L") + p[0].toFixed(1) + " " + p[1].toFixed(1))
    .join(" ");
}

export function avatarHue(ticker: string): number {
  const hash = [...ticker].reduce((a, c) => a + c.charCodeAt(0), 0);
  return (hash * 47) % 360;
}
