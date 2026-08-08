import { useEffect } from "react";
import {
  fetchInvestigationSnapshot,
  publishInvestigationSnapshot,
  subscribeInvestigationSnapshot,
} from "../services/investigationSync";
import { useInvestigationStore } from "../state/investigationStore";
import { usePreferencesStore } from "../state/preferencesStore";
import { useVoiceDiagnosticsStore } from "../state/voiceDiagnosticsStore";
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

function reportSyncError(message: string): void {
  useVoiceDiagnosticsStore.getState().reportAppWarning(message);
}

/** Main window: publish local mutations to Rust for Overlay consumers. */
export function useMainInvestigationSync(): void {
  useEffect(() => {
    let cancelled = false;
    let publishing = false;

    const enablePublisher = (): void => {
      if (cancelled || publishing) {
        return;
      }
      if (!usePreferencesStore.getState().hydrated) {
        return;
      }

      publishing = true;
      useInvestigationStore.getState().setSyncPublisher(true);
      void publishInvestigationSnapshot(toSnapshotFromStore()).catch(
        (error: unknown) => {
          console.error("Failed to publish initial investigation snapshot", error);
          reportSyncError(
            "Failed to sync investigation state to the overlay. UI remains usable.",
          );
        },
      );
    };

    enablePublisher();
    const unsubscribe = usePreferencesStore.subscribe((state) => {
      if (state.hydrated) {
        enablePublisher();
      }
    });

    return () => {
      cancelled = true;
      unsubscribe();
      if (publishing) {
        useInvestigationStore.getState().setSyncPublisher(false);
      }
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
        reportSyncError(
          "Overlay lost investigation sync. Open the Main window or restart the app.",
        );
      }
    }

    void bootstrap();

    return () => {
      cancelled = true;
      unlisten?.();
    };
  }, []);
}
