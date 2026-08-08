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
    "border-[color-mix(in_srgb,var(--success)_40%,transparent)] bg-[color-mix(in_srgb,var(--success)_14%,transparent)] text-[var(--success)]",
  eliminated:
    "border-[color-mix(in_srgb,var(--danger)_30%,transparent)] bg-[color-mix(in_srgb,var(--danger)_10%,transparent)] text-[color-mix(in_srgb,var(--danger)_80%,transparent)] line-through",
  neutral:
    "border-[var(--panel-border)] bg-[color-mix(in_srgb,var(--panel-bg-solid)_55%,transparent)] text-[var(--text-muted)]",
} as const;

export function GhostCard({
  ghost,
  evidenceEntries,
  onToggleEliminated,
}: GhostCardProps) {
  const forced = ghost.specialRules?.alwaysPresentsEvidence ?? [];

  return (
    <motion.article
      initial={false}
      animate={{
        opacity: ghost.isPossible ? 1 : 0.22,
        scale: ghost.isPossible ? 1 : 0.98,
      }}
      transition={{ duration: 0.22, ease: "easeOut" }}
      className={`rounded-lg border p-3 ${
        ghost.isPossible
          ? "border-[color-mix(in_srgb,var(--text-faint)_50%,transparent)] bg-[color-mix(in_srgb,var(--panel-bg-solid)_70%,transparent)]"
          : "border-[var(--panel-border)] bg-[color-mix(in_srgb,var(--panel-bg-solid)_35%,transparent)]"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <h3
          className="text-sm font-medium"
          style={{
            color: ghost.isPossible
              ? "var(--text-primary)"
              : "var(--text-faint)",
          }}
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
                className="accent-chip rounded px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-[0.08em]"
              >
                Possible
              </motion.span>
            )}
          </AnimatePresence>
          <button
            type="button"
            onClick={() => onToggleEliminated(ghost.id)}
            aria-pressed={ghost.isManuallyEliminated}
            aria-label={
              ghost.isManuallyEliminated
                ? `Include ${ghost.name}`
                : `Exclude ${ghost.name}`
            }
            className={`focus-ring rounded border px-1.5 py-0.5 text-[10px] font-medium transition-colors ${
              ghost.isManuallyEliminated
                ? "border-[color-mix(in_srgb,var(--warning)_40%,transparent)] bg-[color-mix(in_srgb,var(--warning)_10%,transparent)] text-[var(--warning)]"
                : "border-[var(--panel-border)] text-[var(--text-faint)] hover:text-[var(--text-secondary)]"
            }`}
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

      <p className="mt-2 text-[11px]" style={{ color: "var(--text-faint)" }}>
        Speed: {ghost.speedProfile.summary}
      </p>

      {ghost.notes.length > 0 && (
        <p
          className="mt-1 line-clamp-2 text-[11px] leading-relaxed"
          style={{ color: "var(--text-muted)" }}
        >
          {ghost.notes[0]}
        </p>
      )}
    </motion.article>
  );
}
