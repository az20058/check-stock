# Check-Stock 초기 UI 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 디자인 핸드오프의 3개 화면(브리핑 피드, 종목 상세 리포트, 관심종목 대시보드)을 Next.js App Router로 pixel-perfect 구현

**Architecture:** 미드나잇 다크 테마를 CSS 커스텀 프로퍼티로 globals.css에 정의. shadcn/ui Card·Badge·Tabs·Progress를 기반으로 커스텀 테마 적용. 차트(Sparkline/PriceChart)·TabBar·StatusBar·Avatar 등은 커스텀 컴포넌트. 3개 페이지를 App Router로 라우팅하고 하단 탭바로 네비게이션.

**Tech Stack:** Next.js 16 (App Router), React 19, Tailwind CSS v4, shadcn/ui, TypeScript

---

## 파일 구조

```
src/
├── app/
│   ├── globals.css                  # 미드나잇 다크 테마 CSS 변수
│   ├── layout.tsx                   # 폰트 변경 (Pretendard + JetBrains Mono)
│   ├── page.tsx                     # 브리핑 피드 (홈)
│   ├── report/page.tsx              # 종목 상세 리포트
│   └── watchlist/page.tsx           # 관심종목 대시보드
├── components/
│   ├── ui/                          # shadcn 컴포넌트 (card, badge, tabs, progress)
│   ├── StatusBar.tsx                # iOS 스타일 상태바
│   ├── TabBar.tsx                   # 하단 탭 네비게이션
│   ├── Sparkline.tsx                # 미니 스파크라인 SVG
│   ├── PriceChart.tsx               # 가격 차트 SVG
│   ├── Avatar.tsx                   # 티커 기반 컬러 아바타
│   └── Pct.tsx                      # 등락률 컬러 텍스트
├── lib/
│   └── utils.ts                     # shadcn cn() 유틸
└── mocks/
    └── handlers.ts                  # MSW 핸들러 (향후 API 목업)
```

---

### Task 1: 디자인 시스템 — globals.css + 폰트 + shadcn 초기화

**Files:**
- Modify: `src/app/globals.css`
- Modify: `src/app/layout.tsx`
- Create: `src/lib/utils.ts`

- [ ] **Step 1: shadcn/ui 초기화**

```bash
npx shadcn@latest init
```

설정:
- Style: New York
- Base color: Slate
- CSS variables: yes

- [ ] **Step 2: globals.css를 미드나잇 다크 테마로 교체**

```css
@import "tailwindcss";

@custom-variant dark (&:is(.dark *));

:root {
  --bg-0: #0A0C12;
  --bg-1: #0F1218;
  --bg-2: #151922;
  --bg-3: #1C2230;
  --bg-4: #242B3A;

  --line: rgba(255,255,255,0.06);
  --line-strong: rgba(255,255,255,0.10);

  --text-0: #F2F4F9;
  --text-1: #B8BECE;
  --text-2: #7A8297;
  --text-3: #525A6E;

  --accent: #3B82F6;
  --accent-soft: rgba(59,130,246,0.14);
  --accent-ring: rgba(59,130,246,0.28);

  --up: #FF5466;
  --up-soft: rgba(255,84,102,0.14);
  --down: #3B82F6;
  --down-soft: rgba(59,130,246,0.14);

  --warn: #F5A524;
  --warn-soft: rgba(245,165,36,0.14);

  --radius-s: 10px;
  --radius-m: 14px;
  --radius-l: 20px;
  --radius-xl: 28px;

  --font-mono: 'JetBrains Mono', ui-monospace, 'SF Mono', monospace;
  --font-sans: 'Pretendard', -apple-system, system-ui, sans-serif;
}
```

- [ ] **Step 3: layout.tsx 폰트를 Pretendard + JetBrains Mono로 변경**

Google Fonts에서 Pretendard는 없으므로 CDN link 사용, JetBrains Mono는 next/font/google 사용.

```tsx
import { JetBrains_Mono } from "next/font/google";

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});
```

head에 Pretendard CDN 추가:
```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/variable/pretendardvariable-dynamic-subset.css" />
```

- [ ] **Step 4: shadcn Card, Badge, Tabs, Progress 컴포넌트 추가**

```bash
npx shadcn@latest add card badge tabs progress
```

- [ ] **Step 5: lint + tsc 확인**

```bash
npx eslint src/app/globals.css src/app/layout.tsx src/lib/utils.ts
npx tsc --noEmit
```

- [ ] **Step 6: 커밋**

```bash
git add src/app/globals.css src/app/layout.tsx src/lib/ src/components/ui/ components.json tailwind.config.* postcss.config.*
git commit -m "feat: 미드나잇 다크 디자인 시스템 + shadcn 초기화"
```

---

### Task 2: 공유 컴포넌트 — StatusBar, TabBar, Avatar, Pct, Sparkline, PriceChart

**Files:**
- Create: `src/components/StatusBar.tsx`
- Create: `src/components/TabBar.tsx`
- Create: `src/components/Avatar.tsx`
- Create: `src/components/Pct.tsx`
- Create: `src/components/Sparkline.tsx`
- Create: `src/components/PriceChart.tsx`

- [ ] **Step 1: StatusBar 구현**

iOS 스타일 상태바 — 시간 + 시그널/와이파이/배터리 아이콘. 디자인의 `.status-bar` 매칭.

```tsx
// src/components/StatusBar.tsx
"use client";

export default function StatusBar({ time = "9:41" }: { time?: string }) {
  return (
    <div className="absolute top-0 left-0 right-0 h-[54px] flex items-center justify-between px-6 pt-[18px] z-10 pointer-events-none text-[--text-0]">
      <div className="font-semibold text-[15px]">{time}</div>
      <div className="flex gap-1.5 items-center">
        {/* signal, wifi, battery SVGs */}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: TabBar 구현**

하단 탭바 — 브리핑/관심/검색/내정보. `active` prop으로 현재 탭 하이라이트. Link로 라우팅.

- [ ] **Step 3: Avatar 구현**

티커 문자열 해시 → oklch 컬러 생성. 디자인의 `.avatar` 매칭.

- [ ] **Step 4: Pct 구현**

등락률 숫자. v > 0이면 `--up` 컬러, v < 0이면 `--down` 컬러.

- [ ] **Step 5: Sparkline 구현**

미니 SVG 스파크라인. data 배열 → polyline + area fill.

- [ ] **Step 6: PriceChart 구현**

큰 가격 차트 SVG. gridline + gradient area + end dot.

- [ ] **Step 7: lint + tsc 확인 후 커밋**

```bash
npx eslint src/components/StatusBar.tsx src/components/TabBar.tsx src/components/Avatar.tsx src/components/Pct.tsx src/components/Sparkline.tsx src/components/PriceChart.tsx
npx tsc --noEmit
git add src/components/
git commit -m "feat: 공유 컴포넌트 (StatusBar, TabBar, Avatar, Sparkline 등)"
```

---

### Task 3: 홈 — 일일 브리핑 피드 (`/`)

**Files:**
- Modify: `src/app/page.tsx`

- [ ] **Step 1: page.tsx를 BriefingFeed로 교체**

디자인 구성:
1. StatusBar (8:30)
2. hero-greet: 날짜 + "나스닥이 흔들린 이유를 정리했어요"
3. idx-row: S&P 500, NASDAQ, DOW, VIX 가로 스크롤 칩
4. tldr: 오늘의 시장 요약 카드 (accent border gradient)
5. 내 관심 종목 변동: NVDA, TSLA, AAPL, MSFT — Avatar + Sparkline + 등락률
6. 매크로 지표: 2×2 그리드 (10Y, VIX, DXY, WTI)
7. 오늘 주목 포인트: PCE 발표, MSFT·GOOGL 실적
8. disclaimer 푸터
9. TabBar (active: home)

정적 데이터 인라인.

- [ ] **Step 2: lint + tsc 확인**
- [ ] **Step 3: Playwright 스크린샷 검증**
- [ ] **Step 4: 커밋**

```bash
git add src/app/page.tsx
git commit -m "feat: 일일 브리핑 피드 홈 화면"
```

---

### Task 4: 종목 상세 리포트 (`/report`)

**Files:**
- Create: `src/app/report/page.tsx`

- [ ] **Step 1: NVDA 리포트 화면 구현**

디자인 구성:
1. StatusBar (9:02)
2. 상단바: 뒤로가기 + NVDA 티커 + 즐겨찾기 별
3. Hero: Avatar(lg) + 엔비디아 + $412.73 (px-big) + −4.82% (pct-big)
4. PriceChart (card 안에, 세그먼트 1D/1W/1M/3M/1Y/ALL)
5. AI 한 줄 요약 (tldr 스타일)
6. 하락 원인 TOP 3: rank badge + 설명 + 태그 칩
7. 섹터 대비: NVDA vs SOXX vs NASDAQ vs S&P — Progress bar
8. 관련 뉴스: 4건 (thumb + src + title + time)
9. 매크로 맥락: 2×2 그리드
10. disclaimer
11. TabBar (active: watch)

- [ ] **Step 2: lint + tsc 확인**
- [ ] **Step 3: Playwright 스크린샷 검증**
- [ ] **Step 4: 커밋**

```bash
git add src/app/report/
git commit -m "feat: 종목 상세 리포트 화면 (NVDA)"
```

---

### Task 5: 관심종목 대시보드 (`/watchlist`)

**Files:**
- Create: `src/app/watchlist/page.tsx`

- [ ] **Step 1: Watchlist 화면 구현**

디자인 구성:
1. StatusBar (9:14)
2. 헤더: "WATCHLIST" cap + "관심종목" display + 추가 버튼
3. 포트폴리오 요약 카드: −0.92% + 상승/하락 stacked bar + 카운트
4. 히트맵: 4열 그리드, 10종목, 등락률 기반 빨강/파랑 강도
5. 정렬 pill: 변동률순(active) / 이름순 / 이벤트
6. 종목 리스트: Avatar + 티커 + 이름 + Sparkline + 가격 + 등락률
7. 가장 많이 언급된: NVDA(24건) / TSLA(18건) / MSFT(11건)
8. disclaimer
9. TabBar (active: watch)

- [ ] **Step 2: lint + tsc 확인**
- [ ] **Step 3: Playwright 스크린샷 검증**
- [ ] **Step 4: 커밋**

```bash
git add src/app/watchlist/
git commit -m "feat: 관심종목 대시보드 화면"
```

---

### Task 6: 최종 검증 + 푸시

- [ ] **Step 1: 전체 빌드 확인**

```bash
npm run build
```

- [ ] **Step 2: 3개 화면 Playwright 스크린샷 일괄 검증**
- [ ] **Step 3: 푸시**

```bash
git push origin main
```
