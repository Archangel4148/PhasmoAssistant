import { useEffect } from "react";
import {
  fetchSidecarStatus,
  subscribeSidecarError,
  subscribeVoiceCommand,
  subscribeVoiceStatus,
} from "../services/sidecarApi";
import { useVoiceDiagnosticsStore } from "../state/voiceDiagnosticsStore";

/**
 * Main window: subscribe to Rust sidecar events for Diagnostics / header.
 * Guarded against React StrictMode double-mount so async listeners are not leaked.
 */
export function useVoiceSidecarBridge(): void {
  useEffect(() => {
    let cancelled = false;
    const unlisteners: Array<() => void> = [];

    function track(unlisten: () => void): void {
      if (cancelled) {
        unlisten();
        return;
      }
      unlisteners.push(unlisten);
    }

    async function bootstrap(): Promise<void> {
      try {
        const status = await fetchSidecarStatus();
        if (cancelled) {
          return;
        }
        useVoiceDiagnosticsStore.getState().applyRuntimeStatus(status);

        track(
          await subscribeVoiceStatus((payload) => {
            useVoiceDiagnosticsStore.getState().applyVoiceStatus(payload);
          }),
        );
        track(
          await subscribeVoiceCommand((payload) => {
            // Phase 5: log only. Phase 6 applies commands to investigation state.
            useVoiceDiagnosticsStore.getState().applyVoiceCommand(payload);
          }),
        );
        track(
          await subscribeSidecarError((payload) => {
            useVoiceDiagnosticsStore.getState().applySidecarError(payload);
          }),
        );
      } catch (error: unknown) {
        console.error("Failed to bridge voice sidecar events", error);
        if (!cancelled) {
          useVoiceDiagnosticsStore.getState().applySidecarError({
            message:
              error instanceof Error
                ? error.message
                : "Failed to connect to voice sidecar bridge",
            recoverable: true,
          });
        }
      }
    }

    void bootstrap();

    return () => {
      cancelled = true;
      for (const unlisten of unlisteners) {
        unlisten();
      }
      unlisteners.length = 0;
    };
  }, []);
}
