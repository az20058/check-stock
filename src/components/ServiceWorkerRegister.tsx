"use client";

import { useEffect } from "react";

export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    if (process.env.NODE_ENV !== "production") {
      navigator.serviceWorker.getRegistrations().then(async (regs) => {
        const stale = regs.filter(
          (r) => !r.active?.scriptURL.includes("mockServiceWorker"),
        );
        if (stale.length === 0) return;
        await Promise.all(stale.map((r) => r.unregister()));
        window.location.reload();
      });
      return;
    }

    navigator.serviceWorker.register("/sw.js");
  }, []);

  return null;
}
