/** Custom-difficulty Ghost Speed (%) options from Phasmophobia. */
export const GHOST_SPEED_MULTIPLIER_OPTIONS = [
  { id: "50", label: "50%", multiplier: 0.5 },
  { id: "75", label: "75%", multiplier: 0.75 },
  { id: "100", label: "100% (Normal)", multiplier: 1 },
  { id: "125", label: "125%", multiplier: 1.25 },
  { id: "150", label: "150%", multiplier: 1.5 },
] as const;

export type GhostSpeedMultiplier =
  (typeof GHOST_SPEED_MULTIPLIER_OPTIONS)[number]["multiplier"];

/** How long the overlay keeps a finished timing result before fading. */
export const TIMING_RESULT_HIDE_MIN_SECONDS = 5;
export const TIMING_RESULT_HIDE_MAX_SECONDS = 15;
export const DEFAULT_TIMING_RESULT_HIDE_SECONDS = 7;

export interface InvestigationSettings {
  /**
   * Custom difficulty Ghost Speed multiplier.
   * Measured footstep speed is normalized by this so matches use base journal speeds.
   */
  ghostSpeedMultiplier: GhostSpeedMultiplier;
  /** Seconds to show the overlay speed result after timing completes. */
  timingResultHideAfterSeconds: number;
}

export const DEFAULT_INVESTIGATION_SETTINGS: InvestigationSettings = {
  ghostSpeedMultiplier: 1,
  timingResultHideAfterSeconds: DEFAULT_TIMING_RESULT_HIDE_SECONDS,
};

export function normalizeGhostSpeedMultiplier(
  value: unknown,
): GhostSpeedMultiplier {
  const numeric = typeof value === "number" ? value : Number(value);
  const match = GHOST_SPEED_MULTIPLIER_OPTIONS.find(
    (option) => option.multiplier === numeric,
  );
  return match?.multiplier ?? DEFAULT_INVESTIGATION_SETTINGS.ghostSpeedMultiplier;
}

export function clampTimingResultHideAfterSeconds(value: number): number {
  if (!Number.isFinite(value)) {
    return DEFAULT_TIMING_RESULT_HIDE_SECONDS;
  }
  return Math.min(
    TIMING_RESULT_HIDE_MAX_SECONDS,
    Math.max(TIMING_RESULT_HIDE_MIN_SECONDS, Math.round(value)),
  );
}

export function resolveInvestigationSettings(
  value: Partial<InvestigationSettings> | null | undefined,
): InvestigationSettings {
  return {
    ghostSpeedMultiplier: normalizeGhostSpeedMultiplier(
      value?.ghostSpeedMultiplier,
    ),
    timingResultHideAfterSeconds: clampTimingResultHideAfterSeconds(
      value?.timingResultHideAfterSeconds ??
        DEFAULT_TIMING_RESULT_HIDE_SECONDS,
    ),
  };
}
