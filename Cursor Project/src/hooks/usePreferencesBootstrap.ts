import { useEffect } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { loadPersistedPreferences } from "../services/preferencesStore";
import {
  applyWindowGeometry,
  readCurrentWindowGeometry,
  unmaximizeCurrentWindow,
} from "../services/windowGeometry";
import { useInvestigationStore } from "../state/investigationStore";
import {
  applyThemeToDocument,
  flushPreferencesSave,
  usePreferencesStore,
} from "../state/preferencesStore";
import { applyAccentToDocument } from "../types/overlayAppearance";

/**
 * Load Tauri Store preferences once per window.
 * Main applies preference fields into the investigation store (then sync publishes).
 * Overlay only restores geometry/scale locally; appearance/settings come from sync.
 */
export function usePreferencesBootstrap(role: "main" | "overlay"): void {
  useEffect(() => {
    let cancelled = false;
    let saveGeometryTimer: ReturnType<typeof setTimeout> | null = null;
    const unlisteners: Array<() => void> = [];

    async function persistGeometryNow(): Promise<void> {
      const geometry = await readCurrentWindowGeometry();
      if (!geometry || cancelled) {
        return;
      }
      if (role === "main") {
        usePreferencesStore.getState().setMainWindowGeometry(geometry);
      } else {
        usePreferencesStore.getState().setOverlayLayout({ geometry });
      }
      await flushPreferencesSave();
    }

    async function bootstrap(): Promise<void> {
      const preferences = await loadPersistedPreferences();
      if (cancelled) {
        return;
      }

      usePreferencesStore.getState().hydrate(preferences);
      applyThemeToDocument(preferences.theme);
      applyAccentToDocument(preferences.overlayAppearance.ghostTextColor);

      if (role === "main") {
        const investigation = useInvestigationStore.getState();
        investigation.setOverlayAppearance({
          ...preferences.overlayAppearance,
          hudScale:
            preferences.overlayAppearance.hudScale ?? preferences.overlay.scale,
          layoutEditMode: false,
        });
        investigation.setInvestigationSettings(preferences.investigationSettings);
        investigation.setSmudgeDurationSeconds(preferences.smudgeDurationSeconds);
        investigation.setHuntCooldownDurationSeconds(
          preferences.huntCooldownDurationSeconds,
        );

        if (preferences.mainWindow) {
          await applyWindowGeometry(preferences.mainWindow);
        }
      }

      if (role === "overlay" && preferences.overlay.geometry) {
        await unmaximizeCurrentWindow();
        await applyWindowGeometry(preferences.overlay.geometry);
      }

      try {
        const window = getCurrentWindow();
        const queueGeometrySave = (): void => {
          if (saveGeometryTimer) {
            clearTimeout(saveGeometryTimer);
          }
          saveGeometryTimer = setTimeout(() => {
            void (async () => {
              const geometry = await readCurrentWindowGeometry();
              if (!geometry || cancelled) {
                return;
              }
              if (role === "main") {
                usePreferencesStore.getState().setMainWindowGeometry(geometry);
              } else {
                usePreferencesStore.getState().setOverlayLayout({ geometry });
              }
            })();
          }, 400);
        };

        unlisteners.push(await window.onMoved(queueGeometrySave));
        unlisteners.push(await window.onResized(queueGeometrySave));
        unlisteners.push(
          await window.onCloseRequested(async (event) => {
            event.preventDefault();
            try {
              await persistGeometryNow();
            } catch (error: unknown) {
              console.warn("Failed to flush geometry before close", error);
            } finally {
              await window.destroy();
            }
          }),
        );
      } catch (error: unknown) {
        console.warn("Window geometry persistence unavailable", error);
      }
    }

    void bootstrap();

    return () => {
      cancelled = true;
      if (saveGeometryTimer) {
        clearTimeout(saveGeometryTimer);
      }
      for (const unlisten of unlisteners) {
        unlisten();
      }
    };
  }, [role]);
}
