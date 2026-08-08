import type { EvidenceMap } from "../domain/evidence";
import type { InvestigationSettings } from "./investigationSettings";
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
  /** Absolute footstep timestamps (ms) for the active/last timing session. */
  timingTimestampsMs: number[];
  /**
   * When the last timing session produced a final result (ms since epoch).
   * Used by Overlay to auto-hide after `settings.timingResultHideAfterSeconds`.
   */
  timingResultCompletedAtMs: number | null;
  /** Threshold-based smudge stopwatch; elapsed time is derived client-side. */
  smudgeTimer: InvestigationTimer;
  /** Threshold-based hunt cooldown stopwatch. */
  huntTimer: InvestigationTimer;
  toasts: OverlayToast[];
  overlayAppearance: OverlayAppearanceSettings;
  settings: InvestigationSettings;
}
