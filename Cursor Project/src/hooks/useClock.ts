import { useEffect, useState } from "react";

/**
 * Local display clock. Does not mutate timer state — remaining time is derived
 * from absolute deadlines elsewhere. Re-syncs when the window regains focus.
 *
 * Always reads `Date.now()` when enabled so the first frame after a timer starts
 * is accurate (interval state alone would be stale until the first tick).
 */
export function useClock(enabled: boolean, intervalMs = 200): number {
  const [, setTick] = useState(0);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    setTick((value) => value + 1);
    const id = window.setInterval(() => {
      setTick((value) => value + 1);
    }, intervalMs);

    return () => {
      window.clearInterval(id);
    };
  }, [enabled, intervalMs]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const sync = (): void => {
      setTick((value) => value + 1);
    };

    document.addEventListener("visibilitychange", sync);
    window.addEventListener("focus", sync);
    return () => {
      document.removeEventListener("visibilitychange", sync);
      window.removeEventListener("focus", sync);
    };
  }, [enabled]);

  return Date.now();
}
