import { useEffect, useState } from "react";

/**
 * Local display clock for deriving elapsed/remaining UI from absolute timestamps.
 * Does not mutate store state. Pauses while the document is hidden.
 */
export function useClock(enabled: boolean, intervalMs = 1000): number {
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const tick = (): void => {
      if (document.visibilityState === "hidden") {
        return;
      }
      setNowMs(Date.now());
    };

    const immediateId = window.setTimeout(tick, 0);
    const intervalId = window.setInterval(tick, intervalMs);
    document.addEventListener("visibilitychange", tick);
    window.addEventListener("focus", tick);

    return () => {
      window.clearTimeout(immediateId);
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", tick);
      window.removeEventListener("focus", tick);
    };
  }, [enabled, intervalMs]);

  return nowMs;
}
