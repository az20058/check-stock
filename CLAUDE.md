# CLAUDE.md

## 프로젝트

Next.js (App Router) 기반 취업 준비 관리 앱. UI는 shadcn/ui + Tailwind CSS.

## 필수 규칙 (항상 적용)

1. **코드 수정 후 반드시 실행**: `npx eslint <수정 파일>` → `npx tsc --noEmit` → 직접 코드 리뷰 → 문제 발견 시 보고
   - 코드 리뷰 시 **사이드 이펙트 필수 확인**: 수정한 함수·값·타입을 사용하는 모든 호출부를 `grep`으로 찾아 의도치 않은 동작 변경이 없는지 검토
2. **컴포넌트 중복 금지**: UI 작성 전 `components/ui/`와 해당 페이지 `_components/`를 먼저 확인하고 재사용
3. **UI 변경 시 Playwright 검증 필수**: UI를 수정한 경우 커밋 전에 반드시 Playwright로 브라우저를 열어 변경된 화면을 스크린샷으로 확인한다
   - dev server가 실행 중이 아니면 `npm run dev`를 background로 먼저 실행
   - `npx playwright screenshot` 또는 스크립트로 해당 페이지 스크린샷 촬영 → Read 툴로 이미지 확인
   - 레이아웃 깨짐·의도치 않은 변경 없으면 다음 단계 진행
4. **커밋/푸시**: lint·tsc·리뷰·UI 검증 통과 후 확인 없이 `git add && git commit && git push origin master` 한 번에 실행

## 에이전트 팀 구성 (필요 시 복붙)

대형 기능 구현·병렬 작업이 필요할 때만 사용. 토큰 비용이 높으므로 일반 작업은 단일 세션 권장.

**사전 조건**: `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` 활성화 필요 (settings.json)

```
Create an agent team with 4 teammates. Start npm run dev in the background first if not running.

1. code-reviewer: Review code quality, SOLID principles, security vulnerabilities, and side effects. Use grep to find all callers of modified functions. Run npx eslint and npx tsc --noEmit. Report issues with severity ratings.

2. frontend: Implement UI using Next.js App Router, shadcn/ui, Tailwind CSS. Check components/ui/ and _components/ before creating new ones. Follow docs/claude/components.md and docs/claude/hooks.md.

3. backend: Handle API routes, middleware, server-side logic. Follow docs/claude/nextjs.md and docs/claude/state.md conventions.

4. qa-tester: Verify UI with Playwright. Take screenshots with npx playwright screenshot, read images to confirm layout. Run npx playwright test for e2e. Report any visual regressions.

Require plan approval before any teammate makes changes. Each teammate owns separate files to avoid conflicts.
```

---

## 상황별 참조 문서

코드 작성 전, 해당되는 문서를 읽고 따른다:

| 해당 조건 | 읽을 파일 |
|-----------|-----------|
| Next.js API·라우팅·미들웨어를 수정할 때 | `docs/claude/nextjs.md` |
| `components/ui/` 파일을 수정하거나 새 컴포넌트를 만들 때 | `docs/claude/components.md` |
| `useEffect`, `useState`, 커스텀 훅을 작성할 때 | `docs/claude/hooks.md` |
| props를 3단계 이상 전달하거나 zustand 스토어를 다룰 때 | `docs/claude/state.md` |
| 새 기능을 구현할 때 (버그 수정 제외) | `docs/claude/testing.md` |
