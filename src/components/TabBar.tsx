"use client";

import Link from "next/link";

type TabId = "home" | "watch" | "search" | "me";

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
    id: "search", label: "검색", href: "#",
    icon: (on) => (
      <svg viewBox="0 0 24 24" fill="none" className="w-[22px] h-[22px]">
        <circle cx="11" cy="11" r="6.5" stroke={on ? "var(--accent)" : "var(--text-3)"} strokeWidth="2"/>
        <path d="M20 20l-4-4" stroke={on ? "var(--accent)" : "var(--text-3)"} strokeWidth="2" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    id: "me", label: "내정보", href: "#",
    icon: (on) => (
      <svg viewBox="0 0 24 24" fill="none" className="w-[22px] h-[22px]">
        <circle cx="12" cy="8" r="3.5" stroke={on ? "var(--accent)" : "var(--text-3)"} strokeWidth="2"/>
        <path d="M5 20c1.5-3.5 4-5 7-5s5.5 1.5 7 5" stroke={on ? "var(--accent)" : "var(--text-3)"} strokeWidth="2" strokeLinecap="round"/>
      </svg>
    ),
  },
];

export default function TabBar({ active = "home" }: { active?: TabId }) {
  return (
    <div className="absolute bottom-0 left-0 right-0 h-[82px] flex items-start justify-around pt-2.5 px-3 z-10"
      style={{ background: "linear-gradient(180deg, rgba(15,18,24,0) 0%, rgba(15,18,24,0.85) 30%, var(--bg-1) 60%)" }}>
      {tabs.map((t) => (
        <Link key={t.id} href={t.href}
          className="flex flex-col items-center gap-1 text-[10px] font-semibold py-1.5 px-3.5 flex-1"
          style={{ color: active === t.id ? "var(--accent)" : "var(--text-3)" }}>
          {t.icon(active === t.id)}
          <span>{t.label}</span>
        </Link>
      ))}
    </div>
  );
}
