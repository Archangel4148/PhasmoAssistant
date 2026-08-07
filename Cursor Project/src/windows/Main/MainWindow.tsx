import { useState } from "react";
import { motion } from "framer-motion";
import { DiagnosticsPanel } from "../../components/DiagnosticsPanel";
import { EvidencePanel } from "../../components/EvidencePanel";
import { GhostPanel } from "../../components/GhostPanel";
import { Header } from "../../components/Header";
import { InvestigationToolsPanel } from "../../components/InvestigationToolsPanel";
import { SettingsDialog } from "../../components/SettingsDialog";
import { MOCK_SUBSYSTEMS } from "../../data/mockSubsystems";
import { useInvestigationStore } from "../../state/investigationStore";

export function MainWindow() {
  const [settingsOpen, setSettingsOpen] = useState(false);

  const evidenceEntries = useInvestigationStore((state) => state.evidenceEntries);
  const ghosts = useInvestigationStore((state) => state.ghosts);
  const possibleGhostCount = useInvestigationStore(
    (state) => state.possibleGhostCount,
  );
  const cycleEvidence = useInvestigationStore((state) => state.cycleEvidence);

  const mock = MOCK_SUBSYSTEMS;

  return (
    <div className="flex min-h-screen flex-col bg-zinc-950">
      <Header
        voiceStatus={mock.voiceStatus}
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
            <InvestigationToolsPanel
              timingMode={mock.timingMode}
              currentGhostSpeedMps={mock.currentGhostSpeedMps}
              smudgeRemainingSeconds={mock.smudgeRemainingSeconds}
              huntRemainingSeconds={mock.huntRemainingSeconds}
            />
          </div>

          <div className="xl:col-span-6">
            <GhostPanel ghosts={ghosts} />
          </div>

          <div className="xl:col-span-3">
            <DiagnosticsPanel diagnostics={mock.diagnostics} />
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
