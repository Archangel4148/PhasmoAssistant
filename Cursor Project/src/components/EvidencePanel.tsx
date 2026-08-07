import { motion } from "framer-motion";
import { EVIDENCE_BY_ID } from "../data/evidence";
import type { EvidenceEntry, EvidenceId, EvidenceState } from "../types/evidence";

interface EvidencePanelProps {
  evidence: EvidenceEntry[];
  onEvidenceCycle: (id: EvidenceId) => void;
}

const STATE_STYLES: Record<
  EvidenceState,
  { container: string; indicator: string; label: string }
> = {
  unknown: {
    container: "border-zinc-800/80 bg-zinc-900/40 hover:border-zinc-700/80",
    indicator: "bg-zinc-600",
    label: "Unknown",
  },
  confirmed: {
    container:
      "border-emerald-500/40 bg-emerald-500/10 hover:border-emerald-500/60",
    indicator: "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]",
    label: "Confirmed",
  },
  eliminated: {
    container: "border-red-500/20 bg-red-500/5 opacity-60 hover:opacity-75",
    indicator: "bg-red-400/70",
    label: "Eliminated",
  },
};

function EvidenceTile({
  entry,
  onCycle,
}: {
  entry: EvidenceEntry;
  onCycle: (id: EvidenceId) => void;
}) {
  const definition = EVIDENCE_BY_ID[entry.id];
  const styles = STATE_STYLES[entry.state];

  return (
    <motion.button
      type="button"
      layout
      onClick={() => onCycle(entry.id)}
      className={`relative flex w-full flex-col gap-2 rounded-lg border p-3 text-left transition-colors ${styles.container} cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/50`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-zinc-100">
            {definition.label}
          </p>
          <p className="text-[11px] uppercase tracking-wide text-zinc-500">
            {styles.label}
          </p>
        </div>
        <span
          className={`mt-0.5 h-2 w-2 shrink-0 rounded-full ${styles.indicator}`}
          aria-hidden
        />
      </div>

      {entry.voiceConfirmed && (
        <p className="text-[11px] text-emerald-400/90">✓ Voice confirmed</p>
      )}
    </motion.button>
  );
}

export function EvidencePanel({ evidence, onEvidenceCycle }: EvidencePanelProps) {
  const confirmedCount = evidence.filter((e) => e.state === "confirmed").length;
  const eliminatedCount = evidence.filter(
    (e) => e.state === "eliminated",
  ).length;

  return (
    <section className="rounded-xl border border-zinc-800/80 bg-zinc-900/50 p-4 shadow-lg backdrop-blur-sm">
      <div className="mb-4 flex items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-300">
            Evidence
          </h2>
          <p className="text-xs text-zinc-500">
            Click to cycle · {confirmedCount} confirmed · {eliminatedCount}{" "}
            eliminated
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {evidence.map((entry) => (
          <EvidenceTile key={entry.id} entry={entry} onCycle={onEvidenceCycle} />
        ))}
      </div>
    </section>
  );
}
