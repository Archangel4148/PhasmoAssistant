/** Maximum footstep taps stored per timing session. */
export const MAX_FOOTSTEP_TIMESTAMPS = 5;

/** Distance per step used by the Phasmophobia companion formula. */
export const METERS_PER_STEP = 0.85;

export interface FootstepSpeedResult {
  /** Number of stored timestamps (0–5). */
  timestampCount: number;
  /** Interval lengths in seconds between consecutive timestamps. */
  intervalsSeconds: number[];
  /** Mean interval in seconds; null when fewer than 2 timestamps. */
  averageDeltaSeconds: number | null;
  /** Steps per second; null when fewer than 2 timestamps. */
  stepsPerSecond: number | null;
  /** Footstep cadence in BPM (SPS × 60); null when fewer than 2 timestamps. */
  beatsPerMinute: number | null;
  /**
   * Observed in-game speed (SPS × 0.85) before difficulty normalization.
   * Null when fewer than 2 timestamps.
   */
  observedMetersPerSecond: number | null;
  /**
   * Base journal-comparable speed: observed / ghostSpeedMultiplier.
   * Null when fewer than 2 timestamps.
   */
  metersPerSecond: number | null;
}

export interface CalculateFootstepSpeedOptions {
  /** Custom difficulty Ghost Speed multiplier (0.5–1.5). Defaults to 1. */
  ghostSpeedMultiplier?: number;
}

/**
 * Compute ghost speed from absolute footstep timestamps (milliseconds).
 *
 * Formula (SPEC §18):
 *   averageDelta = sum(intervals) / intervals.length
 *   SPS = 1 / averageDelta
 *   observedMetersPerSecond = SPS × 0.85
 *   metersPerSecond = observedMetersPerSecond / ghostSpeedMultiplier
 */
export function calculateFootstepSpeed(
  timestampsMs: readonly number[],
  options: CalculateFootstepSpeedOptions = {},
): FootstepSpeedResult {
  const multiplier = normalizeMultiplier(options.ghostSpeedMultiplier ?? 1);
  const capped = timestampsMs.slice(0, MAX_FOOTSTEP_TIMESTAMPS);
  const intervalsSeconds: number[] = [];

  for (let index = 1; index < capped.length; index += 1) {
    const deltaMs = capped[index]! - capped[index - 1]!;
    if (deltaMs > 0) {
      intervalsSeconds.push(deltaMs / 1000);
    }
  }

  if (intervalsSeconds.length === 0) {
    return emptyResult(capped.length, intervalsSeconds);
  }

  const averageDeltaSeconds =
    intervalsSeconds.reduce((sum, value) => sum + value, 0) /
    intervalsSeconds.length;

  if (!(averageDeltaSeconds > 0) || !Number.isFinite(averageDeltaSeconds)) {
    return emptyResult(capped.length, intervalsSeconds);
  }

  const stepsPerSecond = 1 / averageDeltaSeconds;
  const beatsPerMinute = stepsPerSecond * 60;
  const observedMetersPerSecond = stepsPerSecond * METERS_PER_STEP;
  const metersPerSecond = observedMetersPerSecond / multiplier;

  if (
    !Number.isFinite(observedMetersPerSecond) ||
    !Number.isFinite(beatsPerMinute) ||
    !Number.isFinite(metersPerSecond)
  ) {
    return {
      timestampCount: capped.length,
      intervalsSeconds,
      averageDeltaSeconds,
      stepsPerSecond: null,
      beatsPerMinute: null,
      observedMetersPerSecond: null,
      metersPerSecond: null,
    };
  }

  return {
    timestampCount: capped.length,
    intervalsSeconds,
    averageDeltaSeconds,
    stepsPerSecond,
    beatsPerMinute,
    observedMetersPerSecond,
    metersPerSecond,
  };
}

/** Convenience: normalized base m/s or null when not yet calculable. */
export function calculateGhostSpeedMps(
  timestampsMs: readonly number[],
  ghostSpeedMultiplier: number = 1,
): number | null {
  return calculateFootstepSpeed(timestampsMs, { ghostSpeedMultiplier })
    .metersPerSecond;
}

/**
 * Append a footstep timestamp. Ignores taps once five timestamps are stored.
 * Returns the previous array reference when unchanged.
 */
export function appendFootstepTimestamp(
  timestampsMs: readonly number[],
  nowMs: number,
): number[] {
  if (timestampsMs.length >= MAX_FOOTSTEP_TIMESTAMPS) {
    return timestampsMs as number[];
  }
  // Guard against zero/negative intervals from duplicate same-ms events.
  const last = timestampsMs[timestampsMs.length - 1];
  if (last !== undefined && nowMs <= last) {
    return timestampsMs as number[];
  }
  return [...timestampsMs, nowMs];
}

function emptyResult(
  timestampCount: number,
  intervalsSeconds: number[],
): FootstepSpeedResult {
  return {
    timestampCount,
    intervalsSeconds,
    averageDeltaSeconds: null,
    stepsPerSecond: null,
    beatsPerMinute: null,
    observedMetersPerSecond: null,
    metersPerSecond: null,
  };
}

function normalizeMultiplier(value: number): number {
  if (!Number.isFinite(value) || value <= 0) {
    return 1;
  }
  return value;
}
