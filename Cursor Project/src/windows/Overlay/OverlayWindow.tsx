import { OverlayGhostList } from "./OverlayGhostList";
import { OverlayTimers } from "./OverlayTimers";
import { OverlayTimingIndicator } from "./OverlayTimingIndicator";
import { OverlayToasts } from "./OverlayToasts";
import { useOverlayInvestigationSync } from "../../hooks/useInvestigationSync";
import { useInvestigationStore } from "../../state/investigationStore";

export function OverlayWindow() {
  useOverlayInvestigationSync();

  const ghosts = useInvestigationStore((state) => state.ghosts);
  const timingMode = useInvestigationStore((state) => state.timingMode);
  const smudgeRemainingSeconds = useInvestigationStore(
    (state) => state.smudgeRemainingSeconds,
  );
  const huntRemainingSeconds = useInvestigationStore(
    (state) => state.huntRemainingSeconds,
  );
  const toasts = useInvestigationStore((state) => state.toasts);
  const overlayAppearance = useInvestigationStore(
    (state) => state.overlayAppearance,
  );

  return (
    <div className="pointer-events-none relative h-screen w-screen overflow-hidden bg-transparent text-zinc-100">
      <div className="absolute left-4 right-40 top-4">
        <OverlayGhostList
          ghosts={ghosts}
          textColor={overlayAppearance.ghostTextColor}
          tickerSpeedPxPerSec={overlayAppearance.tickerSpeedPxPerSec}
        />
      </div>

      <div className="absolute right-4 top-4">
        <OverlayTimers
          smudgeRemainingSeconds={smudgeRemainingSeconds}
          huntRemainingSeconds={huntRemainingSeconds}
        />
      </div>

      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        <OverlayTimingIndicator active={timingMode} />
      </div>

      <div className="absolute bottom-8 right-6">
        <OverlayToasts toasts={toasts} />
      </div>
    </div>
  );
}
