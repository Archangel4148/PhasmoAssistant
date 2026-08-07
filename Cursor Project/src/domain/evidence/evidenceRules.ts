import type { EvidenceId, EvidenceState } from "../../types/evidence";

const EVIDENCE_CYCLE: readonly EvidenceState[] = [
  "unknown",
  "confirmed",
  "eliminated",
] as const;

export function cycleEvidenceState(current: EvidenceState): EvidenceState {
  const index = EVIDENCE_CYCLE.indexOf(current);
  const nextIndex = index === -1 ? 0 : (index + 1) % EVIDENCE_CYCLE.length;
  return EVIDENCE_CYCLE[nextIndex];
}

export function getConfirmedEvidenceIds(
  evidence: Readonly<Record<EvidenceId, { state: EvidenceState }>>,
): EvidenceId[] {
  return (Object.entries(evidence) as [EvidenceId, { state: EvidenceState }][])
    .filter(([, entry]) => entry.state === "confirmed")
    .map(([id]) => id);
}

export function getEliminatedEvidenceIds(
  evidence: Readonly<Record<EvidenceId, { state: EvidenceState }>>,
): EvidenceId[] {
  return (Object.entries(evidence) as [EvidenceId, { state: EvidenceState }][])
    .filter(([, entry]) => entry.state === "eliminated")
    .map(([id]) => id);
}
