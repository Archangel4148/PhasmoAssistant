import { useEffect, useMemo, useState } from "react";
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
import { useInvestigationStore } from "../../state/investigationStore";
import { usePreferencesStore } from "../../state/preferencesStore";

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
  const overlayScale = usePreferencesStore((state) => state.overlay.scale);

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

  const resultHidden =
    !timingMode &&
    timingResultCompletedAtMs !== null &&
    hiddenForCompletedAt === timingResultCompletedAtMs;
  const timingVisible = timingMode || (hasResult && !resultHidden);

  return (
    <div className="pointer-events-none relative h-screen w-screen overflow-hidden bg-transparent text-zinc-100">
      <div
        className="absolute inset-0 origin-top-right"
        style={{ transform: `scale(${overlayScale})` }}
      >
        <div className="absolute left-4 right-40 top-4">
          <OverlayGhostList
            ghosts={ghosts}
            textColor={overlayAppearance.ghostTextColor}
            tickerSpeedPxPerSec={overlayAppearance.tickerSpeedPxPerSec}
          />
        </div>

        <div className="absolute right-4 top-4 flex flex-col items-end gap-2">
          <OverlayTimers smudgeTimer={smudgeTimer} huntTimer={huntTimer} />
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
        </div>

        <div className="absolute bottom-8 right-6">
          <OverlayToasts toasts={toasts} />
        </div>
      </div>
    </div>
  );
}
