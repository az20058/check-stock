"use client";

import { useCallback, useSyncExternalStore } from "react";

const STORAGE_KEY = "check-stock:watchlist";
const DEFAULT_TICKERS = [
  "NVDA", "TSLA", "AAPL", "MSFT", "GOOGL", "AMZN", "META", "AVGO", "TSM",
];

function getTickers(): string[] {
  if (typeof window === "undefined") return DEFAULT_TICKERS;
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return DEFAULT_TICKERS;
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : DEFAULT_TICKERS;
  } catch {
    return DEFAULT_TICKERS;
  }
}

function setTickers(tickers: string[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tickers));
  window.dispatchEvent(new StorageEvent("storage", { key: STORAGE_KEY }));
}

let snapshotCache = DEFAULT_TICKERS;

function subscribe(callback: () => void) {
  snapshotCache = getTickers();
  const handler = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY || e.key === null) {
      snapshotCache = getTickers();
      callback();
    }
  };
  window.addEventListener("storage", handler);
  return () => window.removeEventListener("storage", handler);
}

function getSnapshot(): string[] {
  return snapshotCache;
}

function getServerSnapshot(): string[] {
  return DEFAULT_TICKERS;
}

export function useLocalWatchlist() {
  const tickers = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const add = useCallback((ticker: string) => {
    const current = getTickers();
    const upper = ticker.toUpperCase();
    if (!current.includes(upper)) {
      const next = [...current, upper];
      snapshotCache = next;
      setTickers(next);
    }
  }, []);

  const remove = useCallback((ticker: string) => {
    const current = getTickers();
    const upper = ticker.toUpperCase();
    const next = current.filter((t) => t !== upper);
    snapshotCache = next;
    setTickers(next);
  }, []);

  const isWatched = useCallback(
    (ticker: string) => tickers.includes(ticker.toUpperCase()),
    [tickers],
  );

  return { tickers, add, remove, isWatched };
}
