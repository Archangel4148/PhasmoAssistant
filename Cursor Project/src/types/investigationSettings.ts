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

/**
 * How many journal evidence pieces the contract gives the player.
 * Mimic fake Ghost Orbs are always-presented extras and are not part of this count.
 */
export const EVIDENCE_DIFFICULTY_OPTIONS = [
  {
    id: "standard",
    label: "Amateur–Professional (3 evidence)",
    evidenceAvailable: 3,
  },
  {
    id: "nightmare",
    label: "Nightmare (2 evidence)",
    evidenceAvailable: 2,
  },
  {
    id: "insanity",
    label: "Insanity (1 evidence)",
    evidenceAvailable: 1,
  },
  {
    id: "apocalypse",
    label: "Apocalypse (0 evidence)",
    evidenceAvailable: 0,
  },
] as const;

export type EvidenceDifficultyId =
  (typeof EVIDENCE_DIFFICULTY_OPTIONS)[number]["id"];

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
  /** Journal evidence count / forced-evidence filtering mode. */
  evidenceDifficulty: EvidenceDifficultyId;
}

export const DEFAULT_INVESTIGATION_SETTINGS: InvestigationSettings = {
  ghostSpeedMultiplier: 1,
  timingResultHideAfterSeconds: DEFAULT_TIMING_RESULT_HIDE_SECONDS,
  evidenceDifficulty: "standard",
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

export function normalizeEvidenceDifficulty(
  value: unknown,
): EvidenceDifficultyId {
  if (typeof value !== "string") {
    return DEFAULT_INVESTIGATION_SETTINGS.evidenceDifficulty;
  }
  const match = EVIDENCE_DIFFICULTY_OPTIONS.find((option) => option.id === value);
  return match?.id ?? DEFAULT_INVESTIGATION_SETTINGS.evidenceDifficulty;
}

export function evidenceAvailableForDifficulty(
  difficulty: EvidenceDifficultyId,
): number {
  const match = EVIDENCE_DIFFICULTY_OPTIONS.find(
    (option) => option.id === difficulty,
  );
  return match?.evidenceAvailable ?? 3;
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
    evidenceDifficulty: normalizeEvidenceDifficulty(value?.evidenceDifficulty),
  };
}
