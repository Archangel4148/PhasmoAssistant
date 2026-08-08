import { useState } from "react";
import { motion } from "framer-motion";
import { DiagnosticsPanel } from "../../components/DiagnosticsPanel";
import { EvidencePanel } from "../../components/EvidencePanel";
import { GhostPanel } from "../../components/GhostPanel";
import { Header } from "../../components/Header";
import { InvestigationToolsPanel } from "../../components/InvestigationToolsPanel";
import { SettingsDialog } from "../../components/SettingsDialog";
import { useMainInvestigationSync } from "../../hooks/useInvestigationSync";
import { useTimingHotkeys } from "../../hooks/useTimingHotkeys";
import { useVoiceSidecarBridge } from "../../hooks/useVoiceSidecarBridge";
import { restartVoiceSidecar } from "../../services/sidecarApi";
import { useInvestigationStore } from "../../state/investigationStore";
import { useVoiceDiagnosticsStore } from "../../state/voiceDiagnosticsStore";
import type { DiagnosticsSnapshot } from "../../types/diagnostics";

export function MainWindow() {
  useMainInvestigationSync();
  useTimingHotkeys(true);
  useVoiceSidecarBridge();

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [restartPending, setRestartPending] = useState(false);

  const evidenceEntries = useInvestigationStore((state) => state.evidenceEntries);
  const ghosts = useInvestigationStore((state) => state.ghosts);
  const possibleGhostCount = useInvestigationStore(
    (state) => state.possibleGhostCount,
  );
  const cycleEvidence = useInvestigationStore((state) => state.cycleEvidence);
  const toggleGhostEliminated = useInvestigationStore(
    (state) => state.toggleGhostEliminated,
  );

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

  const diagnostics: DiagnosticsSnapshot = {
    sidecarStatus,
    microphoneLabel: usingMock
      ? "Mock listener (no mic)"
      : "System default input",
    microphoneAvailable: !usingMock && voiceStatus === "listening",
    voiceStatus,
    recentVoiceEvents,
    lastError,
  };

  async function handleRestartSidecar(): Promise<void> {
    setRestartPending(true);
    try {
      const status = await restartVoiceSidecar();
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
    <div className="flex min-h-screen flex-col bg-zinc-950">
      <Header
        voiceStatus={voiceStatus}
        possibleGhostCount={possibleGhostCount}
        onOpenSettings={() => setSettingsOpen(true)}
      />

      <motion.main
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="flex flex-1 flex-col gap-4 p-4 lg:p-6"
      >
        <div className="grid flex-1 gap-4 xl:grid-cols-12">
          <div className="flex flex-col gap-4 xl:col-span-3">
            <EvidencePanel
              evidence={evidenceEntries}
              onEvidenceCycle={cycleEvidence}
            />
            <InvestigationToolsPanel />
          </div>

          <div className="xl:col-span-6">
            <GhostPanel
              ghosts={ghosts}
              evidenceEntries={evidenceEntries}
              onToggleGhostEliminated={toggleGhostEliminated}
            />
          </div>

          <div className="xl:col-span-3">
            <DiagnosticsPanel
              diagnostics={diagnostics}
              usingMock={usingMock}
              restartPending={restartPending}
              onRestartSidecar={() => {
                void handleRestartSidecar();
              }}
            />
          </div>
        </div>
      </motion.main>

      <SettingsDialog
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />
    </div>
  );
}
