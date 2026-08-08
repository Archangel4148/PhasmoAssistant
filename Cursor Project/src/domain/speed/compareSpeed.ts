import type { GhostDisplayItem } from "../../types/ghost";

/** Absolute m/s tolerance when matching measured speed to a ghost reference. */
export const SPEED_MATCH_TOLERANCE_MPS = 0.2;

export interface GhostSpeedMatch {
  ghostId: string;
  ghostName: string;
  referenceSpeedMps: number;
  deltaMps: number;
  isClose: boolean;
}

/**
 * Compare a measured speed against possible ghosts that have a reference speed.
 * Sorted by absolute delta (closest first). Ghosts without a reference are omitted.
 */
export function compareSpeedToPossibleGhosts(
  measuredMps: number | null,
  ghosts: readonly GhostDisplayItem[],
  toleranceMps: number = SPEED_MATCH_TOLERANCE_MPS,
): GhostSpeedMatch[] {
  if (measuredMps === null || !Number.isFinite(measuredMps)) {
    return [];
  }

  const matches: GhostSpeedMatch[] = [];

  for (const ghost of ghosts) {
    if (!ghost.isPossible) {
      continue;
    }
    const reference = ghost.speedProfile.referenceSpeedMps;
    if (reference === null || !Number.isFinite(reference)) {
      continue;
    }
    const deltaMps = measuredMps - reference;
    matches.push({
      ghostId: ghost.id,
      ghostName: ghost.name,
      referenceSpeedMps: reference,
      deltaMps,
      isClose: Math.abs(deltaMps) <= toleranceMps,
    });
  }

  matches.sort((a, b) => Math.abs(a.deltaMps) - Math.abs(b.deltaMps));
  return matches;
}
