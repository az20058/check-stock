import { describe, it, expect } from "vitest";
import { normalizeChartPoints, pointsToPath, avatarHue } from "./chart";

describe("normalizeChartPoints (P1)", () => {
  it("N개 포인트를 X축에 균등 분포한다 (첫 점 padL, 마지막 점 width-padR)", () => {
    const pts = normalizeChartPoints([1, 2, 3, 4, 5], { width: 100, height: 50 });
    expect(pts.length).toBe(5);
    expect(pts[0][0]).toBe(0);
    expect(pts[4][0]).toBe(100);
    expect(pts[2][0]).toBe(50);
  });

  it("최대값은 top 좌표(y=0), 최소값은 bottom 좌표(y=height)로 매핑한다", () => {
    const pts = normalizeChartPoints([0, 10], { width: 100, height: 50 });
    expect(pts[0][1]).toBe(50);
    expect(pts[1][1]).toBe(0);
  });

  it("padding을 적용하면 차트 영역이 안쪽으로 줄어든다", () => {
    const pts = normalizeChartPoints([0, 10], {
      width: 100,
      height: 50,
      top: 5,
      bottom: 10,
      left: 2,
      right: 3,
    });
    expect(pts[0][0]).toBe(2);
    expect(pts[1][0]).toBe(97);
    expect(pts[1][1]).toBe(5);
    expect(pts[0][1]).toBe(40);
  });

  it("모든 값이 동일할 때 0으로 나누지 않는다 (NaN 방지)", () => {
    const pts = normalizeChartPoints([5, 5, 5], { width: 100, height: 50 });
    expect(pts.every(([, y]) => Number.isFinite(y))).toBe(true);
  });

  it("빈 배열은 빈 배열을 반환한다", () => {
    expect(normalizeChartPoints([], { width: 100, height: 50 })).toEqual([]);
  });

  it("단일 포인트는 좌측 상단(padL)에 배치된다 (divide-by-zero 방지)", () => {
    const pts = normalizeChartPoints([42], { width: 100, height: 50, left: 4 });
    expect(pts).toHaveLength(1);
    expect(pts[0][0]).toBe(4);
    expect(Number.isFinite(pts[0][1])).toBe(true);
  });
});

describe("pointsToPath (P2)", () => {
  it("첫 점은 M, 나머지는 L 로 시작한다", () => {
    const d = pointsToPath([
      [0, 10],
      [5, 15],
      [10, 20],
    ]);
    expect(d).toBe("M0.0 10.0 L5.0 15.0 L10.0 20.0");
  });

  it("소수점 한 자리로 고정한다 (SVG 출력 안정)", () => {
    const d = pointsToPath([
      [1.23456, 7.89012],
      [10.9999, 20.0001],
    ]);
    expect(d).toBe("M1.2 7.9 L11.0 20.0");
  });

  it("빈 배열은 빈 문자열", () => {
    expect(pointsToPath([])).toBe("");
  });
});

describe("avatarHue (P2)", () => {
  it("같은 티커는 항상 같은 hue를 만든다 (deterministic)", () => {
    expect(avatarHue("NVDA")).toBe(avatarHue("NVDA"));
    expect(avatarHue("AAPL")).toBe(avatarHue("AAPL"));
  });

  it("결과는 0~359 범위", () => {
    for (const t of ["A", "NVDA", "TSLA", "BRK.B", "GOOGL"]) {
      const h = avatarHue(t);
      expect(h).toBeGreaterThanOrEqual(0);
      expect(h).toBeLessThan(360);
    }
  });

  it("빈 문자열도 유효한 숫자를 반환한다", () => {
    expect(avatarHue("")).toBe(0);
  });

  it("티커 글자 순서가 hue에 반영된다", () => {
    expect(avatarHue("AB")).not.toBe(avatarHue("XY"));
  });
});
