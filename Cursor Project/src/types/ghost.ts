import type { EvidenceId } from "./evidence";

export interface SpeedProfile {
  summary: string;
  referenceSpeedMps: number | null;
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
   * Standard 3-evidence filtering still uses effective evidence via alwaysPresentsEvidence.
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
