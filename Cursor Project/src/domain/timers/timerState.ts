import type { InvestigationTimer, TimerPhase } from "../../types/timer";

/** Standard incense prevention window for most ghosts. */
export const DEFAULT_SMUDGE_SECONDS = 90;
/** Demon incense window. */
export const DEMON_SMUDGE_SECONDS = 60;
/** Spirit incense window. */
export const SPIRIT_SMUDGE_SECONDS = 180;

/** Common post-hunt cooldown on Amateur / Intermediate. */
export const DEFAULT_HUNT_COOLDOWN_SECONDS = 25;

export const SMUDGE_DURATION_PRESETS = [
  DEMON_SMUDGE_SECONDS,
  DEFAULT_SMUDGE_SECONDS,
  SPIRIT_SMUDGE_SECONDS,
] as const;

export const HUNT_COOLDOWN_DURATION_PRESETS = [15, 20, 25] as const;

export function createIdleTimer(
  durationSeconds: number = DEFAULT_SMUDGE_SECONDS,
): InvestigationTimer {
  return {
    durationSeconds: normalizeDurationSeconds(durationSeconds),
    startedAtMs: null,
  };
}

export function startTimer(
  timer: InvestigationTimer,
  nowMs: number,
  durationSeconds: number = timer.durationSeconds,
): InvestigationTimer {
  const duration = normalizeDurationSeconds(durationSeconds);
  return {
    durationSeconds: duration,
    startedAtMs: nowMs,
  };
}

export function resetTimer(timer: InvestigationTimer): InvestigationTimer {
  return {
    durationSeconds: timer.durationSeconds,
    startedAtMs: null,
  };
}

/**
 * Start when idle; stop+reset when already active (running or past threshold).
 * Used by UI Start/Stop and voice re-triggers.
 */
export function toggleTimer(
  timer: InvestigationTimer,
  nowMs: number,
): InvestigationTimer {
  if (timer.startedAtMs !== null) {
    return resetTimer(timer);
  }
  return startTimer(timer, nowMs);
}

export function setTimerDuration(
  timer: InvestigationTimer,
  durationSeconds: number,
): InvestigationTimer {
  return {
    ...timer,
    durationSeconds: normalizeDurationSeconds(durationSeconds),
  };
}

export function getTimerPhase(
  timer: InvestigationTimer,
  nowMs: number,
): TimerPhase {
  if (timer.startedAtMs === null) {
    return "idle";
  }
  const elapsedSeconds = getElapsedSeconds(timer, nowMs) ?? 0;
  if (elapsedSeconds >= timer.durationSeconds) {
    return "expired";
  }
  return "running";
}

/**
 * Whole seconds elapsed for stopwatch display. Uses floor so the display
 * starts at 0:00 and advances on each full second.
 */
export function getElapsedSeconds(
  timer: InvestigationTimer,
  nowMs: number,
): number | null {
  if (timer.startedAtMs === null) {
    return null;
  }
  return Math.max(0, Math.floor((nowMs - timer.startedAtMs) / 1000));
}

/** True while the stopwatch is counting (including past the threshold). */
export function isTimerActive(timer: InvestigationTimer): boolean {
  return timer.startedAtMs !== null;
}

/** True only before the end threshold — useful for high-frequency UI clocks. */
export function isTimerRunning(
  timer: InvestigationTimer,
  nowMs: number,
): boolean {
  return getTimerPhase(timer, nowMs) === "running";
}

function normalizeDurationSeconds(value: number): number {
  if (!Number.isFinite(value)) {
    return DEFAULT_SMUDGE_SECONDS;
  }
  return Math.max(1, Math.round(value));
}
