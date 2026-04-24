"use client";

import { useEffect } from "react";

export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    if (process.env.NODE_ENV !== "production") {
      navigator.serviceWorker.getRegistrations().then((regs) => {
        regs
          .filter((r) => !r.active?.scriptURL.includes("mockServiceWorker"))
          .forEach((r) => r.unregister());
      });
      return;
    }

    navigator.serviceWorker.register("/sw.js");
  }, []);

  return null;
}
