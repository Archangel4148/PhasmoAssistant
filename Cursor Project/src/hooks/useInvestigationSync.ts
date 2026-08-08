import { useEffect } from "react";
import {
  fetchInvestigationSnapshot,
  publishInvestigationSnapshot,
  subscribeInvestigationSnapshot,
} from "../services/investigationSync";
import { useInvestigationStore } from "../state/investigationStore";
import type { InvestigationSnapshot } from "../types/sync";

function toSnapshotFromStore(): InvestigationSnapshot {
  const state = useInvestigationStore.getState();
  return {
    evidence: state.evidence,
    eliminatedGhostIds: state.eliminatedGhostIds,
    timingMode: state.timingMode,
    timingTimestampsMs: state.timingTimestampsMs,
    timingResultCompletedAtMs: state.timingResultCompletedAtMs,
    smudgeTimer: state.smudgeTimer,
    huntTimer: state.huntTimer,
    toasts: state.toasts,
    overlayAppearance: state.overlayAppearance,
    settings: state.settings,
  };
}

/** Main window: publish local mutations to Rust for Overlay consumers. */
export function useMainInvestigationSync(): void {
  useEffect(() => {
    useInvestigationStore.getState().setSyncPublisher(true);

    void publishInvestigationSnapshot(toSnapshotFromStore()).catch(
      (error: unknown) => {
        console.error("Failed to publish initial investigation snapshot", error);
      },
    );

    return () => {
      useInvestigationStore.getState().setSyncPublisher(false);
    };
  }, []);
}

/** Overlay window: hydrate from Rust and stay subscribed to state_changed. */
export function useOverlayInvestigationSync(): void {
  useEffect(() => {
    let cancelled = false;
    let unlisten: (() => void) | undefined;

    async function bootstrap(): Promise<void> {
      try {
        const snapshot = await fetchInvestigationSnapshot();
        if (!cancelled) {
          useInvestigationStore.getState().hydrateFromSnapshot(snapshot);
        }

        unlisten = await subscribeInvestigationSnapshot((next) => {
          useInvestigationStore.getState().hydrateFromSnapshot(next);
        });
        if (cancelled) {
          unlisten();
          unlisten = undefined;
        }
      } catch (error: unknown) {
        console.error("Failed to sync overlay investigation state", error);
      }
    }

    void bootstrap();

    return () => {
      cancelled = true;
      unlisten?.();
    };
  }, []);
}
