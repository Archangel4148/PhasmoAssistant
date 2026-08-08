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
  usePreferencesStore,
} from "../state/preferencesStore";

/**
 * Load Tauri Store preferences once per window, apply theme/geometry, and
 * hydrate investigation preference fields. Investigation evidence/timers are
 * intentionally not restored.
 */
export function usePreferencesBootstrap(role: "main" | "overlay"): void {
  useEffect(() => {
    let cancelled = false;
    let saveGeometryTimer: ReturnType<typeof setTimeout> | null = null;
    const unlisteners: Array<() => void> = [];

    async function bootstrap(): Promise<void> {
      const preferences = await loadPersistedPreferences();
      if (cancelled) {
        return;
      }

      usePreferencesStore.getState().hydrate(preferences);
      applyThemeToDocument(preferences.theme);

      const investigation = useInvestigationStore.getState();
      investigation.setOverlayAppearance(preferences.overlayAppearance);
      investigation.setInvestigationSettings(preferences.investigationSettings);
      investigation.setSmudgeDurationSeconds(preferences.smudgeDurationSeconds);
      investigation.setHuntCooldownDurationSeconds(
        preferences.huntCooldownDurationSeconds,
      );

      if (role === "main" && preferences.mainWindow) {
        await applyWindowGeometry(preferences.mainWindow);
      }

      if (role === "overlay") {
        if (preferences.overlay.geometry) {
          await unmaximizeCurrentWindow();
          await applyWindowGeometry(preferences.overlay.geometry);
        }
      }

      if (role === "main" || role === "overlay") {
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
        } catch (error: unknown) {
          console.warn("Window geometry persistence unavailable", error);
        }
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
