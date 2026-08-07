import type { VoiceEvent, VoiceStatus } from "./voice";

export type SidecarStatus = "connected" | "disconnected" | "error";

export interface DiagnosticsSnapshot {
  sidecarStatus: SidecarStatus;
  microphoneLabel: string;
  microphoneAvailable: boolean;
  voiceStatus: VoiceStatus;
  recentVoiceEvents: VoiceEvent[];
  lastError: string | null;
}
