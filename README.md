# check-stock

Next.js (App Router) 기반 미국 주식 브리핑 앱.

## Getting Started

```bash
npm install
cp .env.example .env.local   # 키 입력
npm run dev
```

http://localhost:3000

## 환경 변수

`.env.example` 참고. 필수:
- `FINNHUB_API_KEY` — 주가·뉴스
- `FRED_API_KEY` — 매크로 지표
- `ANTHROPIC_API_KEY` — Claude (요약 AI)
- `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` — 배치 결과 저장
- `CRON_SECRET` — Vercel Cron 인증
- `ADMIN_PASSWORD` — `/admin/*` Basic Auth

## 배치 파이프라인

**구조**: 하루 2회 배치가 뉴스·매크로·경제 캘린더를 수집 → Claude Haiku가 한국어 요약 생성 → Supabase에 저장. `/api/briefing` 은 저장된 스냅샷을 읽고 **주가만 Finnhub에서 실시간** 덮어씀.

### Supabase 초기화 (최초 1회)

Supabase SQL Editor에서 실행:

```sql
create table public.briefing_runs (
  id uuid primary key default gen_random_uuid(),
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  status text not null default 'running',
  triggered_by text not null,
  error text,
  raw_sources jsonb,
  briefing_data jsonb,
  token_usage jsonb
);
create index briefing_runs_started_idx on public.briefing_runs (started_at desc);
alter table public.briefing_runs enable row level security;
```

RLS 활성화 + policy 없음 → `service_role` 키만 접근 가능.

### 관리자 페이지

`/admin/briefing` — Basic Auth (user 아무 값 / password = `ADMIN_PASSWORD`).
- "지금 배치 실행" 버튼 → 수동 트리거
- 최근 실행 이력, 토큰 사용량, 에러 확인
- 최신 스냅샷(headline/summary/movers) 미리보기

### Vercel Cron

`vercel.json`에 등록됨:
- `30 11 * * *` (UTC) = **KST 20:30**
- `30 23 * * *` (UTC) = **KST 08:30** (다음날)

배포 후 Vercel 대시보드 **Settings → Environment Variables**에 위 env 전부 추가 필요. 추가 후 Vercel Cron이 자동으로 `/api/cron/briefing`을 Bearer 토큰과 함께 호출.

## 테스트

```bash
npm run test           # vitest (유틸 단위 테스트)
npx eslint             # lint
npx tsc --noEmit       # typecheck
```

## 아키텍처 요약

```
src/lib/
  clients/       — Finnhub, FRED, Anthropic, Supabase SDK 래퍼
  collectors/    — 뉴스·매크로·캘린더 수집기 (Finnhub/FRED 직접 호출)
  ai/            — 프롬프트, Claude 호출 파이프라인
  briefing/      — 배치 플로우(build), 저장(storage), 스키마(zod)

src/app/api/
  briefing/              — 프론트용 엔드포인트. Supabase 읽기 + 주가 실시간 오버레이
  cron/briefing/         — Vercel Cron 진입점 (CRON_SECRET 인증)
  admin/briefing/        — 수동 트리거, 히스토리 조회

src/app/admin/briefing/  — 관리자 대시보드
src/proxy.ts             — /admin/*·/api/admin/* Basic Auth (Next 16 proxy convention)
```
