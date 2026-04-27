# check-stock

Next.js (App Router) 기반 미국·한국 주식 브리핑 PWA. 하루 2~3회 배치가 시장 요약을 만들어두면, 사용자는 모바일에서 빠르게 확인한다.

## Getting Started

```bash
npm install
cp .env.example .env.local   # 키 입력
npm run dev
```

http://localhost:3000

## 주요 화면

| 경로 | 설명 |
|---|---|
| `/` | 미국·한국 시장 브리핑 (헤드라인, 무버스, 매크로, 이벤트, 원인 TOP3) |
| `/watchlist` | 로컬 저장 관심 종목 — 시세는 Finnhub 폴링 |
| `/search` | 종목 검색 — 일반 주식 + ETF/레버리지(TSLL 등) 포함 |
| `/report/[ticker]` | 종목 상세 — Claude 요약, 등락 원인 TOP3, 섹터 비교, 차트 |
| `/admin/briefing` | 배치 수동 트리거·이력 (Basic Auth) |

## 환경 변수

`.env.example` 참고. 필수:
- `FINNHUB_API_KEY` — 주가·뉴스·종목 검색
- `FRED_API_KEY` — 매크로 지표(10Y, DXY, WTI)
- `ANTHROPIC_API_KEY` — Claude (요약·원인 분석)
- `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` — 배치 결과 저장
- `CRON_SECRET` — Vercel Cron 인증
- `ADMIN_PASSWORD` — `/admin/*` Basic Auth

## 배치 파이프라인

**구조**: cron이 세션별로 뉴스·매크로·캘린더를 수집 → Claude가 한국어 요약·무버스·원인 생성 → Supabase에 스냅샷 저장. `/api/briefing`은 저장된 스냅샷을 읽어 응답하며 **5분 ISR**로 캐시(실시간 시세 오버레이 없음 — 데이터는 배치 시점 기준).

### 세션 구분

| 세션 | 트리거 | 용도 |
|---|---|---|
| `us_pre` | KST 20:00 (UTC 11:00) | 미국 프리마켓 직전 — 오늘 밤 주목 포인트 |
| `us_close` | KST 06:00 (UTC 21:00 전날) | 미국 장 마감 후 — 어제 밤 결과 요약 |
| `kr_close` | KST 18:00 (UTC 09:00) | 한국 장 마감 후 — 오늘 한국 시장 요약 |

**주말 스킵**: 토요일 06:00 KST 배치 이후부터 월요일 06:00 KST 배치까지(포함) cron 호출이 자동 스킵된다. 동결 해제 후 첫 배치는 월요일 18:00 KST kr_close.

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
- "지금 배치 실행" 버튼 → 수동 트리거 (세션 선택)
- 최근 실행 이력, 토큰 사용량, 에러 확인
- 최신 스냅샷(headline/summary/movers) 미리보기

### Vercel 배포

`vercel.json`에 cron 등록됨. 배포 후 Vercel 대시보드 **Settings → Environment Variables**에 위 env 전부 추가 필요. 추가 후 Vercel Cron이 자동으로 `/api/cron/briefing?session=...`을 Bearer 토큰과 함께 호출.

## PWA

- `public/manifest.json` + `public/sw.js` (오프라인 셸 캐시)
- iOS Safe Area 대응 (`env(safe-area-inset-*)`)
- 탭바 fixed + body `overflow:hidden`으로 pull-to-refresh 간섭 제거
- 홈 화면 추가 시 standalone 모드로 동작

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
  report/        — 종목 상세 리포트 생성 (Claude 분석 + Finnhub 데이터)
  data/          — 종목 메타데이터 (티커→이름·섹터·거래소)

src/app/api/
  briefing/              — 프론트용 엔드포인트 (Supabase 읽기, 5분 ISR)
  cron/briefing/         — Vercel Cron 진입점 (CRON_SECRET, 주말 스킵)
  admin/briefing/        — 수동 트리거, 히스토리 조회
  stocks/[ticker]/report — 종목 상세 리포트 생성
  stocks/quotes          — 시세 폴링용 일괄 조회
  stocks/search          — 종목 검색 (Finnhub symbol search)

src/app/                 — /, /watchlist, /search, /report/[ticker], /admin/briefing, /offline
src/components/          — TabBar, PriceChart, Sparkline, Avatar, Pct, ServiceWorkerRegister
src/middleware.ts        — /admin/*·/api/admin/* Basic Auth
```
