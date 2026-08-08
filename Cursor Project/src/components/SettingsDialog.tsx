import { WebviewWindow } from "@tauri-apps/api/webviewWindow";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useInvestigationStore } from "../state/investigationStore";
import {
  applyThemeToDocument,
  usePreferencesStore,
} from "../state/preferencesStore";
import {
  clampTimingResultHideAfterSeconds,
  GHOST_SPEED_MULTIPLIER_OPTIONS,
  TIMING_RESULT_HIDE_MAX_SECONDS,
  TIMING_RESULT_HIDE_MIN_SECONDS,
  type GhostSpeedMultiplier,
} from "../types/investigationSettings";
import {
  clampOverlayScale,
  DEFAULT_HOTKEY_PREFERENCES,
  OVERLAY_SCALE_MAX,
  OVERLAY_SCALE_MIN,
  type AppTheme,
} from "../types/persistedPreferences";
import {
  clampTickerSpeed,
  DEFAULT_OVERLAY_APPEARANCE,
  normalizeHexColor,
  OVERLAY_TICKER_SPEED_MAX,
  OVERLAY_TICKER_SPEED_MIN,
} from "../types/overlayAppearance";

async function resetOverlayWindowLayout(): Promise<void> {
  try {
    const overlay = await WebviewWindow.getByLabel("overlay");
    if (overlay) {
      await overlay.maximize();
    }
  } catch (error: unknown) {
    console.warn("Failed to reset overlay window layout", error);
  }
}

interface SettingsDialogProps {
  open: boolean;
  onClose: () => void;
}

interface MicOption {
  deviceId: string;
  label: string;
}

const PRESET_COLORS = [
  { label: "Mist", value: "#9aa7b8" },
  { label: "Fog", value: "#8b9a8c" },
  { label: "Amber", value: "#b8a07a" },
  { label: "Ice", value: "#7f9bb0" },
] as const;

export function SettingsDialog({ open, onClose }: SettingsDialogProps) {
  const appearance = useInvestigationStore((state) => state.overlayAppearance);
  const settings = useInvestigationStore((state) => state.settings);
  const setOverlayAppearance = useInvestigationStore(
    (state) => state.setOverlayAppearance,
  );
  const setInvestigationSettings = useInvestigationStore(
    (state) => state.setInvestigationSettings,
  );

  const theme = usePreferencesStore((state) => state.theme);
  const hotkeys = usePreferencesStore((state) => state.hotkeys);
  const microphone = usePreferencesStore((state) => state.microphone);
  const overlayLayout = usePreferencesStore((state) => state.overlay);
  const setTheme = usePreferencesStore((state) => state.setTheme);
  const setHotkeys = usePreferencesStore((state) => state.setHotkeys);
  const setMicrophone = usePreferencesStore((state) => state.setMicrophone);
  const setOverlayLayout = usePreferencesStore((state) => state.setOverlayLayout);

  const [hexDraft, setHexDraft] = useState(appearance.ghostTextColor);
  const [toggleHotkeyDraft, setToggleHotkeyDraft] = useState(hotkeys.toggleTiming);
  const [micOptions, setMicOptions] = useState<MicOption[]>([]);

  useEffect(() => {
    if (open) {
      setHexDraft(appearance.ghostTextColor);
      setToggleHotkeyDraft(hotkeys.toggleTiming);
    }
  }, [open, appearance.ghostTextColor, hotkeys.toggleTiming]);

  useEffect(() => {
    if (!open) {
      return;
    }

    let cancelled = false;

    async function loadMics(): Promise<void> {
      try {
        await navigator.mediaDevices.getUserMedia({ audio: true });
      } catch {
        // Permission may already be granted or denied; still try enumerate.
      }

      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        if (cancelled) {
          return;
        }
        setMicOptions(
          devices
            .filter((device) => device.kind === "audioinput")
            .map((device, index) => ({
              deviceId: device.deviceId,
              label: device.label || `Microphone ${index + 1}`,
            })),
        );
      } catch (error: unknown) {
        console.warn("Failed to enumerate microphones", error);
      }
    }

    void loadMics();
    return () => {
      cancelled = true;
    };
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.button
            type="button"
            aria-label="Close settings"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-[2px]"
          />

          <motion.dialog
            open
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="fixed left-1/2 top-1/2 z-50 m-0 flex max-h-[min(85vh,720px)] w-[min(calc(100vw-2rem),520px)] -translate-x-1/2 -translate-y-1/2 flex-col rounded-xl border border-zinc-700/80 bg-zinc-900 shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-4">
              <div>
                <h2 className="text-base font-semibold text-zinc-100">
                  Settings
                </h2>
                <p className="text-xs text-zinc-500">
                  Preferences persist across restarts (investigation state does not)
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-md border border-zinc-700/80 px-2.5 py-1 text-xs text-zinc-400 hover:bg-zinc-800"
              >
                Close
              </button>
            </div>

            <div className="space-y-3 overflow-y-auto px-5 py-4">
              <section className="rounded-lg border border-zinc-800/80 bg-zinc-950/50 px-3 py-3">
                <p className="text-sm font-medium text-zinc-200">Theme</p>
                <p className="mt-0.5 text-xs text-zinc-500">
                  Main window color scheme
                </p>
                <fieldset className="mt-3 flex gap-2">
                  {(["dark", "light"] as const).map((option) => (
                    <label
                      key={option}
                      className={`flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-md border px-2.5 py-2 text-sm capitalize ${
                        theme === option
                          ? "border-amber-500/40 bg-amber-500/10 text-amber-100"
                          : "border-zinc-800 bg-zinc-900/40 text-zinc-300"
                      }`}
                    >
                      <input
                        type="radio"
                        name="theme"
                        checked={theme === option}
                        onChange={() => {
                          const next = option as AppTheme;
                          setTheme(next);
                          applyThemeToDocument(next);
                        }}
                        className="accent-amber-400"
                      />
                      {option}
                    </label>
                  ))}
                </fieldset>
              </section>

              <section className="rounded-lg border border-zinc-800/80 bg-zinc-950/50 px-3 py-3">
                <p className="text-sm font-medium text-zinc-200">Voice</p>
                <p className="mt-0.5 text-xs text-zinc-500">
                  Preferred microphone (sidecar currently uses system default;
                  selection is remembered for future routing)
                </p>
                <label className="mt-3 block">
                  <span className="text-[11px] font-medium uppercase tracking-wide text-zinc-500">
                    Microphone
                  </span>
                  <select
                    className="mt-1.5 w-full rounded-md border border-zinc-700/80 bg-zinc-900 px-2.5 py-2 text-sm text-zinc-200 outline-none focus:border-zinc-500"
                    value={microphone.deviceId ?? ""}
                    onChange={(event) => {
                      const deviceId = event.target.value || null;
                      const option = micOptions.find(
                        (entry) => entry.deviceId === deviceId,
                      );
                      setMicrophone({
                        deviceId,
                        label: option?.label ?? null,
                      });
                    }}
                  >
                    <option value="">System default</option>
                    {micOptions.map((option) => (
                      <option key={option.deviceId} value={option.deviceId}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
              </section>

              <section className="rounded-lg border border-zinc-800/80 bg-zinc-950/50 px-3 py-3">
                <p className="text-sm font-medium text-zinc-200">Hotkeys</p>
                <p className="mt-0.5 text-xs text-zinc-500">
                  Global shortcuts (Tauri accelerator syntax)
                </p>
                <label className="mt-3 block">
                  <span className="text-[11px] font-medium uppercase tracking-wide text-zinc-500">
                    Toggle timing
                  </span>
                  <input
                    type="text"
                    value={toggleHotkeyDraft}
                    spellCheck={false}
                    onChange={(event) => setToggleHotkeyDraft(event.target.value)}
                    onBlur={() => {
                      const next = toggleHotkeyDraft.trim();
                      setHotkeys({
                        toggleTiming:
                          next.length > 0
                            ? next
                            : DEFAULT_HOTKEY_PREFERENCES.toggleTiming,
                      });
                      setToggleHotkeyDraft(
                        next.length > 0
                          ? next
                          : DEFAULT_HOTKEY_PREFERENCES.toggleTiming,
                      );
                    }}
                    className="mt-1.5 w-full rounded-md border border-zinc-700/80 bg-zinc-900 px-2.5 py-2 font-mono text-xs text-zinc-200 outline-none focus:border-zinc-500"
                  />
                </label>
                <p className="mt-2 text-[11px] text-zinc-500">
                  Footstep capture stays Space + Numpad 0 while timing is armed
                </p>
                <button
                  type="button"
                  className="mt-2 rounded border border-zinc-700/70 px-2 py-1 text-[11px] text-zinc-400 hover:border-zinc-500 hover:text-zinc-200"
                  onClick={() => {
                    setHotkeys({
                      toggleTiming: DEFAULT_HOTKEY_PREFERENCES.toggleTiming,
                      recordFootstep: [
                        ...DEFAULT_HOTKEY_PREFERENCES.recordFootstep,
                      ],
                    });
                    setToggleHotkeyDraft(DEFAULT_HOTKEY_PREFERENCES.toggleTiming);
                  }}
                >
                  Reset hotkeys
                </button>
              </section>

              <section className="rounded-lg border border-zinc-800/80 bg-zinc-950/50 px-3 py-3">
                <p className="text-sm font-medium text-zinc-200">Windows</p>
                <p className="mt-0.5 text-xs text-zinc-500">
                  Main/overlay geometry is saved automatically when you move or
                  resize. Overlay HUD scale is below.
                </p>
                <div className="mt-4">
                  <div className="flex items-center justify-between gap-2">
                    <label
                      htmlFor="overlay-scale"
                      className="text-[11px] font-medium uppercase tracking-wide text-zinc-500"
                    >
                      Overlay scale
                    </label>
                    <span className="font-mono text-[11px] text-zinc-400">
                      {Math.round(overlayLayout.scale * 100)}%
                    </span>
                  </div>
                  <input
                    id="overlay-scale"
                    type="range"
                    min={OVERLAY_SCALE_MIN}
                    max={OVERLAY_SCALE_MAX}
                    step={0.05}
                    value={overlayLayout.scale}
                    onChange={(event) => {
                      setOverlayLayout({
                        scale: clampOverlayScale(Number(event.target.value)),
                      });
                    }}
                    className="mt-2 w-full accent-zinc-300"
                  />
                </div>
                <button
                  type="button"
                  className="mt-3 rounded border border-zinc-700/70 px-2 py-1 text-[11px] text-zinc-400 hover:border-zinc-500 hover:text-zinc-200"
                  onClick={() => {
                    setOverlayLayout({ scale: 1, geometry: null });
                    void resetOverlayWindowLayout();
                  }}
                >
                  Reset overlay layout
                </button>
              </section>

              <section className="rounded-lg border border-zinc-800/80 bg-zinc-950/50 px-3 py-3">
                <p className="text-sm font-medium text-zinc-200">
                  Ghost Speed Mode
                </p>
                <p className="mt-0.5 text-xs text-zinc-500">
                  Match custom difficulty Ghost Speed so footstep results map to
                  base journal speeds
                </p>

                <fieldset className="mt-3 space-y-1.5">
                  <legend className="sr-only">Ghost speed multiplier</legend>
                  {GHOST_SPEED_MULTIPLIER_OPTIONS.map((option) => {
                    const selected =
                      settings.ghostSpeedMultiplier === option.multiplier;
                    return (
                      <label
                        key={option.id}
                        className={`flex cursor-pointer items-center gap-2.5 rounded-md border px-2.5 py-2 text-sm transition-colors ${
                          selected
                            ? "border-amber-500/40 bg-amber-500/10 text-amber-100"
                            : "border-zinc-800 bg-zinc-900/40 text-zinc-300 hover:border-zinc-700"
                        }`}
                      >
                        <input
                          type="radio"
                          name="ghost-speed-multiplier"
                          value={option.multiplier}
                          checked={selected}
                          onChange={() => {
                            setInvestigationSettings({
                              ghostSpeedMultiplier:
                                option.multiplier as GhostSpeedMultiplier,
                            });
                          }}
                          className="accent-amber-400"
                        />
                        <span>{option.label}</span>
                      </label>
                    );
                  })}
                </fieldset>
              </section>

              <section className="rounded-lg border border-zinc-800/80 bg-zinc-950/50 px-3 py-3">
                <p className="text-sm font-medium text-zinc-200">
                  Timing Result Overlay
                </p>
                <p className="mt-0.5 text-xs text-zinc-500">
                  How long the HUD keeps the finished speed result before fading
                </p>

                <div className="mt-4">
                  <div className="flex items-center justify-between gap-2">
                    <label
                      htmlFor="timing-result-hide"
                      className="text-[11px] font-medium uppercase tracking-wide text-zinc-500"
                    >
                      Hide after
                    </label>
                    <span className="font-mono text-[11px] text-zinc-400">
                      {settings.timingResultHideAfterSeconds}s
                    </span>
                  </div>
                  <input
                    id="timing-result-hide"
                    type="range"
                    min={TIMING_RESULT_HIDE_MIN_SECONDS}
                    max={TIMING_RESULT_HIDE_MAX_SECONDS}
                    step={1}
                    value={settings.timingResultHideAfterSeconds}
                    onChange={(event) => {
                      setInvestigationSettings({
                        timingResultHideAfterSeconds:
                          clampTimingResultHideAfterSeconds(
                            Number(event.target.value),
                          ),
                      });
                    }}
                    className="mt-2 w-full accent-zinc-300"
                  />
                </div>
              </section>

              <section className="rounded-lg border border-zinc-800/80 bg-zinc-950/50 px-3 py-3">
                <p className="text-sm font-medium text-zinc-200">Overlay HUD</p>
                <p className="mt-0.5 text-xs text-zinc-500">
                  Ghost ticker color and scroll speed
                </p>

                <div className="mt-4 space-y-4">
                  <div>
                    <label
                      htmlFor="overlay-ghost-color"
                      className="text-[11px] font-medium uppercase tracking-wide text-zinc-500"
                    >
                      Ghost text color
                    </label>
                    <div className="mt-2 flex items-center gap-3">
                      <input
                        id="overlay-ghost-color"
                        type="color"
                        value={appearance.ghostTextColor}
                        onChange={(event) => {
                          const next = normalizeHexColor(event.target.value);
                          setHexDraft(next);
                          setOverlayAppearance({ ghostTextColor: next });
                        }}
                        className="h-9 w-12 cursor-pointer rounded border border-zinc-700 bg-zinc-900 p-1"
                      />
                      <input
                        type="text"
                        value={hexDraft}
                        spellCheck={false}
                        onChange={(event) => {
                          setHexDraft(event.target.value);
                        }}
                        onBlur={() => {
                          const next = normalizeHexColor(
                            hexDraft,
                            appearance.ghostTextColor,
                          );
                          setHexDraft(next);
                          setOverlayAppearance({ ghostTextColor: next });
                        }}
                        onKeyDown={(event) => {
                          if (event.key === "Enter") {
                            event.currentTarget.blur();
                          }
                        }}
                        className="flex-1 rounded-md border border-zinc-700/80 bg-zinc-900 px-2.5 py-1.5 font-mono text-xs text-zinc-200 outline-none focus:border-zinc-500"
                        aria-label="Ghost text color hex"
                      />
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {PRESET_COLORS.map((preset) => (
                        <button
                          key={preset.value}
                          type="button"
                          onClick={() => {
                            setHexDraft(preset.value);
                            setOverlayAppearance({
                              ghostTextColor: preset.value,
                            });
                          }}
                          className="rounded border border-zinc-700/70 px-2 py-1 text-[11px] text-zinc-400 hover:border-zinc-500 hover:text-zinc-200"
                          style={{
                            boxShadow: `inset 0 -2px 0 ${preset.value}`,
                          }}
                        >
                          {preset.label}
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={() => {
                          setHexDraft(DEFAULT_OVERLAY_APPEARANCE.ghostTextColor);
                          setOverlayAppearance({
                            ...DEFAULT_OVERLAY_APPEARANCE,
                          });
                        }}
                        className="rounded border border-zinc-700/70 px-2 py-1 text-[11px] text-zinc-400 hover:border-zinc-500 hover:text-zinc-200"
                      >
                        Reset
                      </button>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <label
                        htmlFor="overlay-ticker-speed"
                        className="text-[11px] font-medium uppercase tracking-wide text-zinc-500"
                      >
                        Ticker speed
                      </label>
                      <span className="font-mono text-[11px] text-zinc-400">
                        {appearance.tickerSpeedPxPerSec} px/s
                      </span>
                    </div>
                    <input
                      id="overlay-ticker-speed"
                      type="range"
                      min={OVERLAY_TICKER_SPEED_MIN}
                      max={OVERLAY_TICKER_SPEED_MAX}
                      step={1}
                      value={appearance.tickerSpeedPxPerSec}
                      onChange={(event) => {
                        setOverlayAppearance({
                          tickerSpeedPxPerSec: clampTickerSpeed(
                            Number(event.target.value),
                          ),
                        });
                      }}
                      className="mt-2 w-full accent-zinc-300"
                    />
                  </div>
                </div>
              </section>
            </div>
          </motion.dialog>
        </>
      )}
    </AnimatePresence>
  );
}
