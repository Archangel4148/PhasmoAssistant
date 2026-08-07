import { AnimatePresence, motion } from "framer-motion";
import { EVIDENCE_BY_ID } from "../data/evidence";
import type { EvidenceEntry, EvidenceId } from "../types/evidence";
import type { GhostDisplayItem } from "../types/ghost";

interface GhostCardProps {
  ghost: GhostDisplayItem;
  evidenceEntries: EvidenceEntry[];
  onToggleEliminated: (ghostId: string) => void;
}

function evidenceTone(
  evidenceId: EvidenceId,
  entries: EvidenceEntry[],
): "confirmed" | "eliminated" | "neutral" {
  const entry = entries.find((item) => item.id === evidenceId);
  if (entry?.state === "confirmed") {
    return "confirmed";
  }
  if (entry?.state === "eliminated") {
    return "eliminated";
  }
  return "neutral";
}

const CHIP_STYLES = {
  confirmed:
    "border-emerald-500/40 bg-emerald-500/15 text-emerald-300",
  eliminated: "border-red-500/30 bg-red-500/10 text-red-300/80 line-through",
  neutral: "border-zinc-700/60 bg-zinc-900/60 text-zinc-400",
} as const;

export function GhostCard({
  ghost,
  evidenceEntries,
  onToggleEliminated,
}: GhostCardProps) {
  const forced = ghost.specialRules?.alwaysPresentsEvidence ?? [];

  return (
    <motion.article
      layout
      initial={false}
      animate={{
        opacity: ghost.isPossible ? 1 : 0.2,
        scale: ghost.isPossible ? 1 : 0.98,
      }}
      transition={{ duration: 0.28, ease: "easeOut" }}
      className={`rounded-lg border p-3 ${
        ghost.isPossible
          ? "border-zinc-700/80 bg-zinc-800/60"
          : "border-zinc-800/60 bg-zinc-900/30"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <h3
          className={`text-sm font-medium ${
            ghost.isPossible ? "text-zinc-100" : "text-zinc-500"
          }`}
        >
          {ghost.name}
        </h3>
        <div className="flex shrink-0 items-center gap-1.5">
          <AnimatePresence initial={false}>
            {ghost.isPossible && (
              <motion.span
                key="possible"
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.2 }}
                className="rounded bg-violet-500/15 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-violet-300"
              >
                Possible
              </motion.span>
            )}
          </AnimatePresence>
          <button
            type="button"
            onClick={() => onToggleEliminated(ghost.id)}
            className={`rounded border px-1.5 py-0.5 text-[10px] font-medium transition-colors ${
              ghost.isManuallyEliminated
                ? "border-amber-500/40 bg-amber-500/10 text-amber-300"
                : "border-zinc-700/70 text-zinc-500 hover:border-zinc-500 hover:text-zinc-300"
            }`}
            title={
              ghost.isManuallyEliminated
                ? "Restore ghost"
                : "Manually eliminate ghost"
            }
          >
            {ghost.isManuallyEliminated ? "Include" : "Exclude"}
          </button>
        </div>
      </div>

      <div className="mt-2 flex flex-wrap gap-1">
        {ghost.evidence.map((evidenceId) => {
          const tone = evidenceTone(evidenceId, evidenceEntries);
          return (
            <span
              key={evidenceId}
              className={`rounded border px-1.5 py-0.5 text-[10px] ${CHIP_STYLES[tone]}`}
            >
              {EVIDENCE_BY_ID[evidenceId].shortLabel}
            </span>
          );
        })}
        {forced.map((evidenceId) => (
          <span
            key={`forced-${evidenceId}`}
            className={`rounded border px-1.5 py-0.5 text-[10px] ${
              CHIP_STYLES[evidenceTone(evidenceId, evidenceEntries)]
            }`}
            title="Always presented (not journal evidence)"
          >
            {EVIDENCE_BY_ID[evidenceId].shortLabel}*
          </span>
        ))}
      </div>

      <p className="mt-2 text-[11px] text-zinc-500">
        Speed: {ghost.speedProfile.summary}
      </p>

      {ghost.notes.length > 0 && (
        <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-zinc-600">
          {ghost.notes[0]}
        </p>
      )}
    </motion.article>
  );
}
