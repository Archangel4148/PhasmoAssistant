import { describe, expect, it } from "vitest";
import {
  appendFootstepTimestamp,
  calculateFootstepSpeed,
  calculateGhostSpeedMps,
  MAX_FOOTSTEP_TIMESTAMPS,
  METERS_PER_STEP,
} from "./calculateSpeed";
import { compareSpeedToPossibleGhosts } from "./compareSpeed";
import type { GhostDisplayItem } from "../../types/ghost";

describe("calculateFootstepSpeed", () => {
  it("returns null speed with fewer than two timestamps", () => {
    expect(calculateGhostSpeedMps([])).toBeNull();
    expect(calculateGhostSpeedMps([1000])).toBeNull();
    expect(calculateFootstepSpeed([1000]).timestampCount).toBe(1);
  });

  it("calculates speed from exactly two timestamps", () => {
    // 500ms interval → SPS=2 → 1.7 m/s
    const result = calculateFootstepSpeed([0, 500]);
    expect(result.intervalsSeconds).toEqual([0.5]);
    expect(result.averageDeltaSeconds).toBeCloseTo(0.5);
    expect(result.stepsPerSecond).toBeCloseTo(2);
    expect(result.observedMetersPerSecond).toBeCloseTo(2 * METERS_PER_STEP);
    expect(result.metersPerSecond).toBeCloseTo(2 * METERS_PER_STEP);
  });

  it("normalizes observed speed by ghost speed multiplier", () => {
    // Observed 1.7 m/s at 50% ghost speed → base 3.4 m/s
    const result = calculateFootstepSpeed([0, 500], {
      ghostSpeedMultiplier: 0.5,
    });
    expect(result.observedMetersPerSecond).toBeCloseTo(1.7);
    expect(result.metersPerSecond).toBeCloseTo(3.4);
  });

  it("averages four intervals from five timestamps (SPEC example ~2.4 m/s)", () => {
    // averageDelta ≈ 0.354166… → SPS ≈ 2.824 → m/s ≈ 2.4 → BPM ≈ 169
    const intervalMs = 354.1666667;
    const timestamps = [0, 1, 2, 3, 4].map((step) => step * intervalMs);
    const result = calculateFootstepSpeed(timestamps);
    expect(result.timestampCount).toBe(5);
    expect(result.intervalsSeconds).toHaveLength(4);
    expect(result.metersPerSecond).toBeCloseTo(2.4, 1);
    expect(result.beatsPerMinute).toBeCloseTo(2.824 * 60, 0);
  });

  it("ignores non-positive intervals without dividing by zero", () => {
    const result = calculateFootstepSpeed([1000, 1000, 1500]);
    expect(result.intervalsSeconds).toEqual([0.5]);
    expect(result.metersPerSecond).toBeCloseTo(1.7);
  });
});

describe("appendFootstepTimestamp", () => {
  it("appends until the five-timestamp cap", () => {
    let stamps: number[] = [];
    for (let index = 0; index < 7; index += 1) {
      stamps = appendFootstepTimestamp(stamps, index * 100);
    }
    expect(stamps).toHaveLength(MAX_FOOTSTEP_TIMESTAMPS);
    expect(stamps).toEqual([0, 100, 200, 300, 400]);
  });
});

describe("compareSpeedToPossibleGhosts", () => {
  const ghosts: GhostDisplayItem[] = [
    {
      id: "spirit",
      name: "Spirit",
      evidence: ["emf5", "spiritBox", "ghostWriting"],
      speedProfile: { summary: "1.7 m/s", referenceSpeedMps: 1.7 },
      smudgeDurationSeconds: 180,
      notes: [],
      isPossible: true,
      isManuallyEliminated: false,
    },
    {
      id: "revenant",
      name: "Revenant",
      evidence: ["ghostOrbs", "ghostWriting", "freezing"],
      speedProfile: { summary: "3.0 m/s", referenceSpeedMps: 3.0 },
      smudgeDurationSeconds: 90,
      notes: [],
      isPossible: true,
      isManuallyEliminated: false,
    },
    {
      id: "mimic",
      name: "The Mimic",
      evidence: ["spiritBox", "fingerprints", "freezing"],
      speedProfile: { summary: "Varies", referenceSpeedMps: null },
      smudgeDurationSeconds: 90,
      notes: [],
      isPossible: true,
      isManuallyEliminated: false,
    },
    {
      id: "shade",
      name: "Shade",
      evidence: ["emf5", "ghostWriting", "freezing"],
      speedProfile: { summary: "1.7 m/s", referenceSpeedMps: 1.7 },
      smudgeDurationSeconds: 90,
      notes: [],
      isPossible: false,
      isManuallyEliminated: false,
    },
  ];

  it("matches close possible ghosts and skips null/impossible", () => {
    const matches = compareSpeedToPossibleGhosts(1.7, ghosts);
    expect(matches.map((entry) => entry.ghostId)).toEqual(["spirit", "revenant"]);
    expect(matches[0]?.isClose).toBe(true);
    // Point ghost at 3.0 is far from 1.7
    expect(matches[1]?.isClose).toBe(false);
  });

  it("treats measured speeds inside a variable range as close", () => {
    const ranged: GhostDisplayItem[] = [
      {
        id: "revenant",
        name: "Revenant",
        evidence: ["ghostOrbs", "ghostWriting", "freezing"],
        speedProfile: {
          summary: "1.0–3.0 m/s",
          referenceSpeedMps: 3.0,
          minSpeedMps: 1.0,
          maxSpeedMps: 3.0,
        },
        smudgeDurationSeconds: 90,
        notes: [],
        isPossible: true,
        isManuallyEliminated: false,
      },
    ];
    const matches = compareSpeedToPossibleGhosts(1.7, ranged);
    expect(matches).toHaveLength(1);
    expect(matches[0]?.isClose).toBe(true);
    expect(matches[0]?.usedRange).toBe(true);
    expect(matches[0]?.deltaMps).toBe(0);
  });

  it("returns empty when speed is null", () => {
    expect(compareSpeedToPossibleGhosts(null, ghosts)).toEqual([]);
  });
});
