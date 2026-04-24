import { describe, it, expect } from "vitest";
import { formatPct, formatPrice, formatChange } from "./format";

describe("formatPct (P1)", () => {
  it("양수는 + 부호가 붙는다", () => {
    expect(formatPct(1.23)).toBe("+1.23%");
    expect(formatPct(10)).toBe("+10.00%");
  });

  it("음수는 - 부호만 붙고 + 는 없다", () => {
    expect(formatPct(-1.23)).toBe("-1.23%");
    expect(formatPct(-0.5)).toBe("-0.50%");
  });

  it("0은 + 부호가 붙는다 (장마감 등락 없음 표현)", () => {
    expect(formatPct(0)).toBe("+0.00%");
  });

  it("소수점 자릿수를 커스터마이즈할 수 있다", () => {
    expect(formatPct(1.25, 1)).toBe("+1.3%");
    expect(formatPct(1.5, 3)).toBe("+1.500%");
    expect(formatPct(1, 0)).toBe("+1%");
  });

  it("소수 0을 패딩한다", () => {
    expect(formatPct(1.2)).toBe("+1.20%");
    expect(formatPct(-1)).toBe("-1.00%");
  });

  it("소수점이 정확히 표시 자릿수를 초과하면 잘린다", () => {
    expect(formatPct(1.999)).toBe("+2.00%");
    expect(formatPct(-1.999)).toBe("-2.00%");
  });

  it("큰 값도 지수 표기 없이 처리한다", () => {
    expect(formatPct(1234.56)).toBe("+1234.56%");
  });
});

describe("formatPrice (P1)", () => {
  it("$ 접두어와 두 자리 소수를 붙인다", () => {
    expect(formatPrice(123.4)).toBe("$123.40");
    expect(formatPrice(0)).toBe("$0.00");
  });

  it("음수 가격은 - 가 $ 앞에 온다", () => {
    expect(formatPrice(-0.5)).toBe("$-0.50");
  });

  it("자릿수 옵션이 반영된다", () => {
    expect(formatPrice(10.2345, 4)).toBe("$10.2345");
  });
});

describe("formatChange (P1)", () => {
  it("양수 변동은 +$로 표시한다", () => {
    expect(formatChange(1.23)).toBe("+$1.23");
    expect(formatChange(0)).toBe("+$0.00");
  });

  it("음수 변동은 -$로 표시한다 (부호가 $ 앞)", () => {
    expect(formatChange(-1.23)).toBe("-$1.23");
    expect(formatChange(-0.01)).toBe("-$0.01");
  });
});
