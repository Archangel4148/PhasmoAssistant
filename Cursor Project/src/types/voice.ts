export type VoiceStatus = "offline" | "starting" | "listening" | "error";

export interface VoiceEvent {
  id: string;
  timestamp: string;
  label: string;
}
