import StatusBar from "@/components/StatusBar";
import TabBar from "@/components/TabBar";
import Avatar from "@/components/Avatar";
import PriceChart from "@/components/PriceChart";
import Pct from "@/components/Pct";

const chartData = [440, 438, 442, 436, 431, 428, 432, 425, 420, 418, 422, 415, 410, 412, 408, 405, 410, 414, 412, 408, 411, 412, 410, 413];

const segments = ["1D", "1W", "1M", "3M", "1Y", "ALL"];

const causes = [
  {
    rank: 1,
    title: "10년물 금리 4.55%로 재상승",
    desc: "고밸류 성장주 할인율 상승 → PER 80배 반도체주 직격. 같은 날 SOXX(반도체 ETF)도 −2.3% 동반 하락.",
    tags: ["#매크로", "#섹터"],
    accent: true,
  },
  {
    rank: 2,
    title: 'TSMC "2026 AI 칩 수요 모멘텀 둔화" 가이던스',
    desc: "대만 어닝콜에서 언급. 엔비디아 최대 파운드리 공급사라 동반 하락 압력. AMD(−3.1%), AVGO(−2.8%)도 유사 패턴.",
    tags: ["#공급망", "#어닝"],
    accent: false,
  },
  {
    rank: 3,
    title: "대형 기관투자자 차익실현 정황",
    desc: "평균 거래량 대비 1.9배 · 장 마감 30분간 물량 집중. 13F 공시 앞두고 포지션 조정으로 추정.",
    tags: ["#수급"],
    accent: false,
  },
];

const sectorComparisons = [
  { label: "NVDA", pct: -4.82, widthPct: 100, primary: true },
  { label: "반도체 섹터 (SOXX)", pct: -2.31, widthPct: 48, primary: false },
  { label: "NASDAQ 100", pct: -1.18, widthPct: 24, primary: false },
  { label: "S&P 500", pct: -0.42, widthPct: 9, primary: false },
];

const news = [
  {
    source: "REUTERS",
    title: "美 10년물 금리 4.55% 돌파, 연준 인하 기대 후퇴",
    time: "3시간 전",
  },
  {
    source: "BLOOMBERG",
    title: "TSMC, 2026년 AI 칩 수요 모멘텀 둔화 전망",
    time: "5시간 전",
  },
  {
    source: "CNBC",
    title: "엔비디아, 대형 기관 매물 출회… 차익실현 관측",
    time: "7시간 전",
  },
  {
    source: "한경",
    title: '서학개미 "반도체 조정은 기회" vs 전문가 "조심"',
    time: "9시간 전",
  },
];

const macros = [
  { label: "10Y Yield", value: "4.55%", delta: "+5bp", up: true },
  { label: "VIX", value: "18.24", delta: "+1.05", up: true },
  { label: "XLK (기술주)", value: "−1.82%", delta: "상대적 약세", up: false },
  { label: "거래량", value: "1.9×", delta: "평균 대비", up: true },
];

export default function ReportPage() {
  return (
    <div className="relative h-dvh overflow-hidden" style={{ background: "var(--bg-1)" }}>
      <StatusBar time="9:02" />

      {/* Scrollable content */}
      <div className="overflow-y-auto h-full pt-[54px] pb-[96px]">

        {/* Top bar */}
        <div className="flex items-center justify-between px-4 pt-1.5">
          {/* Back button */}
          <button
            className="w-9 h-9 rounded-xl flex items-center justify-center border"
            style={{ background: "var(--bg-2)", borderColor: "var(--line)" }}
            aria-label="뒤로가기"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M15 19l-7-7 7-7" stroke="var(--text-1)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          {/* Center: exchange + ticker */}
          <div className="flex flex-col items-center gap-0.5">
            <span
              className="text-[11px] font-semibold"
              style={{ color: "var(--text-2)" }}
            >
              NASDAQ
            </span>
            <span
              className="font-mono text-sm font-bold"
              style={{ color: "var(--text-0)" }}
            >
              NVDA
            </span>
          </div>

          {/* Star button */}
          <button
            className="w-9 h-9 rounded-xl flex items-center justify-center border"
            style={{ background: "var(--bg-2)", borderColor: "var(--line)" }}
            aria-label="관심종목 추가"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="var(--accent)">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
          </button>
        </div>

        {/* Hero */}
        <div className="px-5 pt-4 pb-2">
          <div className="flex items-center gap-3 mb-3">
            <Avatar ticker="NVDA" size="lg" />
            <div>
              <div className="text-lg font-bold" style={{ color: "var(--text-0)" }}>엔비디아</div>
              <div className="text-xs" style={{ color: "var(--text-2)" }}>NVIDIA Corp. · 반도체</div>
            </div>
          </div>

          <div
            className="font-mono text-[34px] font-bold tracking-tight"
            style={{ color: "var(--text-0)" }}
          >
            $412.73
          </div>

          <div className="flex items-center gap-2 mt-1">
            <span
              className="font-mono text-[15px] font-semibold"
              style={{ color: "var(--down)" }}
            >
              −$20.89 (−4.82%)
            </span>
            <span
              className="inline-flex items-center h-[22px] px-2 rounded-md text-[11px] font-semibold"
              style={{
                background: "var(--down-soft)",
                color: "var(--down)",
              }}
            >
              장마감
            </span>
          </div>
        </div>

        {/* Chart card */}
        <div className="mx-4 mt-3">
          <div
            className="rounded-[20px] border overflow-hidden"
            style={{
              background: "var(--bg-2)",
              borderColor: "var(--line)",
              padding: "14px 4px 10px",
            }}
          >
            {/* Chart header */}
            <div className="flex items-center justify-between px-3 mb-2">
              <span
                className="uppercase tracking-widest text-[11px] font-semibold"
                style={{ color: "var(--text-3)" }}
              >
                일봉
              </span>
              <span
                className="font-mono text-xs"
                style={{ color: "var(--text-2)" }}
              >
                4.23 · 4.24
              </span>
            </div>

            {/* Chart */}
            <div className="flex justify-center">
              <PriceChart data={chartData} up={false} width={311} height={128} />
            </div>

            {/* Segmented control */}
            <div className="flex justify-center mt-3">
              <div
                className="inline-flex p-1 rounded-xl border gap-0.5"
                style={{ background: "var(--bg-2)", borderColor: "var(--line)" }}
              >
                {segments.map((seg) => (
                  <span
                    key={seg}
                    className="px-3 py-1.5 text-xs font-semibold rounded-[9px] cursor-pointer"
                    style={
                      seg === "1D"
                        ? { background: "var(--bg-4)", color: "var(--text-0)" }
                        : { color: "var(--text-2)" }
                    }
                  >
                    {seg}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* AI 한 줄 요약 */}
        <div className="mx-4 mt-4">
          <div
            className="rounded-[20px] border"
            style={{
              background: "linear-gradient(180deg, rgba(59,130,246,0.08) 0%, rgba(59,130,246,0) 100%)",
              borderColor: "var(--accent-ring)",
              padding: "18px",
            }}
          >
            <div className="flex items-center gap-2 mb-3">
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ background: "var(--accent)" }}
              />
              <span
                className="text-[11px] font-semibold uppercase tracking-widest"
                style={{ color: "var(--accent)" }}
              >
                AI 한 줄 요약
              </span>
            </div>
            <p
              className="text-base font-bold leading-relaxed"
              style={{ color: "var(--text-0)" }}
            >
              금리 상승 + AI 수요 둔화 우려 + 경쟁사 호실적 3중 악재로 평균 거래량 1.9배 수반한 매물 출회.
            </p>
          </div>
        </div>

        {/* 하락 원인 TOP 3 */}
        <div className="mt-6">
          <div className="flex items-baseline gap-1.5 px-5 mb-3">
            <h2 className="text-lg font-bold" style={{ color: "var(--text-0)" }}>
              어제 하락 원인{" "}
              <span style={{ color: "var(--accent)" }}>TOP 3</span>
            </h2>
            <span className="text-xs" style={{ color: "var(--text-2)" }}>중요도순</span>
          </div>

          <div className="px-4 flex flex-col gap-3">
            {causes.map((c) => (
              <div
                key={c.rank}
                className="rounded-[14px] border"
                style={{
                  padding: "14px",
                  background: "var(--bg-2)",
                  borderColor: "var(--line)",
                }}
              >
                <div className="flex items-start gap-3">
                  {/* Rank badge */}
                  <span
                    className="w-[22px] h-[22px] rounded-[7px] border flex items-center justify-center font-mono text-[11px] font-bold shrink-0"
                    style={
                      c.accent
                        ? {
                            background: "var(--accent-soft)",
                            color: "var(--accent)",
                            borderColor: "var(--accent-ring)",
                          }
                        : {
                            background: "var(--bg-3)",
                            color: "var(--text-2)",
                            borderColor: "var(--line)",
                          }
                    }
                  >
                    {c.rank}
                  </span>

                  <div className="flex-1 min-w-0">
                    <div
                      className="text-[13px] font-bold leading-snug"
                      style={{ color: "var(--text-0)" }}
                    >
                      {c.title}
                    </div>
                    <p
                      className="text-xs leading-relaxed mt-1.5"
                      style={{ color: "var(--text-1)" }}
                    >
                      {c.desc}
                    </p>
                    <div className="flex gap-1.5 flex-wrap mt-2">
                      {c.tags.map((tag) => (
                        <span
                          key={tag}
                          className="text-[11px] rounded-full border px-2 h-[20px] flex items-center"
                          style={{
                            background: "var(--bg-3)",
                            color: "var(--text-2)",
                            borderColor: "var(--line)",
                          }}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 섹터 대비 */}
        <div className="mt-6 px-4">
          <h2 className="text-lg font-bold px-1 mb-3" style={{ color: "var(--text-0)" }}>
            섹터 대비
          </h2>
          <div
            className="rounded-[20px] border"
            style={{
              background: "var(--bg-2)",
              borderColor: "var(--line)",
              padding: "16px",
            }}
          >
            <div className="flex flex-col gap-3.5">
              {sectorComparisons.map((item) => (
                <div key={item.label}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span
                      className="text-[13px]"
                      style={{
                        color: item.primary ? "var(--text-0)" : "var(--text-2)",
                        fontWeight: item.primary ? 700 : 400,
                      }}
                    >
                      {item.label}
                    </span>
                    <Pct v={item.pct} bold={item.primary} />
                  </div>
                  <div
                    className="h-1.5 rounded-full w-full"
                    style={{ background: "var(--bg-3)" }}
                  >
                    <div
                      className="h-1.5 rounded-full"
                      style={{
                        width: `${item.widthPct}%`,
                        background: item.primary ? "var(--down)" : "var(--bg-4)",
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 관련 뉴스 */}
        <div className="mt-6 px-4">
          <div className="flex items-center justify-between px-1 mb-3">
            <h2 className="text-lg font-bold" style={{ color: "var(--text-0)" }}>
              관련 뉴스
            </h2>
            <span
              className="text-xs font-semibold"
              style={{ color: "var(--text-2)" }}
            >
              4건
            </span>
          </div>
          <div
            className="rounded-[20px] border"
            style={{
              background: "var(--bg-2)",
              borderColor: "var(--line)",
              padding: "0 16px",
            }}
          >
            {news.map((item, i) => (
              <div
                key={i}
                className="flex gap-2.5 py-3"
                style={
                  i > 0
                    ? { borderTop: "1px solid var(--line)" }
                    : {}
                }
              >
                {/* Thumbnail placeholder with diagonal stripe */}
                <div
                  className="w-14 h-14 rounded-[10px] shrink-0"
                  style={{
                    background: "var(--bg-3)",
                    backgroundImage:
                      "repeating-linear-gradient(45deg, transparent, transparent 4px, rgba(255,255,255,0.03) 4px, rgba(255,255,255,0.03) 8px)",
                  }}
                />
                <div className="flex-1 min-w-0 flex flex-col justify-center gap-0.5">
                  <div
                    className="text-[10px] uppercase tracking-wider font-semibold"
                    style={{ color: "var(--text-3)" }}
                  >
                    {item.source}
                  </div>
                  <div
                    className="text-[13px] font-semibold leading-snug"
                    style={{ color: "var(--text-0)" }}
                  >
                    {item.title}
                  </div>
                  <div
                    className="text-[11px]"
                    style={{ color: "var(--text-3)" }}
                  >
                    {item.time}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 매크로 맥락 */}
        <div className="mt-6 px-4">
          <h2 className="text-lg font-bold px-1 mb-3" style={{ color: "var(--text-0)" }}>
            매크로 맥락
          </h2>
          <div className="grid grid-cols-2 gap-2">
            {macros.map((m) => (
              <div
                key={m.label}
                className="rounded-[14px] border"
                style={{
                  padding: "12px 14px",
                  background: "var(--bg-2)",
                  borderColor: "var(--line)",
                }}
              >
                <div
                  className="text-[11px] font-semibold"
                  style={{ color: "var(--text-2)" }}
                >
                  {m.label}
                </div>
                <div
                  className="font-mono text-[17px] font-bold mt-1"
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

        {/* Disclaimer */}
        <div className="mt-6 mx-4 mb-2">
          <p
            className="text-[11px] leading-relaxed text-center"
            style={{ color: "var(--text-3)" }}
          >
            AI가 뉴스·공시·시장 데이터를 해석한 결과이며 투자 조언이 아닙니다. 데이터 출처: Finnhub, SEC EDGAR, FRED.
          </p>
        </div>

      </div>

      <TabBar active="watch" />
    </div>
  );
}
