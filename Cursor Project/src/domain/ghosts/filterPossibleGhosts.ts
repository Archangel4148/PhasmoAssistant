import type { EvidenceMap } from "../evidence/evidenceState";
import type { Ghost } from "../../types/ghost";
import type { EvidenceId } from "../../types/evidence";

export function isGhostPossible(
  ghost: Ghost,
  evidence: EvidenceMap,
  eliminatedGhostIds: readonly string[] = [],
): boolean {
  if (eliminatedGhostIds.includes(ghost.id)) {
    return false;
  }

  for (const evidenceId of ghost.evidence) {
    if (evidence[evidenceId]?.state === "eliminated") {
      return false;
    }
  }

  for (const [id, entry] of Object.entries(evidence) as [
    EvidenceId,
    EvidenceMap[EvidenceId],
  ][]) {
    if (entry.state === "confirmed" && !ghost.evidence.includes(id)) {
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
