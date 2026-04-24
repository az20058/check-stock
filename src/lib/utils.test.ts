import { describe, it, expect } from "vitest";
import { cn } from "./utils";

describe("cn (P2)", () => {
  it("문자열을 공백으로 이어 붙인다", () => {
    expect(cn("a", "b", "c")).toBe("a b c");
  });

  it("falsy 값은 무시한다", () => {
    expect(cn("a", false, null, undefined, "", "b")).toBe("a b");
  });

  it("객체 표기로 조건부 클래스를 토글한다", () => {
    expect(cn("base", { active: true, disabled: false })).toBe("base active");
  });

  it("tailwind 충돌 클래스는 나중 값이 이긴다", () => {
    expect(cn("p-2", "p-4")).toBe("p-4");
    expect(cn("text-red-500", "text-blue-500")).toBe("text-blue-500");
  });

  it("배열도 평탄화한다", () => {
    expect(cn(["a", "b"], "c")).toBe("a b c");
  });
});
