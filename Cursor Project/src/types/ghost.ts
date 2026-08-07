import type { EvidenceId } from "./evidence";

export interface SpeedProfile {
  summary: string;
  referenceSpeedMps: number | null;
}

export interface Ghost {
  id: string;
  name: string;
  evidence: EvidenceId[];
  speedProfile: SpeedProfile;
  smudgeDurationSeconds: number;
  notes: string[];
}

export interface GhostDisplayItem extends Ghost {
  isPossible: boolean;
}
