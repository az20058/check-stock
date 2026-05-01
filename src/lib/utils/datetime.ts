/**
 * KST wall-clock 시각을 ISO 8601 형식 문자열로 반환 (offset 없음).
 * 예: "2026-05-01T06:00:32.149"
 *
 * DB 컬럼이 `timestamp`(no TZ)로 KST wall-clock을 저장하는 정책에 맞춰 사용.
 */
export function nowKstIso(): string {
  return toKstIso(new Date());
}

/** 임의 Date 인스턴트를 KST wall-clock ISO(offset 없음)로 변환. */
export function toKstIso(d: Date): string {
  const kstMs = d.getTime() + 9 * 60 * 60 * 1000;
  return new Date(kstMs).toISOString().replace(/Z$/, "");
}

/**
 * KST wall-clock 문자열을 정확한 Date 인스턴트로 변환.
 * DB에서 읽어온 offset 없는 ISO를 서버에서 파싱할 때 사용.
 * 이미 offset이 있는 문자열이면 그대로 Date로.
 */
export function kstToInstant(s: string): Date {
  // 끝에 Z 또는 ±HH:MM offset이 있는지 검사
  if (/Z$|[+-]\d{2}:?\d{2}$/.test(s)) return new Date(s);
  return new Date(`${s}+09:00`);
}
