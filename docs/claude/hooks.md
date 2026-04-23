# Hook 사용 규칙

- **`useEffect`는 최후의 수단** — `useEffect`를 쓰기 전에 파생 상태, 이벤트 핸들러, 서버사이드 데이터 페칭으로 같은 목표를 달성할 수 있는지 먼저 고민한다. `useEffect`는 진짜 외부 시스템과 동기화할 때만 사용한다 (DOM API, `localStorage` 같은 브라우저 전용 전역, 서드파티 구독).

- **`useEffect` + `setState`가 불가피한 경우** (예: SSR 안전을 위해 마운트 시 `localStorage` 읽기) — `// eslint-disable-next-line react-hooks/set-state-in-effect`와 이유를 설명하는 주석을 함께 추가한다.
