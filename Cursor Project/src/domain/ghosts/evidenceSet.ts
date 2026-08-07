import type { EvidenceId } from "../../types/evidence";
import type { Ghost } from "../../types/ghost";

/**
 * Effective evidence used for filtering = journal evidence ∪ always-presented evidence.
 * Kept in the domain layer so UI never invents Mimic/orbs rules.
 */
export function getEffectiveEvidenceIds(ghost: Ghost): EvidenceId[] {
  const forced = ghost.specialRules?.alwaysPresentsEvidence ?? [];
  if (forced.length === 0) {
    return [...ghost.evidence];
  }

  const merged = new Set<EvidenceId>([...ghost.evidence, ...forced]);
  return [...merged];
}

export function ghostHasEvidence(ghost: Ghost, evidenceId: EvidenceId): boolean {
  return getEffectiveEvidenceIds(ghost).includes(evidenceId);
}
