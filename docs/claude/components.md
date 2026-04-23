# 컴포넌트 재사용 규칙

UI 기능을 구현하기 전에:

1. **`components/ui/` 먼저 확인** — 사용 가능한 컴포넌트를 읽고 적용 가능하면 재사용한다. 이미 있는 것을 다시 만들지 마라 (Button, Card, Badge, Select, Input 등).

2. **페이지 로컬 컴포넌트 재사용** — `app/` 하위 페이지 작업 시, 해당 페이지 디렉토리의 컴포넌트(예: `app/quiz/_components/`, `app/(tabs)/applications/_components/`)를 먼저 확인하고 적합한 것을 재사용한다. 중복 마크업을 작성하지 마라.

3. **공유 UI 컴포넌트화** — 여러 페이지에서 재사용될 가능성이 있는 UI는 `components/ui/`(전역) 또는 해당 페이지의 `_components/`(로컬)에 컴포넌트로 추출한다. 반복 마크업을 인라인으로 방치하지 마라.

4. **로딩 상태** — 데이터 페칭 작업(API 호출, `useQuery`, 서버 액션 등)이 있으면 항상 `<FlameLoading />`(`components/ui/flame-loading.tsx`)으로 로딩 상태를 표시한다. 전체 화면 로딩엔 `fullscreen` prop을, 레이아웃 내 부분 로딩엔 기본(인라인) 변형을 사용한다.
