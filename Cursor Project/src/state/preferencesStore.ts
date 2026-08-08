import { create } from "zustand";
import { savePersistedPreferences } from "../services/preferencesStore";
import {
  DEFAULT_PERSISTED_PREFERENCES,
  clampOverlayScale,
  resolvePersistedPreferences,
  type AppTheme,
  type HotkeyPreferences,
  type MicrophonePreferences,
  type OverlayLayoutPreferences,
  type PersistedPreferences,
  type WindowGeometry,
} from "../types/persistedPreferences";
import type { InvestigationSettings } from "../types/investigationSettings";
import type { OverlayAppearanceSettings } from "../types/overlayAppearance";

interface PreferencesStoreState extends PersistedPreferences {
  hydrated: boolean;
  hydrate: (preferences: PersistedPreferences) => void;
  patchPreferences: (patch: Partial<PersistedPreferences>) => void;
  setTheme: (theme: AppTheme) => void;
  setHotkeys: (hotkeys: Partial<HotkeyPreferences>) => void;
  setMicrophone: (microphone: MicrophonePreferences) => void;
  setMainWindowGeometry: (geometry: WindowGeometry | null) => void;
  setOverlayLayout: (patch: Partial<OverlayLayoutPreferences>) => void;
  setOverlayAppearancePrefs: (appearance: OverlayAppearanceSettings) => void;
  setInvestigationSettingsPrefs: (settings: InvestigationSettings) => void;
  setTimerDefaults: (patch: {
    smudgeDurationSeconds?: number;
    huntCooldownDurationSeconds?: number;
  }) => void;
}

let saveTimer: ReturnType<typeof setTimeout> | null = null;

function scheduleSave(getState: () => PreferencesStoreState): void {
  if (saveTimer) {
    clearTimeout(saveTimer);
  }
  saveTimer = setTimeout(() => {
    const state = getState();
    if (!state.hydrated) {
      return;
    }
    void savePersistedPreferences({
      version: state.version,
      mainWindow: state.mainWindow,
      overlay: state.overlay,
      overlayAppearance: state.overlayAppearance,
      investigationSettings: state.investigationSettings,
      hotkeys: state.hotkeys,
      theme: state.theme,
      microphone: state.microphone,
      smudgeDurationSeconds: state.smudgeDurationSeconds,
      huntCooldownDurationSeconds: state.huntCooldownDurationSeconds,
    });
  }, 250);
}

function toPreferences(state: PreferencesStoreState): PersistedPreferences {
  return resolvePersistedPreferences({
    version: state.version,
    mainWindow: state.mainWindow,
    overlay: state.overlay,
    overlayAppearance: state.overlayAppearance,
    investigationSettings: state.investigationSettings,
    hotkeys: state.hotkeys,
    theme: state.theme,
    microphone: state.microphone,
    smudgeDurationSeconds: state.smudgeDurationSeconds,
    huntCooldownDurationSeconds: state.huntCooldownDurationSeconds,
  });
}

export const usePreferencesStore = create<PreferencesStoreState>((set, get) => ({
  ...structuredClone(DEFAULT_PERSISTED_PREFERENCES),
  hydrated: false,

  hydrate: (preferences) => {
    const resolved = resolvePersistedPreferences(preferences);
    set({ ...resolved, hydrated: true });
  },

  patchPreferences: (patch) => {
    const previous = get();
    const next = resolvePersistedPreferences({
      ...toPreferences(previous),
      ...patch,
    });
    set({ ...next, hydrated: previous.hydrated });
    scheduleSave(get);
  },

  setTheme: (theme) => {
    set({ theme });
    scheduleSave(get);
  },

  setHotkeys: (hotkeys) => {
    const previous = get();
    set({
      hotkeys: resolvePersistedPreferences({
        ...toPreferences(previous),
        hotkeys: { ...previous.hotkeys, ...hotkeys },
      }).hotkeys,
    });
    scheduleSave(get);
  },

  setMicrophone: (microphone) => {
    set({ microphone });
    scheduleSave(get);
  },

  setMainWindowGeometry: (geometry) => {
    set({ mainWindow: geometry });
    scheduleSave(get);
  },

  setOverlayLayout: (patch) => {
    const previous = get();
    set({
      overlay: {
        scale: clampOverlayScale(patch.scale ?? previous.overlay.scale),
        geometry:
          patch.geometry === undefined
            ? previous.overlay.geometry
            : patch.geometry,
      },
    });
    scheduleSave(get);
  },

  setOverlayAppearancePrefs: (appearance) => {
    set({ overlayAppearance: appearance });
    scheduleSave(get);
  },

  setInvestigationSettingsPrefs: (settings) => {
    set({ investigationSettings: settings });
    scheduleSave(get);
  },

  setTimerDefaults: (patch) => {
    set({
      smudgeDurationSeconds:
        patch.smudgeDurationSeconds ?? get().smudgeDurationSeconds,
      huntCooldownDurationSeconds:
        patch.huntCooldownDurationSeconds ?? get().huntCooldownDurationSeconds,
    });
    scheduleSave(get);
  },
}));

export function applyThemeToDocument(theme: AppTheme): void {
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
}
