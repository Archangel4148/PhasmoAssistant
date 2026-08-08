import { DEFAULT_HOTKEYS } from "../config/hotkeys";
import {
  DEFAULT_INVESTIGATION_SETTINGS,
  resolveInvestigationSettings,
  type InvestigationSettings,
} from "./investigationSettings";
import {
  DEFAULT_OVERLAY_APPEARANCE,
  resolveOverlayAppearance,
  type OverlayAppearanceSettings,
} from "./overlayAppearance";

export const PREFERENCES_STORE_FILE = "preferences.json";
export const PREFERENCES_VERSION = 1 as const;

export type AppTheme = "dark" | "light";

export interface WindowGeometry {
  x: number;
  y: number;
  width: number;
  height: number;
  /** When true, restore should maximize after positioning (multi-monitor safe). */
  maximized?: boolean;
}

export interface OverlayLayoutPreferences {
  /** Logical CSS scale for HUD content (1 = 100%). */
  scale: number;
  /**
   * Optional saved window geometry. Null means use the default maximized overlay.
   */
  geometry: WindowGeometry | null;
}

export interface HotkeyPreferences {
  toggleTiming: string;
  recordFootstep: string[];
}

export interface MicrophonePreferences {
  deviceId: string | null;
  label: string | null;
  /** When false, voice sidecar stays stopped. */
  enabled: boolean;
}

export interface PersistedPreferences {
  version: typeof PREFERENCES_VERSION;
  mainWindow: WindowGeometry | null;
  overlay: OverlayLayoutPreferences;
  overlayAppearance: OverlayAppearanceSettings;
  investigationSettings: InvestigationSettings;
  hotkeys: HotkeyPreferences;
  theme: AppTheme;
  microphone: MicrophonePreferences;
  /** Default smudge stopwatch threshold. */
  smudgeDurationSeconds: number;
  /** Default hunt cooldown threshold. */
  huntCooldownDurationSeconds: number;
}

export const OVERLAY_SCALE_MIN = 0.75;
export const OVERLAY_SCALE_MAX = 1.5;
export const DEFAULT_OVERLAY_SCALE = 1;

export const DEFAULT_HOTKEY_PREFERENCES: HotkeyPreferences = {
  toggleTiming: DEFAULT_HOTKEYS.toggleTiming,
  recordFootstep: [...DEFAULT_HOTKEYS.recordFootstep],
};

export const DEFAULT_MICROPHONE_PREFERENCES: MicrophonePreferences = {
  deviceId: null,
  label: null,
  enabled: true,
};

export const DEFAULT_PERSISTED_PREFERENCES: PersistedPreferences = {
  version: PREFERENCES_VERSION,
  mainWindow: null,
  overlay: {
    scale: DEFAULT_OVERLAY_SCALE,
    geometry: null,
  },
  overlayAppearance: { ...DEFAULT_OVERLAY_APPEARANCE },
  investigationSettings: { ...DEFAULT_INVESTIGATION_SETTINGS },
  hotkeys: { ...DEFAULT_HOTKEY_PREFERENCES, recordFootstep: [...DEFAULT_HOTKEY_PREFERENCES.recordFootstep] },
  theme: "dark",
  microphone: { ...DEFAULT_MICROPHONE_PREFERENCES },
  smudgeDurationSeconds: 90,
  huntCooldownDurationSeconds: 25,
};

export function clampOverlayScale(value: number): number {
  if (!Number.isFinite(value)) {
    return DEFAULT_OVERLAY_SCALE;
  }
  const clamped = Math.min(OVERLAY_SCALE_MAX, Math.max(OVERLAY_SCALE_MIN, value));
  return Math.round(clamped * 100) / 100;
}

export function normalizeWindowGeometry(
  value: unknown,
): WindowGeometry | null {
  if (!value || typeof value !== "object") {
    return null;
  }
  const record = value as Record<string, unknown>;
  const x = Number(record.x);
  const y = Number(record.y);
  const width = Number(record.width);
  const height = Number(record.height);
  if (
    ![x, y, width, height].every((entry) => Number.isFinite(entry)) ||
    width < 320 ||
    height < 240
  ) {
    return null;
  }
  return {
    x: Math.round(x),
    y: Math.round(y),
    width: Math.round(width),
    height: Math.round(height),
    maximized: record.maximized === true,
  };
}

function normalizeHotkeyString(value: unknown, fallback: string): string {
  if (typeof value !== "string") {
    return fallback;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : fallback;
}

function normalizeHotkeys(value: unknown): HotkeyPreferences {
  if (!value || typeof value !== "object") {
    return {
      toggleTiming: DEFAULT_HOTKEY_PREFERENCES.toggleTiming,
      recordFootstep: [...DEFAULT_HOTKEY_PREFERENCES.recordFootstep],
    };
  }
  const record = value as Record<string, unknown>;
  const footstepRaw = record.recordFootstep;
  const recordFootstep = Array.isArray(footstepRaw)
    ? footstepRaw
        .filter((entry): entry is string => typeof entry === "string")
        .map((entry) => entry.trim())
        .filter((entry) => entry.length > 0)
    : [...DEFAULT_HOTKEY_PREFERENCES.recordFootstep];

  return {
    toggleTiming: normalizeHotkeyString(
      record.toggleTiming,
      DEFAULT_HOTKEY_PREFERENCES.toggleTiming,
    ),
    recordFootstep:
      recordFootstep.length > 0
        ? recordFootstep
        : [...DEFAULT_HOTKEY_PREFERENCES.recordFootstep],
  };
}

function normalizeTheme(value: unknown): AppTheme {
  return value === "light" ? "light" : "dark";
}

function normalizeMicrophone(value: unknown): MicrophonePreferences {
  if (!value || typeof value !== "object") {
    return { ...DEFAULT_MICROPHONE_PREFERENCES };
  }
  const record = value as Record<string, unknown>;
  return {
    deviceId:
      typeof record.deviceId === "string" && record.deviceId.trim().length > 0
        ? record.deviceId
        : null,
    label:
      typeof record.label === "string" && record.label.trim().length > 0
        ? record.label
        : null,
    enabled: record.enabled !== false,
  };
}

function normalizeOverlayAppearance(
  value: unknown,
  legacyScale?: number,
): OverlayAppearanceSettings {
  if (!value || typeof value !== "object") {
    return resolveOverlayAppearance(null, legacyScale);
  }
  return resolveOverlayAppearance(
    value as Partial<OverlayAppearanceSettings>,
    legacyScale,
  );
}

function normalizeOverlayLayout(value: unknown): OverlayLayoutPreferences {
  if (!value || typeof value !== "object") {
    return {
      scale: DEFAULT_OVERLAY_SCALE,
      geometry: null,
    };
  }
  const record = value as Record<string, unknown>;
  return {
    scale: clampOverlayScale(
      typeof record.scale === "number" ? record.scale : DEFAULT_OVERLAY_SCALE,
    ),
    geometry: normalizeWindowGeometry(record.geometry),
  };
}

function normalizePositiveDuration(
  value: unknown,
  fallback: number,
): number {
  const numeric = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(numeric) || numeric < 1) {
    return fallback;
  }
  return Math.round(numeric);
}

/**
 * Validate and coerce arbitrary stored JSON into safe preferences.
 * Never throws — invalid shapes fall back field-by-field.
 */
export function resolvePersistedPreferences(
  value: unknown,
): PersistedPreferences {
  if (!value || typeof value !== "object") {
    return structuredClone(DEFAULT_PERSISTED_PREFERENCES);
  }

  const record = value as Record<string, unknown>;

  const overlay = normalizeOverlayLayout(record.overlay);

  return {
    version: PREFERENCES_VERSION,
    mainWindow: normalizeWindowGeometry(record.mainWindow),
    overlay,
    overlayAppearance: normalizeOverlayAppearance(
      record.overlayAppearance,
      overlay.scale,
    ),
    investigationSettings: resolveInvestigationSettings(
      record.investigationSettings as Partial<InvestigationSettings> | undefined,
    ),
    hotkeys: normalizeHotkeys(record.hotkeys),
    theme: normalizeTheme(record.theme),
    microphone: normalizeMicrophone(record.microphone),
    smudgeDurationSeconds: normalizePositiveDuration(
      record.smudgeDurationSeconds,
      DEFAULT_PERSISTED_PREFERENCES.smudgeDurationSeconds,
    ),
    huntCooldownDurationSeconds: normalizePositiveDuration(
      record.huntCooldownDurationSeconds,
      DEFAULT_PERSISTED_PREFERENCES.huntCooldownDurationSeconds,
    ),
  };
}
