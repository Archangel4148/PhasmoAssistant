import type { DiagnosticsSnapshot } from "../types/diagnostics";
import type { VoiceStatus } from "../types/voice";

/** Static placeholders for subsystems not yet wired (timers, voice, diagnostics). */
export interface MockSubsystemSnapshot {
  voiceStatus: VoiceStatus;
  timingMode: boolean;
  currentGhostSpeedMps: number | null;
  smudgeRemainingSeconds: number | null;
  huntRemainingSeconds: number | null;
  diagnostics: DiagnosticsSnapshot;
}

export const MOCK_SUBSYSTEMS: MockSubsystemSnapshot = {
  voiceStatus: "offline",
  timingMode: false,
  currentGhostSpeedMps: null,
  smudgeRemainingSeconds: null,
  huntRemainingSeconds: null,
  diagnostics: {
    sidecarStatus: "disconnected",
    microphoneLabel: "No microphone selected",
    microphoneAvailable: false,
    voiceStatus: "offline",
    recentVoiceEvents: [],
    lastError: null,
  },
};
