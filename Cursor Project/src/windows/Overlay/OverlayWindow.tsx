import { useEffect, useMemo, useState } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { OverlayGhostList } from "./OverlayGhostList";
import { OverlayTimers } from "./OverlayTimers";
import { OverlayTimingIndicator } from "./OverlayTimingIndicator";
import { OverlayToasts } from "./OverlayToasts";
import {
  calculateFootstepSpeed,
  compareSpeedToPossibleGhosts,
} from "../../domain/speed";
import { useOverlayInvestigationSync } from "../../hooks/useInvestigationSync";
import { usePreferencesBootstrap } from "../../hooks/usePreferencesBootstrap";
import { setOverlayInteractive } from "../../services/overlayWindow";
import { useInvestigationStore } from "../../state/investigationStore";

type OverlayResizeDirection =
  | "East"
  | "North"
  | "NorthEast"
  | "NorthWest"
  | "South"
  | "SouthEast"
  | "SouthWest"
  | "West";

const RESIZE_HANDLES: Array<{
  direction: OverlayResizeDirection;
  className: string;
}> = [
  { direction: "NorthWest", className: "left-0 top-0 h-3 w-3 cursor-nwse-resize" },
  {
    direction: "North",
    className: "left-3 right-3 top-0 h-3 cursor-ns-resize",
  },
  {
    direction: "NorthEast",
    className: "right-0 top-0 h-3 w-3 cursor-nesw-resize",
  },
  {
    direction: "East",
    className: "bottom-3 right-0 top-3 w-3 cursor-ew-resize",
  },
  {
    direction: "SouthEast",
    className: "bottom-0 right-0 h-3 w-3 cursor-nwse-resize",
  },
  {
    direction: "South",
    className: "bottom-0 left-3 right-3 h-3 cursor-ns-resize",
  },
  {
    direction: "SouthWest",
    className: "bottom-0 left-0 h-3 w-3 cursor-nesw-resize",
  },
  {
    direction: "West",
    className: "bottom-3 left-0 top-3 w-3 cursor-ew-resize",
  },
];

export function OverlayWindow() {
  usePreferencesBootstrap("overlay");
  useOverlayInvestigationSync();

  const ghosts = useInvestigationStore((state) => state.ghosts);
  const timingMode = useInvestigationStore((state) => state.timingMode);
  const timingTimestampsMs = useInvestigationStore(
    (state) => state.timingTimestampsMs,
  );
  const timingResultCompletedAtMs = useInvestigationStore(
    (state) => state.timingResultCompletedAtMs,
  );
  const currentGhostSpeedMps = useInvestigationStore(
    (state) => state.currentGhostSpeedMps,
  );
  const smudgeTimer = useInvestigationStore((state) => state.smudgeTimer);
  const huntTimer = useInvestigationStore((state) => state.huntTimer);
  const toasts = useInvestigationStore((state) => state.toasts);
  const overlayAppearance = useInvestigationStore(
    (state) => state.overlayAppearance,
  );
  const settings = useInvestigationStore((state) => state.settings);

  const speedResult = useMemo(
    () =>
      calculateFootstepSpeed(timingTimestampsMs, {
        ghostSpeedMultiplier: settings.ghostSpeedMultiplier,
      }),
    [timingTimestampsMs, settings.ghostSpeedMultiplier],
  );
  const closeMatches = useMemo(
    () =>
      compareSpeedToPossibleGhosts(currentGhostSpeedMps, ghosts).filter(
        (match) => match.isClose,
      ),
    [currentGhostSpeedMps, ghosts],
  );

  const hasResult =
    timingTimestampsMs.length > 0 || currentGhostSpeedMps !== null;
  const [hiddenForCompletedAt, setHiddenForCompletedAt] = useState<
    number | null
  >(null);

  useEffect(() => {
    if (
      timingMode ||
      timingResultCompletedAtMs === null ||
      !hasResult
    ) {
      return;
    }

    const hideAfterMs = settings.timingResultHideAfterSeconds * 1000;
    const remaining = timingResultCompletedAtMs + hideAfterMs - Date.now();
    const completedAt = timingResultCompletedAtMs;
    const id = window.setTimeout(
      () => {
        setHiddenForCompletedAt(completedAt);
      },
      Math.max(0, remaining),
    );
    return () => {
      window.clearTimeout(id);
    };
  }, [
    timingMode,
    timingResultCompletedAtMs,
    hasResult,
    settings.timingResultHideAfterSeconds,
  ]);

  useEffect(() => {
    void setOverlayInteractive(overlayAppearance.layoutEditMode).catch(
      (error: unknown) => {
        console.warn("Failed to update overlay interactivity", error);
      },
    );
  }, [overlayAppearance.layoutEditMode]);

  const resultHidden =
    !timingMode &&
    timingResultCompletedAtMs !== null &&
    hiddenForCompletedAt === timingResultCompletedAtMs;
  const timingVisible = timingMode || (hasResult && !resultHidden);
  const editing = overlayAppearance.layoutEditMode;
  const hudScale = overlayAppearance.hudScale;

  return (
    <div
      className={`relative h-screen w-screen overflow-hidden bg-transparent text-zinc-100 ${
        editing ? "pointer-events-auto" : "pointer-events-none"
      }`}
    >
      {editing ? (
        <>
          <div
            className="absolute inset-x-0 top-0 z-50 flex cursor-move items-center justify-between border-b border-amber-400/40 bg-black/70 px-4 py-2 text-xs text-amber-100 backdrop-blur-sm"
            onMouseDown={(event) => {
              if (event.button !== 0) {
                return;
              }
              event.preventDefault();
              const window = getCurrentWindow();
              if (event.detail === 2) {
                void window.toggleMaximize().catch((error: unknown) => {
                  console.warn("Overlay maximize toggle failed", error);
                });
                return;
              }
              void window.startDragging().catch((error: unknown) => {
                console.warn("Overlay drag failed", error);
              });
            }}
          >
            <p>
              Overlay layout edit — drag to move · double-click to maximize ·
              drag edges to resize · finish from Settings
            </p>
          </div>
          {RESIZE_HANDLES.map((handle) => (
            <button
              key={handle.direction}
              type="button"
              aria-label={`Resize ${handle.direction}`}
              className={`absolute z-40 bg-amber-300/40 ${handle.className}`}
              onMouseDown={(event) => {
                if (event.button !== 0) {
                  return;
                }
                event.preventDefault();
                event.stopPropagation();
                void getCurrentWindow()
                  .startResizeDragging(handle.direction)
                  .catch((error: unknown) => {
                    console.warn("Overlay resize failed", error);
                  });
              }}
            />
          ))}
        </>
      ) : null}

      {/*
        Scale via layout box /scale so HUD stays inside the window instead of
        visually overflowing when hudScale > 1.
      */}
      <div
        className={`absolute left-0 top-0 origin-top-left ${
          editing ? "pt-9" : ""
        }`}
        style={{
          width: `${100 / hudScale}%`,
          height: `${100 / hudScale}%`,
          transform: `scale(${hudScale})`,
        }}
      >
        {overlayAppearance.showGhosts ? (
          <div className="absolute left-4 right-40 top-4">
            <OverlayGhostList
              ghosts={ghosts}
              textColor={overlayAppearance.ghostTextColor}
              tickerSpeedPxPerSec={overlayAppearance.tickerSpeedPxPerSec}
            />
          </div>
        ) : null}

        <div className="absolute right-4 top-4 flex flex-col items-end gap-2">
          {overlayAppearance.showTimers ? (
            <OverlayTimers smudgeTimer={smudgeTimer} huntTimer={huntTimer} />
          ) : null}
          {overlayAppearance.showTiming ? (
            <OverlayTimingIndicator
              active={timingMode}
              visible={timingVisible}
              speedMps={currentGhostSpeedMps}
              observedSpeedMps={speedResult.observedMetersPerSecond}
              beatsPerMinute={speedResult.beatsPerMinute}
              stepCount={timingTimestampsMs.length}
              ghostSpeedMultiplier={settings.ghostSpeedMultiplier}
              closeMatches={closeMatches}
            />
          ) : null}
        </div>

        {overlayAppearance.showToasts ? (
          <div className="absolute bottom-8 right-6">
            <OverlayToasts toasts={toasts} />
          </div>
        ) : null}
      </div>
    </div>
  );
}
