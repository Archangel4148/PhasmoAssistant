import { motion } from "framer-motion";
import { EVIDENCE_BY_ID } from "../data/evidence";
import type { EvidenceEntry, EvidenceId, EvidenceState } from "../types/evidence";

interface EvidencePanelProps {
  evidence: EvidenceEntry[];
  onEvidenceCycle: (id: EvidenceId) => void;
  /** When true (Apocalypse), evidence is ignored for filtering and cycling is disabled. */
  evidenceDisabled?: boolean;
}

const STATE_STYLES: Record<
  EvidenceState,
  { container: string; indicator: string; label: string }
> = {
  unknown: {
    container:
      "border-[var(--panel-border)] bg-[color-mix(in_srgb,var(--panel-bg-solid)_40%,transparent)] hover:border-[color-mix(in_srgb,var(--text-faint)_55%,transparent)]",
    indicator: "bg-[var(--text-faint)]",
    label: "Unknown",
  },
  confirmed: {
    container:
      "border-[color-mix(in_srgb,var(--success)_40%,transparent)] bg-[color-mix(in_srgb,var(--success)_10%,transparent)] hover:border-[color-mix(in_srgb,var(--success)_60%,transparent)]",
    indicator:
      "bg-[var(--success)] shadow-[0_0_8px_color-mix(in_srgb,var(--success)_50%,transparent)]",
    label: "Confirmed",
  },
  eliminated: {
    container:
      "border-[color-mix(in_srgb,var(--danger)_22%,transparent)] bg-[color-mix(in_srgb,var(--danger)_6%,transparent)] opacity-60 hover:opacity-75",
    indicator: "bg-[color-mix(in_srgb,var(--danger)_70%,transparent)]",
    label: "Eliminated",
  },
};

function nextStateLabel(state: EvidenceState): string {
  switch (state) {
    case "unknown":
      return "confirmed";
    case "confirmed":
      return "eliminated";
    case "eliminated":
      return "unknown";
  }
}

function EvidenceTile({
  entry,
  onCycle,
  disabled,
}: {
  entry: EvidenceEntry;
  onCycle: (id: EvidenceId) => void;
  disabled: boolean;
}) {
  const definition = EVIDENCE_BY_ID[entry.id];
  const styles = STATE_STYLES[entry.state];

  return (
    <motion.button
      type="button"
      whileTap={disabled ? undefined : { scale: 0.985 }}
      transition={{ duration: 0.15 }}
      disabled={disabled}
      onClick={() => {
        if (!disabled) {
          onCycle(entry.id);
        }
      }}
      aria-label={
        disabled
          ? `${definition.label}: ignored on Apocalypse`
          : `${definition.label}: ${styles.label}. Activate to mark ${nextStateLabel(entry.state)}.`
      }
      className={`focus-ring relative flex w-full flex-col gap-2 rounded-lg border p-3 text-left transition-colors ${styles.container} ${
        disabled ? "cursor-not-allowed opacity-45" : "cursor-pointer"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p
            className="truncate text-sm font-medium"
            style={{ color: "var(--text-primary)" }}
          >
            {definition.label}
          </p>
          <p
            className="text-[11px] uppercase tracking-[0.08em]"
            style={{ color: "var(--text-faint)" }}
          >
            {styles.label}
          </p>
        </div>
        <span
          className={`mt-0.5 h-2 w-2 shrink-0 rounded-full ${styles.indicator}`}
          aria-hidden
        />
      </div>

      {entry.voiceConfirmed && (
        <p className="text-[11px]" style={{ color: "var(--success)" }}>
          ✓ Voice confirmed
        </p>
      )}
    </motion.button>
  );
}

export function EvidencePanel({
  evidence,
  onEvidenceCycle,
  evidenceDisabled = false,
}: EvidencePanelProps) {
  const confirmedCount = evidence.filter((e) => e.state === "confirmed").length;
  const eliminatedCount = evidence.filter(
    (e) => e.state === "eliminated",
  ).length;

  return (
    <section className="panel">
      <div className="mb-4">
        <h2 className="panel-title">Evidence</h2>
        <p className="panel-subtitle">
          {evidenceDisabled
            ? "Apocalypse — evidence ignored; use Exclude / behavior tests"
            : `Click to cycle · ${confirmedCount} confirmed · ${eliminatedCount} eliminated`}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {evidence.map((entry) => (
          <EvidenceTile
            key={entry.id}
            entry={entry}
            onCycle={onEvidenceCycle}
            disabled={evidenceDisabled}
          />
        ))}
      </div>
    </section>
  );
}
