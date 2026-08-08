import { OverlayGhostList } from "./OverlayGhostList";
import { OverlayTimers } from "./OverlayTimers";
import { OverlayTimingIndicator } from "./OverlayTimingIndicator";
import { OverlayToasts } from "./OverlayToasts";
import {
  calculateFootstepSpeed,
  compareSpeedToPossibleGhosts,
} from "../../domain/speed";
import { useClock } from "../../hooks/useClock";
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

  const speedResult = calculateFootstepSpeed(timingTimestampsMs, {
    ghostSpeedMultiplier: settings.ghostSpeedMultiplier,
  });
  const closeMatches = compareSpeedToPossibleGhosts(
    currentGhostSpeedMps,
    ghosts,
  ).filter((match) => match.isClose);

  const hasResult =
    timingTimestampsMs.length > 0 || currentGhostSpeedMps !== null;
  const watchingHide =
    !timingMode &&
    timingResultCompletedAtMs !== null &&
    hasResult;
  const nowMs = useClock(watchingHide);
  const hideAfterMs = settings.timingResultHideAfterSeconds * 1000;
  const fadedOut =
    watchingHide &&
    timingResultCompletedAtMs !== null &&
    nowMs >= timingResultCompletedAtMs + hideAfterMs;
  const timingVisible = timingMode || (hasResult && !fadedOut);

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
