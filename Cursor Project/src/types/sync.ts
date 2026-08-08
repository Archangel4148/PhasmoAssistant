import type { EvidenceMap } from "../domain/evidence";
import type { OverlayAppearanceSettings } from "./overlayAppearance";
import type { InvestigationTimer } from "./timer";

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
  /** Deadline-based smudge timer; remaining time is derived client-side. */
  smudgeTimer: InvestigationTimer;
  /** Deadline-based hunt cooldown timer. */
  huntTimer: InvestigationTimer;
  currentGhostSpeedMps: number | null;
  toasts: OverlayToast[];
  overlayAppearance: OverlayAppearanceSettings;
}
