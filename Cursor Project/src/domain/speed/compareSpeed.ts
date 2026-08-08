import type { GhostDisplayItem, SpeedProfile } from "../../types/ghost";

/** Absolute m/s tolerance when matching measured speed to a ghost reference. */
export const SPEED_MATCH_TOLERANCE_MPS = 0.2;

export interface GhostSpeedMatch {
  ghostId: string;
  ghostName: string;
  /** Closest edge or point used for delta (range midpoint clamp). */
  referenceSpeedMps: number;
  deltaMps: number;
  isClose: boolean;
  /** True when the ghost was matched against a speed range rather than a point. */
  usedRange: boolean;
}

/** Resolve an inclusive [min, max] band for matching, if any speeds are known. */
export function resolveSpeedMatchRange(
  profile: SpeedProfile,
): { min: number; max: number } | null {
  const minCandidate =
    typeof profile.minSpeedMps === "number" && Number.isFinite(profile.minSpeedMps)
      ? profile.minSpeedMps
      : null;
  const maxCandidate =
    typeof profile.maxSpeedMps === "number" && Number.isFinite(profile.maxSpeedMps)
      ? profile.maxSpeedMps
      : null;
  const reference =
    typeof profile.referenceSpeedMps === "number" &&
    Number.isFinite(profile.referenceSpeedMps)
      ? profile.referenceSpeedMps
      : null;

  if (minCandidate !== null && maxCandidate !== null) {
    return {
      min: Math.min(minCandidate, maxCandidate),
      max: Math.max(minCandidate, maxCandidate),
    };
  }

  if (minCandidate !== null && reference !== null) {
    return {
      min: Math.min(minCandidate, reference),
      max: Math.max(minCandidate, reference),
    };
  }

  if (maxCandidate !== null && reference !== null) {
    return {
      min: Math.min(maxCandidate, reference),
      max: Math.max(maxCandidate, reference),
    };
  }

  if (reference !== null) {
    return { min: reference, max: reference };
  }

  return null;
}

function deltaToRange(measured: number, min: number, max: number): number {
  if (measured < min) {
    return measured - min;
  }
  if (measured > max) {
    return measured - max;
  }
  return 0;
}

/**
 * Compare a measured speed against possible ghosts that have a reference or range.
 * Sorted by absolute delta (closest first). Ghosts without speed data are omitted.
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
    const range = resolveSpeedMatchRange(ghost.speedProfile);
    if (!range) {
      continue;
    }

    const deltaMps = deltaToRange(measuredMps, range.min, range.max);
    const usedRange = range.min !== range.max;
    const referenceSpeedMps = usedRange
      ? Math.min(range.max, Math.max(range.min, measuredMps))
      : range.min;

    matches.push({
      ghostId: ghost.id,
      ghostName: ghost.name,
      referenceSpeedMps,
      deltaMps,
      isClose: Math.abs(deltaMps) <= toleranceMps,
      usedRange,
    });
  }

  matches.sort((a, b) => Math.abs(a.deltaMps) - Math.abs(b.deltaMps));
  return matches;
}
