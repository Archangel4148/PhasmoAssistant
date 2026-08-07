import { invoke } from "@tauri-apps/api/core";
import { listen, type UnlistenFn } from "@tauri-apps/api/event";
import type { SidecarStatus } from "../types/diagnostics";
import type { VoiceStatus } from "../types/voice";

export interface SidecarRuntimeStatus {
  connection: SidecarStatus;
  voiceStatus: VoiceStatus;
  lastError: string | null;
  usingMock: boolean;
}

export interface VoiceStatusPayload {
  status: VoiceStatus;
}

export interface VoiceCommandPayload {
  command: string;
  value: string | null;
}

export interface SidecarErrorPayload {
  message: string;
  recoverable: boolean;
}

export async function fetchSidecarStatus(): Promise<SidecarRuntimeStatus> {
  return invoke<SidecarRuntimeStatus>("get_sidecar_status");
}

export async function restartVoiceSidecar(): Promise<SidecarRuntimeStatus> {
  return invoke<SidecarRuntimeStatus>("restart_voice_sidecar");
}

export async function stopVoiceSidecar(): Promise<SidecarRuntimeStatus> {
  return invoke<SidecarRuntimeStatus>("stop_voice_sidecar");
}

export async function subscribeVoiceStatus(
  onEvent: (payload: VoiceStatusPayload) => void,
): Promise<UnlistenFn> {
  return listen<VoiceStatusPayload>("voice_status", (event) => {
    onEvent(event.payload);
  });
}

export async function subscribeVoiceCommand(
  onEvent: (payload: VoiceCommandPayload) => void,
): Promise<UnlistenFn> {
  return listen<VoiceCommandPayload>("voice_command", (event) => {
    onEvent(event.payload);
  });
}

export async function subscribeSidecarError(
  onEvent: (payload: SidecarErrorPayload) => void,
): Promise<UnlistenFn> {
  return listen<SidecarErrorPayload>("sidecar_error", (event) => {
    onEvent(event.payload);
  });
}
