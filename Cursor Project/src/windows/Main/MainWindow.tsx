import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { DiagnosticsPanel } from "../../components/DiagnosticsPanel";
import { ErrorBoundary } from "../../components/ErrorBoundary";
import { EvidencePanel } from "../../components/EvidencePanel";
import { GhostPanel } from "../../components/GhostPanel";
import { Header } from "../../components/Header";
import { InvestigationToolsPanel } from "../../components/InvestigationToolsPanel";
import { SettingsDialog } from "../../components/SettingsDialog";
import { VoicePhrasesPanel } from "../../components/VoicePhrasesPanel";
import { useMainInvestigationSync } from "../../hooks/useInvestigationSync";
import { usePreferencesBootstrap } from "../../hooks/usePreferencesBootstrap";
import { useTimingHotkeys } from "../../hooks/useTimingHotkeys";
import { useVoiceSidecarBridge } from "../../hooks/useVoiceSidecarBridge";
import { restartVoiceSidecar, stopVoiceSidecar } from "../../services/sidecarApi";
import { useInvestigationStore } from "../../state/investigationStore";
import { usePreferencesStore } from "../../state/preferencesStore";
import { useVoiceDiagnosticsStore } from "../../state/voiceDiagnosticsStore";
import type { DiagnosticsSnapshot } from "../../types/diagnostics";

export function MainWindow() {
  usePreferencesBootstrap("main");
  useMainInvestigationSync();
  useTimingHotkeys(true);
  useVoiceSidecarBridge();

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [voicePhrasesOpen, setVoicePhrasesOpen] = useState(false);
  const [restartPending, setRestartPending] = useState(false);

  const evidenceEntries = useInvestigationStore((state) => state.evidenceEntries);
  const ghosts = useInvestigationStore((state) => state.ghosts);
  const possibleGhostCount = useInvestigationStore(
    (state) => state.possibleGhostCount,
  );
  const evidenceDifficulty = useInvestigationStore(
    (state) => state.settings.evidenceDifficulty,
  );
  const cycleEvidence = useInvestigationStore((state) => state.cycleEvidence);
  const resetInvestigation = useInvestigationStore(
    (state) => state.resetInvestigation,
  );
  const toggleGhostEliminated = useInvestigationStore(
    (state) => state.toggleGhostEliminated,
  );

  const microphone = usePreferencesStore((state) => state.microphone);
  const prefsHydrated = usePreferencesStore((state) => state.hydrated);
  const appliedPreferredMic = useRef(false);

  const voiceStatus = useVoiceDiagnosticsStore((state) => state.voiceStatus);
  const sidecarStatus = useVoiceDiagnosticsStore((state) => state.sidecarStatus);
  const lastError = useVoiceDiagnosticsStore((state) => state.lastError);
  const recentVoiceEvents = useVoiceDiagnosticsStore(
    (state) => state.recentVoiceEvents,
  );
  const usingMock = useVoiceDiagnosticsStore((state) => state.usingMock);
  const applyRuntimeStatus = useVoiceDiagnosticsStore(
    (state) => state.applyRuntimeStatus,
  );
  const applySidecarError = useVoiceDiagnosticsStore(
    (state) => state.applySidecarError,
  );

  // After prefs hydrate, apply remembered mic / voice enabled state once.
  useEffect(() => {
    if (!prefsHydrated || appliedPreferredMic.current) {
      return;
    }
    appliedPreferredMic.current = true;

    if (!microphone.enabled) {
      void stopVoiceSidecar()
        .then((status) => {
          applyRuntimeStatus(status);
        })
        .catch((error: unknown) => {
          console.warn("Failed to stop voice sidecar", error);
        });
      return;
    }

    if (!microphone.label) {
      return;
    }

    void restartVoiceSidecar(microphone.label)
      .then((status) => {
        applyRuntimeStatus(status);
      })
      .catch((error: unknown) => {
        console.warn("Failed to apply preferred microphone to sidecar", error);
      });
  }, [prefsHydrated, microphone.enabled, microphone.label, applyRuntimeStatus]);

  const diagnostics: DiagnosticsSnapshot = {
    sidecarStatus,
    microphoneLabel: !microphone.enabled
      ? "Voice disabled"
      : usingMock
        ? "Mock listener (no mic)"
        : (microphone.label ?? "System default input"),
    microphoneAvailable:
      microphone.enabled && !usingMock && voiceStatus === "listening",
    voiceStatus,
    recentVoiceEvents,
    lastError,
  };

  async function handleRestartSidecar(): Promise<void> {
    setRestartPending(true);
    try {
      if (!microphone.enabled) {
        const status = await stopVoiceSidecar();
        applyRuntimeStatus(status);
        return;
      }
      const status = await restartVoiceSidecar(microphone.label);
      applyRuntimeStatus(status);
    } catch (error: unknown) {
      applySidecarError({
        message:
          error instanceof Error
            ? error.message
            : "Failed to restart voice sidecar",
        recoverable: true,
      });
    } finally {
      setRestartPending(false);
    }
  }

  return (
    <div
      className="flex min-h-screen flex-col"
      style={{ background: "var(--app-bg)" }}
    >
      <Header
        voiceStatus={voiceStatus}
        possibleGhostCount={possibleGhostCount}
        onOpenSettings={() => setSettingsOpen(true)}
        onResetInvestigation={resetInvestigation}
      />

      <motion.main
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className="flex flex-1 flex-col gap-4 p-4 lg:p-6"
      >
        <div className="grid flex-1 gap-4 xl:grid-cols-12">
          <div className="flex flex-col gap-4 xl:col-span-3">
            <ErrorBoundary fallbackTitle="Evidence panel error">
              <EvidencePanel
                evidence={evidenceEntries}
                onEvidenceCycle={cycleEvidence}
                evidenceDisabled={evidenceDifficulty === "apocalypse"}
              />
            </ErrorBoundary>
            <ErrorBoundary fallbackTitle="Tools panel error">
              <InvestigationToolsPanel />
            </ErrorBoundary>
          </div>

          <div className="xl:col-span-6">
            <ErrorBoundary fallbackTitle="Ghost panel error">
              <GhostPanel
                ghosts={ghosts}
                evidenceEntries={evidenceEntries}
                onToggleGhostEliminated={toggleGhostEliminated}
              />
            </ErrorBoundary>
          </div>

          <div className="xl:col-span-3">
            <ErrorBoundary fallbackTitle="Diagnostics panel error">
              <DiagnosticsPanel
                diagnostics={diagnostics}
                usingMock={usingMock}
                restartPending={restartPending}
                onRestartSidecar={() => {
                  void handleRestartSidecar();
                }}
                onShowVoicePhrases={() => setVoicePhrasesOpen(true)}
              />
            </ErrorBoundary>
          </div>
        </div>
      </motion.main>

      <SettingsDialog
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />
      <VoicePhrasesPanel
        open={voicePhrasesOpen}
        onClose={() => setVoicePhrasesOpen(false)}
      />
    </div>
  );
}
