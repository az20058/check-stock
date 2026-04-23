"use client";

export default function StatusBar({ time = "9:41" }: { time?: string }) {
  return (
    <div className="absolute top-0 left-0 right-0 h-[54px] flex items-center justify-between px-6 pt-[18px] z-10 pointer-events-none" style={{ color: "var(--text-0)" }}>
      <div className="font-semibold text-[15px]">{time}</div>
      <div className="flex gap-1.5 items-center">
        {/* Signal bars */}
        <svg width="18" height="11" viewBox="0 0 18 11" fill="none">
          <rect x="0" y="7" width="3" height="4" rx="0.6" fill="currentColor"/>
          <rect x="5" y="5" width="3" height="6" rx="0.6" fill="currentColor"/>
          <rect x="10" y="2" width="3" height="9" rx="0.6" fill="currentColor"/>
          <rect x="15" y="0" width="3" height="11" rx="0.6" fill="currentColor"/>
        </svg>
        {/* Wifi */}
        <svg width="16" height="11" viewBox="0 0 16 11" fill="none">
          <path d="M8 3c2 0 4 .8 5.4 2.2l1-1C12.6 2.4 10.4 1.4 8 1.4 5.6 1.4 3.4 2.4 1.6 4.2l1 1C4 3.8 6 3 8 3z" fill="currentColor"/>
          <path d="M8 6.2c1.2 0 2.2.4 3 1.2l1-1C10.8 5.2 9.4 4.6 8 4.6S5.2 5.2 4 6.4l1 1c.8-.8 1.8-1.2 3-1.2z" fill="currentColor"/>
          <circle cx="8" cy="9.5" r="1.3" fill="currentColor"/>
        </svg>
        {/* Battery */}
        <svg width="25" height="12" viewBox="0 0 25 12" fill="none">
          <rect x="0.5" y="0.5" width="21" height="11" rx="3" stroke="currentColor" strokeOpacity="0.5" fill="none"/>
          <rect x="2" y="2" width="16" height="8" rx="1.5" fill="currentColor"/>
          <path d="M23 4v4c.6-.3 1-.8 1-1.5v-1c0-.7-.4-1.2-1-1.5z" fill="currentColor" fillOpacity="0.5"/>
        </svg>
      </div>
    </div>
  );
}
