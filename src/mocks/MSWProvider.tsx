"use client";

import { useEffect, useState, type ReactNode } from "react";

export default function MSWProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (process.env.NODE_ENV !== "development") {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- production에서는 MSW 불필요, 즉시 렌더링
      setReady(true);
      return;
    }

    import("./browser").then(({ worker }) =>
      worker.start({ onUnhandledRequest: "bypass" }).then(() => setReady(true))
    );
  }, []);

  if (!ready) return null;

  return <>{children}</>;
}
