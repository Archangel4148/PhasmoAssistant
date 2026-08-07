import type { Ghost, GhostDisplayItem } from "../../types/ghost";

export function buildGhostDisplayItems(
  ghosts: readonly Ghost[],
  possibleGhostIds: ReadonlySet<string>,
  eliminatedGhostIds: readonly string[] = [],
): GhostDisplayItem[] {
  const manuallyEliminated = new Set(eliminatedGhostIds);

  return ghosts.map((ghost) => ({
    ...ghost,
    isPossible: possibleGhostIds.has(ghost.id),
    isManuallyEliminated: manuallyEliminated.has(ghost.id),
  }));
}

export function countPossibleGhosts(
  ghosts: readonly GhostDisplayItem[],
): number {
  return ghosts.filter((ghost) => ghost.isPossible).length;
}
