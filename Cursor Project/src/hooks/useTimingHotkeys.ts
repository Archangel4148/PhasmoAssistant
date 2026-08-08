import { useEffect, useRef, useState } from "react";
import { useInvestigationStore } from "../state/investigationStore";
import { usePreferencesStore } from "../state/preferencesStore";

type ShortcutEvent = {
  state: "Pressed" | "Released";
  shortcut: string;
};

async function safeUnregister(shortcut: string): Promise<void> {
  try {
    const { unregister, isRegistered } = await import(
      "@tauri-apps/plugin-global-shortcut"
    );
    if (await isRegistered(shortcut)) {
      await unregister(shortcut);
    }
  } catch {
    // Ignore — plugin may be unavailable or already torn down.
  }
}

/**
 * Registers the configured toggle-timing hotkey and, while timing mode is on,
 * footstep capture keys. Main window only (publisher).
 *
 * Falls back to window keydown listeners when the global-shortcut plugin
 * is unavailable (e.g. browser-only Vite preview).
 */
export function useTimingHotkeys(enabled: boolean): void {
  const timingMode = useInvestigationStore((state) => state.timingMode);
  const toggleTimingHotkey = usePreferencesStore(
    (state) => state.hotkeys.toggleTiming,
  );
  const footstepHotkeys = usePreferencesStore(
    (state) => state.hotkeys.recordFootstep,
  );
  const [usingGlobal, setUsingGlobal] = useState(false);
  const usingGlobalRef = useRef(false);

  useEffect(() => {
    if (!enabled) {
      usingGlobalRef.current = false;
      setUsingGlobal(false);
      return;
    }

    let cancelled = false;

    function onKeyDown(event: KeyboardEvent): void {
      if (usingGlobalRef.current) {
        return;
      }
      if (event.repeat) {
        return;
      }

      const toggle =
        (event.ctrlKey || event.metaKey) &&
        event.shiftKey &&
        event.key.toLowerCase() === "t";
      if (toggle) {
        event.preventDefault();
        useInvestigationStore.getState().toggleTimingMode();
        return;
      }

      if (!useInvestigationStore.getState().timingMode) {
        return;
      }

      if (event.code === "Space" || event.code === "Numpad0") {
        event.preventDefault();
        useInvestigationStore.getState().recordFootstep();
      }
    }

    window.addEventListener("keydown", onKeyDown);

    void (async () => {
      try {
        const { register } = await import("@tauri-apps/plugin-global-shortcut");
        await safeUnregister(toggleTimingHotkey);
        if (cancelled) {
          return;
        }

        await register(toggleTimingHotkey, (event: ShortcutEvent) => {
          if (event.state === "Pressed") {
            useInvestigationStore.getState().toggleTimingMode();
          }
        });

        if (!cancelled) {
          usingGlobalRef.current = true;
          setUsingGlobal(true);
        }
      } catch (error: unknown) {
        console.warn("Global toggle-timing hotkey unavailable", error);
        if (!cancelled) {
          usingGlobalRef.current = false;
          setUsingGlobal(false);
        }
      }
    })();

    return () => {
      cancelled = true;
      window.removeEventListener("keydown", onKeyDown);
      usingGlobalRef.current = false;
      setUsingGlobal(false);
      void safeUnregister(toggleTimingHotkey);
      for (const key of footstepHotkeys) {
        void safeUnregister(key);
      }
    };
  }, [enabled, toggleTimingHotkey, footstepHotkeys]);

  useEffect(() => {
    if (!enabled || !usingGlobal) {
      return;
    }

    let cancelled = false;
    const keys = [...footstepHotkeys];

    void (async () => {
      for (const key of keys) {
        await safeUnregister(key);
      }
      if (cancelled || !timingMode) {
        return;
      }

      try {
        const { register } = await import("@tauri-apps/plugin-global-shortcut");
        await register(keys, (event: ShortcutEvent) => {
          if (event.state === "Pressed") {
            useInvestigationStore.getState().recordFootstep();
          }
        });
      } catch (error: unknown) {
        console.warn("Global footstep hotkeys unavailable", error);
      }
    })();

    return () => {
      cancelled = true;
      for (const key of keys) {
        void safeUnregister(key);
      }
    };
  }, [enabled, usingGlobal, timingMode, footstepHotkeys]);
}
