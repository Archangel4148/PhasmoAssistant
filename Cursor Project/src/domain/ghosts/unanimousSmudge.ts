import type { GhostDisplayItem } from "../../types/ghost";

/**
 * When every remaining possible ghost shares one smudge duration, return it.
 * Otherwise null (mixed / empty) — UI should leave the manual preset alone.
 */
export function unanimousSmudgeDurationSeconds(
  ghosts: readonly GhostDisplayItem[],
): number | null {
  const possible = ghosts.filter((ghost) => ghost.isPossible);
  if (possible.length === 0) {
    return null;
  }

  const first = possible[0]?.smudgeDurationSeconds;
  if (typeof first !== "number" || !Number.isFinite(first)) {
    return null;
  }

  return possible.every((ghost) => ghost.smudgeDurationSeconds === first)
    ? first
    : null;
}
