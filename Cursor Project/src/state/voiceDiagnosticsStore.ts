import { create } from "zustand";
import type { SidecarStatus } from "../types/diagnostics";
import type { VoiceEvent, VoiceStatus } from "../types/voice";
import type {
  SidecarErrorPayload,
  SidecarRuntimeStatus,
  VoiceCommandPayload,
  VoiceStatusPayload,
} from "../services/sidecarApi";

const MAX_RECENT_EVENTS = 12;

interface VoiceDiagnosticsState {
  sidecarStatus: SidecarStatus;
  voiceStatus: VoiceStatus;
  lastError: string | null;
  usingMock: boolean;
  recentVoiceEvents: VoiceEvent[];
  applyRuntimeStatus: (status: SidecarRuntimeStatus) => void;
  applyVoiceStatus: (payload: VoiceStatusPayload) => void;
  applyVoiceCommand: (payload: VoiceCommandPayload) => void;
  applySidecarError: (payload: SidecarErrorPayload) => void;
  /** Non-voice recoverable issue (sync/persist) — does not flip voice status. */
  reportAppWarning: (message: string) => void;
  pushEvent: (label: string) => void;
}

function formatTimestamp(date = new Date()): string {
  return date.toLocaleTimeString([], {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function connectionFromVoice(status: VoiceStatus): SidecarStatus {
  switch (status) {
    case "listening":
    case "starting":
      return "connected";
    case "error":
      return "error";
    case "offline":
      return "disconnected";
  }
}

export const useVoiceDiagnosticsStore = create<VoiceDiagnosticsState>((set, get) => ({
  sidecarStatus: "disconnected",
  voiceStatus: "offline",
  lastError: null,
  usingMock: true,
  recentVoiceEvents: [],

  pushEvent: (label) => {
    const event: VoiceEvent = {
      id: `evt-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      timestamp: formatTimestamp(),
      label,
    };
    set((state) => ({
      recentVoiceEvents: [event, ...state.recentVoiceEvents].slice(
        0,
        MAX_RECENT_EVENTS,
      ),
    }));
  },

  applyRuntimeStatus: (status) => {
    set({
      sidecarStatus: status.connection,
      voiceStatus: status.voiceStatus,
      lastError: status.lastError,
      usingMock: status.usingMock,
    });
  },

  applyVoiceStatus: (payload) => {
    set({
      voiceStatus: payload.status,
      sidecarStatus: connectionFromVoice(payload.status),
    });
    get().pushEvent(`Voice status → ${payload.status}`);
  },

  applyVoiceCommand: (payload) => {
    const detail = payload.value
      ? `${payload.command}:${payload.value}`
      : payload.command;
    get().pushEvent(`Voice command → ${detail}`);
  },

  applySidecarError: (payload) => {
    set({
      lastError: payload.message,
      sidecarStatus: "error",
      voiceStatus: "error",
    });
    get().pushEvent(`Sidecar error → ${payload.message}`);
  },

  reportAppWarning: (message) => {
    set({ lastError: message });
    get().pushEvent(`Warning → ${message}`);
  },
}));
