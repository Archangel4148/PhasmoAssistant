import { useEffect, useRef, useState } from "react";
import { DEFAULT_HOTKEYS } from "../config/hotkeys";
import { useInvestigationStore } from "../state/investigationStore";

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
 * Registers Ctrl+Shift+T (toggle timing) and, while timing mode is on,
 * Space / Numpad 0 for footstep capture. Main window only (publisher).
 *
 * Falls back to window keydown listeners when the global-shortcut plugin
 * is unavailable (e.g. browser-only Vite preview).
 */
export function useTimingHotkeys(enabled: boolean): void {
  const timingMode = useInvestigationStore((state) => state.timingMode);
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
        await safeUnregister(DEFAULT_HOTKEYS.toggleTiming);
        if (cancelled) {
          return;
        }

        await register(DEFAULT_HOTKEYS.toggleTiming, (event: ShortcutEvent) => {
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
      void safeUnregister(DEFAULT_HOTKEYS.toggleTiming);
      for (const key of DEFAULT_HOTKEYS.recordFootstep) {
        void safeUnregister(key);
      }
    };
  }, [enabled]);

  useEffect(() => {
    if (!enabled || !usingGlobal) {
      return;
    }

    let cancelled = false;
    const keys = [...DEFAULT_HOTKEYS.recordFootstep];

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
  }, [enabled, usingGlobal, timingMode]);
}
