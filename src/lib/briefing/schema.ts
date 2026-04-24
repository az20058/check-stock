import { z } from "zod";

export const marketSummarySchema = z.object({
  headline: z.string().min(1),
  headlineAccent: z.string().min(1),
  date: z.string().min(1),
  summary: z.object({
    title: z.string().min(1),
    body: z.string().min(1),
    sub: z.string().min(1),
    tags: z.array(z.string()).min(1).max(4),
  }),
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
    date: { type: "string", description: "오늘 날짜·시장 상태. 예: '4월 24일 금요일 · 장마감 04:00 ET'" },
    summary: {
      type: "object",
      properties: {
        title: { type: "string" },
        body: { type: "string", description: "핵심 한 문장 (50~80자)" },
        sub: { type: "string", description: "보조 설명 1~2문장" },
        tags: {
          type: "array",
          items: { type: "string", description: "# 접두사 포함 해시태그" },
          minItems: 1,
          maxItems: 4,
        },
      },
      required: ["title", "body", "sub", "tags"],
    },
  },
  required: ["headline", "headlineAccent", "date", "summary"],
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
