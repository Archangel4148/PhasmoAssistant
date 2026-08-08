/**
 * Investigation timer state. Authoritative timing uses an absolute start time;
 * elapsed time is always derived from the clock (never incremented in place).
 */
export type TimerPhase = "idle" | "running" | "expired";

export interface InvestigationTimer {
  /** Threshold (“end”) after which the UI switches to the expired color. */
  durationSeconds: number;
  /**
   * Absolute start time while the stopwatch is active. Null means Idle.
   * Remains set after the threshold so the timer can keep counting up.
   */
  startedAtMs: number | null;
}
