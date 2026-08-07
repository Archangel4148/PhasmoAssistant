import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useInvestigationStore } from "../state/investigationStore";
import {
  clampTickerSpeed,
  DEFAULT_OVERLAY_APPEARANCE,
  normalizeHexColor,
  OVERLAY_TICKER_SPEED_MAX,
  OVERLAY_TICKER_SPEED_MIN,
} from "../types/overlayAppearance";

interface SettingsDialogProps {
  open: boolean;
  onClose: () => void;
}

const PLACEHOLDER_SECTIONS = [
  {
    title: "Voice",
    description: "Microphone selection and sidecar controls",
  },
  {
    title: "Hotkeys",
    description: "Global shortcut configuration",
  },
  {
    title: "Windows",
    description: "Main and overlay geometry persistence",
  },
] as const;

const PRESET_COLORS = [
  { label: "Mist", value: "#9aa7b8" },
  { label: "Fog", value: "#8b9a8c" },
  { label: "Amber", value: "#b8a07a" },
  { label: "Ice", value: "#7f9bb0" },
] as const;

export function SettingsDialog({ open, onClose }: SettingsDialogProps) {
  const appearance = useInvestigationStore((state) => state.overlayAppearance);
  const setOverlayAppearance = useInvestigationStore(
    (state) => state.setOverlayAppearance,
  );
  const [hexDraft, setHexDraft] = useState(appearance.ghostTextColor);

  useEffect(() => {
    if (open) {
      setHexDraft(appearance.ghostTextColor);
    }
  }, [open, appearance.ghostTextColor]);

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
            className="fixed left-1/2 top-1/2 z-50 m-0 flex max-h-[min(80vh,640px)] w-[min(calc(100vw-2rem),480px)] -translate-x-1/2 -translate-y-1/2 flex-col rounded-xl border border-zinc-700/80 bg-zinc-900 shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-4">
              <div>
                <h2 className="text-base font-semibold text-zinc-100">
                  Settings
                </h2>
                <p className="text-xs text-zinc-500">
                  Overlay appearance syncs live to the HUD
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

            <div className="overflow-y-auto px-5 py-4">
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
                    <div className="mt-2 flex items-center gap-2">
                      <input
                        type="number"
                        min={OVERLAY_TICKER_SPEED_MIN}
                        max={OVERLAY_TICKER_SPEED_MAX}
                        value={appearance.tickerSpeedPxPerSec}
                        onChange={(event) => {
                          setOverlayAppearance({
                            tickerSpeedPxPerSec: clampTickerSpeed(
                              Number(event.target.value),
                            ),
                          });
                        }}
                        className="w-20 rounded-md border border-zinc-700/80 bg-zinc-900 px-2 py-1 font-mono text-xs text-zinc-200 outline-none focus:border-zinc-500"
                        aria-label="Ticker speed in pixels per second"
                      />
                      <span className="text-[11px] text-zinc-500">
                        {OVERLAY_TICKER_SPEED_MIN}–{OVERLAY_TICKER_SPEED_MAX}{" "}
                        px/s · lower is calmer
                      </span>
                    </div>
                  </div>
                </div>
              </section>

              <ul className="mt-3 space-y-2">
                {PLACEHOLDER_SECTIONS.map((section) => (
                  <li
                    key={section.title}
                    className="rounded-lg border border-zinc-800/80 bg-zinc-950/50 px-3 py-3"
                  >
                    <p className="text-sm font-medium text-zinc-200">
                      {section.title}
                    </p>
                    <p className="mt-0.5 text-xs text-zinc-500">
                      {section.description}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          </motion.dialog>
        </>
      )}
    </AnimatePresence>
  );
}
