"use client";

import Link from "next/link";

type TabId = "home" | "watch" | "search";

const tabs: { id: TabId; label: string; href: string; icon: (active: boolean) => React.ReactNode }[] = [
  {
    id: "home", label: "브리핑", href: "/",
    icon: (on) => (
      <svg viewBox="0 0 24 24" fill="none" className="w-[22px] h-[22px]">
        <path d="M4 7h16M4 12h16M4 17h10" stroke={on ? "var(--accent)" : "var(--text-3)"} strokeWidth="2" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    id: "watch", label: "관심", href: "/watchlist",
    icon: (on) => (
      <svg viewBox="0 0 24 24" fill="none" className="w-[22px] h-[22px]">
        <path d="M12 21s-7-4.5-7-10a4 4 0 017-2.6A4 4 0 0119 11c0 5.5-7 10-7 10z" stroke={on ? "var(--accent)" : "var(--text-3)"} strokeWidth="2" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    id: "search", label: "검색", href: "/search",
    icon: (on) => (
      <svg viewBox="0 0 24 24" fill="none" className="w-[22px] h-[22px]">
        <circle cx="11" cy="11" r="6.5" stroke={on ? "var(--accent)" : "var(--text-3)"} strokeWidth="2"/>
        <path d="M20 20l-4-4" stroke={on ? "var(--accent)" : "var(--text-3)"} strokeWidth="2" strokeLinecap="round"/>
      </svg>
    ),
  },
];

export default function TabBar({ active = "home" }: { active?: TabId }) {
  return (
    <div className="fixed bottom-0 left-0 right-0 flex items-end justify-around px-3 z-10"
      style={{ height: "calc(64px + env(safe-area-inset-bottom))", paddingTop: "8px", paddingBottom: "env(safe-area-inset-bottom)", background: "var(--bg-2)", borderTop: "1px solid var(--line-strong)" }}>
      {tabs.map((t) => (
        <Link key={t.id} href={t.href}
          className="flex flex-col items-center gap-0.5 text-[10px] font-semibold px-3.5 flex-1"
          style={{ color: active === t.id ? "var(--accent)" : "var(--text-3)" }}>
          {t.icon(active === t.id)}
          <span>{t.label}</span>
        </Link>
      ))}
    </div>
  );
}
