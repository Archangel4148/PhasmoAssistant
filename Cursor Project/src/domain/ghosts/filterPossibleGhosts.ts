import type { EvidenceMap } from "../evidence/evidenceState";
import type { Ghost } from "../../types/ghost";
import type { EvidenceId } from "../../types/evidence";
import { ghostHasEvidence } from "./evidenceSet";

export function isGhostPossible(
  ghost: Ghost,
  evidence: EvidenceMap,
  eliminatedGhostIds: readonly string[] = [],
): boolean {
  if (eliminatedGhostIds.includes(ghost.id)) {
    return false;
  }

  for (const [id, entry] of Object.entries(evidence) as [
    EvidenceId,
    EvidenceMap[EvidenceId],
  ][]) {
    if (entry.state === "eliminated" && ghostHasEvidence(ghost, id)) {
      return false;
    }

    if (entry.state === "confirmed" && !ghostHasEvidence(ghost, id)) {
      return false;
    }
  }

  return true;
}

export function filterPossibleGhostIds(
  ghosts: readonly Ghost[],
  evidence: EvidenceMap,
  eliminatedGhostIds: readonly string[] = [],
): Set<string> {
  const possibleIds = new Set<string>();

  for (const ghost of ghosts) {
    if (isGhostPossible(ghost, evidence, eliminatedGhostIds)) {
      possibleIds.add(ghost.id);
    }
  }

  return possibleIds;
}
