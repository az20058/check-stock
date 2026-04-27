import { z } from "zod";

export const marketSummarySchema = z.object({
  headline: z.string().min(1),
  headlineAccent: z.string().default(""),
  dateLabel: z.string().min(1),
  summary: z.object({
    title: z.string().min(1),
    body: z.string().min(1),
    sub: z.string().min(1),
    longBody: z.string().min(1),
    koreanContext: z.string().min(1),
    tags: z.array(z.string()).min(1).max(4),
  }),
  causes: z.array(z.object({
    rank: z.number().int().min(1).max(3),
    title: z.string().min(1),
    desc: z.string().min(1),
    tags: z.array(z.string()).max(3),
  })).max(3).default([]),
});
export type MarketSummary = z.infer<typeof marketSummarySchema>;

export const moverReasonSchema = z.object({
  reason: z.string().min(1),
});
export type MoverReason = z.infer<typeof moverReasonSchema>;

export const eventsSchema = z.object({
  events: z
    .array(
      z.object({
        time: z.string(),
        title: z.string(),
        desc: z.string(),
        tag: z.string(),
        important: z.boolean(),
      }),
    )
    .max(6),
});
export type EventsOutput = z.infer<typeof eventsSchema>;

export const marketSummaryJsonSchema = {
  type: "object",
  properties: {
    headline: { type: "string", description: "브리핑 전체 제목의 꼬리말. 예: '이유를 정리했어요'" },
    headlineAccent: { type: "string", description: "제목의 강조 부분. 예: '나스닥이 흔들린'" },
    dateLabel: { type: "string", description: "오늘 날짜·시장 상태. 예: '4월 24일 금요일 · 장마감 04:00 ET' 또는 '4월 24일 금요일 · 장마감 15:30 KST'" },
    summary: {
      type: "object",
      properties: {
        title: { type: "string" },
        body: { type: "string", description: "핵심 한 문장 (50~80자) — 메인 카드용 강조 lead" },
        sub: { type: "string", description: "보조 설명 1~2문장 (메인 카드 본문)" },
        longBody: {
          type: "string",
          description:
            "상세 페이지용 풀 요약 — 정확히 3문단, 단락 사이는 \\n\\n으로 구분. 각 문단 80~140자. 1) 핵심 사건과 지수/주요 종목 변동, 2) 원인 분석과 섹터 반응, 3) 한국 투자자가 볼 시사점.",
        },
        koreanContext: {
          type: "string",
          description:
            "'한국 투자자 시각' 박스에 들어갈 60~120자 — 미국 장 → 국내 영향 가교, 또는 한국 시장 → 글로벌 맥락. 1~2문장.",
        },
        tags: {
          type: "array",
          items: { type: "string", description: "# 접두사 포함 해시태그" },
          minItems: 1,
          maxItems: 4,
        },
      },
      required: ["title", "body", "sub", "longBody", "koreanContext", "tags"],
    },
    causes: {
      type: "array",
      description: "오늘 시장을 움직인 TOP 3 원인",
      items: {
        type: "object",
        properties: {
          rank: { type: "number", description: "1~3" },
          title: { type: "string", description: "원인 제목 (15~25자)" },
          desc: { type: "string", description: "원인 설명 (30~60자)" },
          tags: {
            type: "array",
            items: { type: "string", description: "# 접두사 포함 해시태그" },
            maxItems: 3,
          },
        },
        required: ["rank", "title", "desc", "tags"],
      },
      minItems: 3,
      maxItems: 3,
    },
  },
  required: ["headline", "headlineAccent", "dateLabel", "summary", "causes"],
} as const;

export const moverReasonJsonSchema = {
  type: "object",
  properties: {
    reason: {
      type: "string",
      description: "종목 움직임의 핵심 이유. 한국어 10~20자. 예: 'AI 수요 둔화 우려'",
    },
  },
  required: ["reason"],
} as const;

export const eventsJsonSchema = {
  type: "object",
  properties: {
    events: {
      type: "array",
      items: {
        type: "object",
        properties: {
          time: { type: "string", description: "KST 표기. 예: 'KST 21:30'" },
          title: { type: "string", description: "이벤트 이름 (한국어)" },
          desc: { type: "string", description: "맥락 설명 (한국어, 30자 내외)" },
          tag: { type: "string", description: "'중요' 또는 '이벤트'" },
          important: { type: "boolean" },
        },
        required: ["time", "title", "desc", "tag", "important"],
      },
      maxItems: 6,
    },
  },
  required: ["events"],
} as const;
