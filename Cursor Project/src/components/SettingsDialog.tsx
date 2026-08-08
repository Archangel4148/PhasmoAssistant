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
  const [micStatus, setMicStatus] = useState<"idle" | "loading" | "ready" | "error">(
    "idle",
  );
  const [draftSourceOpen, setDraftSourceOpen] = useState(open);

  if (open !== draftSourceOpen) {
    setDraftSourceOpen(open);
    if (open) {
      setHexDraft(appearance.ghostTextColor);
      setToggleHotkeyDraft(hotkeys.toggleTiming);
    }
  }

  useEffect(() => {
    if (!open) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  useEffect(() => {
    if (!open) {
      return;
    }

    let cancelled = false;

    async function loadMics(): Promise<void> {
      setMicStatus("loading");
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
        setMicStatus("ready");
      } catch (error: unknown) {
        console.warn("Failed to enumerate microphones", error);
        if (!cancelled) {
          setMicStatus("error");
        }
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
            aria-modal="true"
            aria-labelledby="settings-title"
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="fixed left-1/2 top-1/2 z-50 m-0 flex max-h-[min(85vh,720px)] w-[min(calc(100vw-2rem),520px)] -translate-x-1/2 -translate-y-1/2 flex-col rounded-xl border shadow-2xl"
            style={{
              borderColor: "var(--panel-border)",
              background: "var(--panel-bg-solid)",
              color: "var(--text-primary)",
            }}
          >
            <div
              className="flex items-center justify-between border-b px-5 py-4"
              style={{ borderColor: "var(--panel-border)" }}
            >
              <div>
                <h2
                  id="settings-title"
                  className="text-base font-semibold"
                  style={{ color: "var(--text-primary)" }}
                >
                  Settings
                </h2>
                <p className="text-xs" style={{ color: "var(--text-faint)" }}>
                  Preferences persist across restarts (investigation state does not)
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="btn-ghost focus-ring px-2.5 py-1 text-xs"
              >
                Close
              </button>
            </div>

            <div className="space-y-3 overflow-y-auto px-5 py-4">
              <section className="inset-block px-3 py-3">
                <p className="text-sm font-medium text-[var(--text-secondary)]">Theme</p>
                <p className="mt-0.5 text-xs text-[var(--text-faint)]">
                  Main window color scheme
                </p>
                <fieldset className="mt-3 flex gap-2">
                  {(["dark", "light"] as const).map((option) => (
                    <label
                      key={option}
                      className={`flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-md border px-2.5 py-2 text-sm capitalize ${
                        theme === option
                          ? "border-[var(--accent-border)] bg-[var(--accent-soft)] text-[var(--accent-strong)]"
                          : "border-[var(--panel-border)] bg-[var(--inset-bg)] text-[var(--text-secondary)]"
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
                        className="accent-[var(--accent)]"
                      />
                      {option}
                    </label>
                  ))}
                </fieldset>
              </section>

              <section className="inset-block px-3 py-3">
                <p className="text-sm font-medium text-[var(--text-secondary)]">Voice</p>
                <p className="mt-0.5 text-xs text-[var(--text-faint)]">
                  Preferred microphone (sidecar currently uses system default;
                  selection is remembered for future routing)
                </p>
                <label className="mt-3 block">
                  <span className="text-[11px] font-medium uppercase tracking-[0.08em] text-[var(--text-faint)]">
                    Microphone
                  </span>
                  <select
                    className="focus-ring mt-1.5 w-full rounded-md border px-2.5 py-2 text-sm outline-none"
                    style={{
                      borderColor: "var(--panel-border)",
                      background: "var(--inset-bg)",
                      color: "var(--text-primary)",
                    }}
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
                  <p
                    className="mt-1.5 text-[11px]"
                    style={{
                      color:
                        micStatus === "error"
                          ? "var(--danger)"
                          : "var(--text-faint)",
                    }}
                  >
                    {micStatus === "loading"
                      ? "Detecting microphones…"
                      : micStatus === "error"
                        ? "Could not list microphones. System default remains available."
                        : micOptions.length === 0
                          ? "No named devices found yet — system default still works."
                          : `${micOptions.length} input device${micOptions.length === 1 ? "" : "s"} available.`}
                  </p>
                </label>
              </section>

              <section className="inset-block px-3 py-3">
                <p className="text-sm font-medium text-[var(--text-secondary)]">Hotkeys</p>
                <p className="mt-0.5 text-xs text-[var(--text-faint)]">
                  Global shortcuts (Tauri accelerator syntax)
                </p>
                <label className="mt-3 block">
                  <span className="text-[11px] font-medium uppercase tracking-[0.08em] text-[var(--text-faint)]">
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
                    className="mt-1.5 w-full rounded-md focus-ring border border-[var(--panel-border)] bg-[var(--inset-bg)] px-2.5 py-2 font-mono text-xs text-[var(--text-primary)] outline-none"
                  />
                </label>
                <p className="mt-2 text-[11px] text-[var(--text-faint)]">
                  Footstep capture stays Space + Numpad 0 while timing is armed
                </p>
                <button
                  type="button"
                  className="btn-ghost focus-ring mt-2 px-2 py-1 text-[11px]"
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

              <section className="inset-block px-3 py-3">
                <p className="text-sm font-medium text-[var(--text-secondary)]">Windows</p>
                <p className="mt-0.5 text-xs text-[var(--text-faint)]">
                  Main/overlay geometry is saved automatically when you move or
                  resize. Overlay HUD scale is below.
                </p>
                <div className="mt-4">
                  <div className="flex items-center justify-between gap-2">
                    <label
                      htmlFor="overlay-scale"
                      className="text-[11px] font-medium uppercase tracking-[0.08em] text-[var(--text-faint)]"
                    >
                      Overlay scale
                    </label>
                    <span className="font-mono text-[11px] text-[var(--text-muted)]">
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
                    className="mt-2 w-full accent-[var(--accent)]"
                  />
                </div>
                <button
                  type="button"
                  className="btn-ghost focus-ring mt-3 px-2 py-1 text-[11px]"
                  onClick={() => {
                    setOverlayLayout({ scale: 1, geometry: null });
                    void resetOverlayWindowLayout();
                  }}
                >
                  Reset overlay layout
                </button>
              </section>

              <section className="inset-block px-3 py-3">
                <p className="text-sm font-medium text-[var(--text-secondary)]">
                  Ghost Speed Mode
                </p>
                <p className="mt-0.5 text-xs text-[var(--text-faint)]">
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
                            ? "border-[var(--accent-border)] bg-[var(--accent-soft)] text-[var(--accent-strong)]"
                            : "border-[var(--panel-border)] bg-[var(--inset-bg)] text-[var(--text-secondary)] hover:border-[color-mix(in_srgb,var(--text-faint)_55%,transparent)]"
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
                          className="accent-[var(--accent)]"
                        />
                        <span>{option.label}</span>
                      </label>
                    );
                  })}
                </fieldset>
              </section>

              <section className="inset-block px-3 py-3">
                <p className="text-sm font-medium text-[var(--text-secondary)]">
                  Timing Result Overlay
                </p>
                <p className="mt-0.5 text-xs text-[var(--text-faint)]">
                  How long the HUD keeps the finished speed result before fading
                </p>

                <div className="mt-4">
                  <div className="flex items-center justify-between gap-2">
                    <label
                      htmlFor="timing-result-hide"
                      className="text-[11px] font-medium uppercase tracking-[0.08em] text-[var(--text-faint)]"
                    >
                      Hide after
                    </label>
                    <span className="font-mono text-[11px] text-[var(--text-muted)]">
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
                    className="mt-2 w-full accent-[var(--accent)]"
                  />
                </div>
              </section>

              <section className="inset-block px-3 py-3">
                <p className="text-sm font-medium text-[var(--text-secondary)]">Overlay HUD</p>
                <p className="mt-0.5 text-xs text-[var(--text-faint)]">
                  Ghost ticker color and scroll speed
                </p>

                <div className="mt-4 space-y-4">
                  <div>
                    <label
                      htmlFor="overlay-ghost-color"
                      className="text-[11px] font-medium uppercase tracking-[0.08em] text-[var(--text-faint)]"
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
                        className="h-9 w-12 cursor-pointer rounded border border-[var(--panel-border)] bg-[var(--inset-bg)] p-1"
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
                        className="focus-ring flex-1 rounded-md border border-[var(--panel-border)] bg-[var(--inset-bg)] px-2.5 py-1.5 font-mono text-xs text-[var(--text-primary)] outline-none"
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
                          className="btn-ghost focus-ring px-2 py-1 text-[11px]"
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
                        className="btn-ghost focus-ring px-2 py-1 text-[11px]"
                      >
                        Reset
                      </button>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <label
                        htmlFor="overlay-ticker-speed"
                        className="text-[11px] font-medium uppercase tracking-[0.08em] text-[var(--text-faint)]"
                      >
                        Ticker speed
                      </label>
                      <span className="font-mono text-[11px] text-[var(--text-muted)]">
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
                      className="mt-2 w-full accent-[var(--accent)]"
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
