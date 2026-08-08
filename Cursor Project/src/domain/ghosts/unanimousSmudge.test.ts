import { describe, expect, it } from "vitest";
import type { GhostDisplayItem } from "../../types/ghost";
import { unanimousSmudgeDurationSeconds } from "./unanimousSmudge";

function ghost(
  id: string,
  smudgeDurationSeconds: number,
  isPossible: boolean,
): GhostDisplayItem {
  return {
    id,
    name: id,
    evidence: ["emf5", "spiritBox", "ghostWriting"],
    speedProfile: { summary: "1.7 m/s", referenceSpeedMps: 1.7 },
    smudgeDurationSeconds,
    notes: [],
    isPossible,
    isManuallyEliminated: !isPossible,
  };
}

describe("unanimousSmudgeDurationSeconds", () => {
  it("returns null when no ghosts are possible", () => {
    expect(
      unanimousSmudgeDurationSeconds([ghost("spirit", 180, false)]),
    ).toBeNull();
  });

  it("returns the shared duration when all possible ghosts agree", () => {
    expect(
      unanimousSmudgeDurationSeconds([
        ghost("demon", 60, true),
        ghost("shade", 90, false),
        ghost("yurei", 60, true),
      ]),
    ).toBe(60);
  });

  it("returns null when possible ghosts disagree", () => {
    expect(
      unanimousSmudgeDurationSeconds([
        ghost("demon", 60, true),
        ghost("spirit", 180, true),
      ]),
    ).toBeNull();
  });
});
