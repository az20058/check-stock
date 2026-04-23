import StatusBar from "@/components/StatusBar";
import TabBar from "@/components/TabBar";
import Avatar from "@/components/Avatar";
import Sparkline from "@/components/Sparkline";

// Fixed sparkline data (SSR-safe, no Math.random)
const sparkData = {
  NVDA: [440, 438, 442, 436, 431, 428, 432, 425, 420, 418, 422, 415, 410, 412],
  TSLA: [180, 178, 176, 174, 177, 175, 172, 170, 169, 171, 168, 166, 167, 168],
  AAPL: [184, 185, 184, 186, 185, 187, 186, 185, 186, 187, 186, 186, 187, 187],
  MSFT: [408, 406, 405, 404, 406, 405, 403, 404, 403, 402, 403, 402, 402, 402],
};

const indices = [
  { label: "S&P 500", value: "5,284.19", change: "−0.42%", up: false },
  { label: "NASDAQ", value: "16,432.88", change: "−1.18%", up: false },
  { label: "DOW", value: "39,872.03", change: "−0.21%", up: false },
  { label: "VIX", value: "18.24", change: "+6.10%", up: true },
];

const movers = [
  {
    ticker: "NVDA",
    name: "NVIDIA",
    reason: "AI 수요 둔화 우려",
    pct: "-4.82%",
    price: "$412.73",
    up: false,
    data: sparkData.NVDA,
  },
  {
    ticker: "TSLA",
    name: "Tesla",
    reason: "Q1 인도량 하회",
    pct: "-3.21%",
    price: "$168.29",
    up: false,
    data: sparkData.TSLA,
  },
  {
    ticker: "AAPL",
    name: "Apple",
    reason: "서비스 매출 기대",
    pct: "+0.42%",
    price: "$186.55",
    up: true,
    data: sparkData.AAPL,
  },
  {
    ticker: "MSFT",
    name: "Microsoft",
    reason: "금리 민감도",
    pct: "-0.88%",
    price: "$402.11",
    up: false,
    data: sparkData.MSFT,
  },
];

const macros = [
  { label: "10Y Treasury", value: "4.55%", delta: "+5bp", up: true },
  { label: "VIX", value: "18.24", delta: "+1.05", up: true },
  { label: "DXY (달러)", value: "106.18", delta: "+0.32%", up: true },
  { label: "WTI 원유", value: "$82.41", delta: "−0.74%", up: false },
];

const events = [
  {
    time: "KST 21:30",
    title: "미국 3월 PCE 물가지수 발표",
    desc: "예상 2.6% YoY · 연준 선호 지표",
    chip: "중요",
    chipAccent: true,
  },
  {
    time: "KST 06:00",
    title: "MSFT · GOOGL 실적 발표",
    desc: "애프터마켓 · 가이던스 주목",
    chip: "이벤트",
    chipAccent: false,
  },
];

export default function Home() {
  return (
    <div
      className="relative h-dvh overflow-hidden"
      style={{ background: "var(--bg-1)" }}
    >
      <StatusBar time="8:30" />

      {/* Scrollable content */}
      <div className="overflow-y-auto h-full pt-[54px] pb-[96px]">

        {/* Hero greeting */}
        <div style={{ padding: "14px 20px 6px" }}>
          <p
            className="text-xs font-medium"
            style={{ color: "var(--text-2)" }}
          >
            4월 24일 금요일 · 장마감 04:00 ET
          </p>
          <h1
            className="text-[26px] font-extrabold tracking-tight leading-tight mt-1"
            style={{ color: "var(--text-0)" }}
          >
            어제{" "}
            <span style={{ color: "var(--accent)" }}>나스닥이 흔들린</span>
            <br />
            이유를 정리했어요
          </h1>
        </div>

        {/* Index ticker row */}
        <div className="flex gap-2 overflow-x-auto px-5 py-2 scrollbar-none" style={{ scrollbarWidth: "none" }}>
          {indices.map((idx) => (
            <div
              key={idx.label}
              className="min-w-[118px] shrink-0 rounded-[14px] border"
              style={{
                padding: "10px 12px",
                background: "var(--bg-2)",
                borderColor: "var(--line)",
              }}
            >
              <div
                className="text-[11px] font-semibold"
                style={{ color: "var(--text-2)" }}
              >
                {idx.label}
              </div>
              <div
                className="font-mono text-sm font-semibold mt-0.5"
                style={{ color: "var(--text-0)" }}
              >
                {idx.value}
              </div>
              <div
                className="font-mono text-[11px] mt-0.5"
                style={{ color: idx.up ? "var(--up)" : "var(--down)" }}
              >
                {idx.change}
              </div>
            </div>
          ))}
        </div>

        {/* Market TL;DR card */}
        <div style={{ padding: "14px 16px 12px" }}>
          <div
            className="rounded-[20px] border"
            style={{
              background:
                "linear-gradient(180deg, rgba(59,130,246,0.08) 0%, rgba(59,130,246,0) 100%)",
              borderColor: "var(--accent-ring)",
              padding: "18px",
            }}
          >
            {/* Header dot + label */}
            <div className="flex items-center gap-2 mb-3">
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ background: "var(--accent)" }}
              />
              <span
                className="text-[11px] font-semibold uppercase tracking-widest"
                style={{ color: "var(--accent)" }}
              >
                오늘의 시장 요약
              </span>
            </div>

            {/* Main text */}
            <p
              className="text-[17px] font-bold leading-relaxed"
              style={{ color: "var(--text-0)" }}
            >
              10년물 금리가 4.55%로 재상승하면서 고밸류 성장주 중심으로
              차익실현 매물이 쏟아졌습니다.
            </p>

            {/* Sub text */}
            <p
              className="text-[13px] mt-2"
              style={{ color: "var(--text-1)" }}
            >
              엔비디아 어닝 가이던스 우려까지 겹쳐 반도체 섹터가 2.3%
              하락. 방어주 성격의 유틸리티·헬스케어는 상대적으로
              선방했어요.
            </p>

            {/* Tags */}
            <div className="flex gap-1.5 flex-wrap mt-3">
              {["#금리", "#반도체", "#엔비디아"].map((tag) => (
                <span
                  key={tag}
                  className="text-xs rounded-full border h-6 flex items-center px-2.5"
                  style={{
                    background: "var(--bg-3)",
                    color: "var(--text-1)",
                    borderColor: "var(--line)",
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* 내 관심 종목 변동 section */}
        <div className="px-4 mt-1">
          {/* Section header */}
          <div className="flex items-center justify-between mb-2 px-1">
            <h2
              className="text-lg font-bold"
              style={{ color: "var(--text-0)" }}
            >
              내 관심 종목 변동
            </h2>
            <span
              className="text-xs"
              style={{ color: "var(--text-2)" }}
            >
              전체보기
            </span>
          </div>

          {/* Mover items */}
          <div className="flex flex-col gap-2">
            {movers.map((m) => (
              <div
                key={m.ticker}
                className="flex items-center gap-3 rounded-[14px] border"
                style={{
                  padding: "12px 14px",
                  background: "var(--bg-2)",
                  borderColor: "var(--line)",
                }}
              >
                <Avatar ticker={m.ticker} />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span
                      className="font-mono text-sm font-semibold"
                      style={{ color: "var(--text-0)" }}
                    >
                      {m.ticker}
                    </span>
                    <span
                      className="text-[11px]"
                      style={{ color: "var(--text-2)" }}
                    >
                      {m.name}
                    </span>
                  </div>
                  <div
                    className="text-[11px] mt-0.5 truncate"
                    style={{ color: "var(--text-3)" }}
                  >
                    {m.reason}
                  </div>
                </div>

                <Sparkline data={m.data} up={m.up} width={52} height={22} />

                <div className="text-right shrink-0">
                  <div
                    className="font-mono text-sm font-semibold"
                    style={{ color: m.up ? "var(--up)" : "var(--down)" }}
                  >
                    {m.pct}
                  </div>
                  <div
                    className="font-mono text-[11px]"
                    style={{ color: "var(--text-2)" }}
                  >
                    {m.price}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 매크로 지표 section */}
        <div className="px-4 mt-4">
          <div className="flex items-center justify-between mb-2 px-1">
            <h2
              className="text-lg font-bold"
              style={{ color: "var(--text-0)" }}
            >
              매크로 지표
            </h2>
            <span
              className="text-xs"
              style={{ color: "var(--text-2)" }}
            >
              어제 기준
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {macros.map((m) => (
              <div
                key={m.label}
                className="rounded-xl border p-3"
                style={{
                  background: "var(--bg-2)",
                  borderColor: "var(--line)",
                }}
              >
                <div
                  className="text-[10px] uppercase tracking-widest font-semibold"
                  style={{ color: "var(--text-3)" }}
                >
                  {m.label}
                </div>
                <div
                  className="font-mono text-base font-semibold mt-1"
                  style={{ color: "var(--text-0)" }}
                >
                  {m.value}
                </div>
                <div
                  className="font-mono text-[11px] mt-0.5"
                  style={{ color: m.up ? "var(--up)" : "var(--down)" }}
                >
                  {m.delta}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 오늘 주목 포인트 section */}
        <div className="px-4 mt-4">
          <div className="flex items-center justify-between mb-2 px-1">
            <h2
              className="text-lg font-bold"
              style={{ color: "var(--text-0)" }}
            >
              오늘 주목 포인트
            </h2>
          </div>

          <div className="flex flex-col gap-2">
            {events.map((ev) => (
              <div
                key={ev.title}
                className="rounded-[14px] border"
                style={{
                  padding: "14px",
                  background: "var(--bg-2)",
                  borderColor: "var(--line)",
                }}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span
                    className="font-mono text-[11px] font-semibold"
                    style={{ color: "var(--text-2)" }}
                  >
                    {ev.time}
                  </span>
                  <span
                    className="text-[11px] font-semibold rounded-full px-2 h-5 flex items-center"
                    style={{
                      background: ev.chipAccent
                        ? "var(--accent-soft)"
                        : "var(--bg-3)",
                      color: ev.chipAccent ? "var(--accent)" : "var(--text-1)",
                      border: "1px solid",
                      borderColor: ev.chipAccent
                        ? "var(--accent-ring)"
                        : "var(--line)",
                    }}
                  >
                    {ev.chip}
                  </span>
                </div>
                <p
                  className="text-[15px] font-bold"
                  style={{ color: "var(--text-0)" }}
                >
                  {ev.title}
                </p>
                <p
                  className="text-[12px] mt-0.5"
                  style={{ color: "var(--text-2)" }}
                >
                  {ev.desc}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Disclaimer */}
        <p
          className="text-[10px]"
          style={{ color: "var(--text-3)", padding: "20px 20px 10px" }}
        >
          본 서비스는 정보 제공을 목적으로 하며 투자 조언이 아닙니다. 모든
          투자 결정의 책임은 이용자에게 있습니다.
        </p>
      </div>

      <TabBar active="home" />
    </div>
  );
}
