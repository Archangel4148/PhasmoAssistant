import type { EvidenceMap } from "../domain/evidence";
import type { OverlayAppearanceSettings } from "./overlayAppearance";

export interface OverlayToast {
  id: string;
  message: string;
  createdAtMs: number;
}

/** Serializable investigation mirror shared Main ↔ Overlay via Rust. */
export interface InvestigationSnapshot {
  evidence: EvidenceMap;
  eliminatedGhostIds: string[];
  timingMode: boolean;
  smudgeRemainingSeconds: number | null;
  huntRemainingSeconds: number | null;
  currentGhostSpeedMps: number | null;
  toasts: OverlayToast[];
  overlayAppearance: OverlayAppearanceSettings;
}
