import type { EvidenceId } from "./evidence";

export interface SpeedProfile {
  summary: string;
  /**
   * Single reference speed when the ghost has one typical value.
   * For ranged ghosts this is often the high end (or most distinctive value).
   */
  referenceSpeedMps: number | null;
  /** Inclusive lower bound for variable-speed matching (optional). */
  minSpeedMps?: number | null;
  /** Inclusive upper bound for variable-speed matching (optional). */
  maxSpeedMps?: number | null;
}

/**
 * Data-driven special behaviors. Filtering must consult these — UI must not.
 * Example: Mimic always presents fake Ghost Orbs.
 */
export interface GhostSpecialRules {
  /** Evidence that is always present for this ghost but not part of its journal triple. */
  alwaysPresentsEvidence?: EvidenceId[];
  /**
   * Evidence that cannot be the hidden one on Nightmare/Insanity (forced evidence).
   * Used by difficulty-aware filtering; standard 3-evidence mode only needs
   * effective evidence via alwaysPresentsEvidence (e.g. Mimic Orbs).
   */
  forcedEvidence?: EvidenceId[];
}

export interface Ghost {
  id: string;
  name: string;
  evidence: EvidenceId[];
  speedProfile: SpeedProfile;
  smudgeDurationSeconds: number;
  notes: string[];
  specialRules?: GhostSpecialRules;
}

export interface GhostDisplayItem extends Ghost {
  isPossible: boolean;
  /** True when the user manually marked this ghost eliminated. */
  isManuallyEliminated: boolean;
}
