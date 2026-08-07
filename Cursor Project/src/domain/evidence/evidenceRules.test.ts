import { describe, expect, it } from "vitest";
import {
  cycleEvidenceState,
  getConfirmedEvidenceIds,
  getEliminatedEvidenceIds,
} from "./evidenceRules";
import {
  createInitialEvidenceMap,
  cycleEvidenceEntry,
  setEvidenceEntryState,
} from "./evidenceState";

describe("cycleEvidenceState", () => {
  it("cycles unknown → confirmed → eliminated → unknown", () => {
    expect(cycleEvidenceState("unknown")).toBe("confirmed");
    expect(cycleEvidenceState("confirmed")).toBe("eliminated");
    expect(cycleEvidenceState("eliminated")).toBe("unknown");
  });
});

describe("evidence map helpers", () => {
  it("starts with all evidence unknown", () => {
    const evidence = createInitialEvidenceMap();
    expect(getConfirmedEvidenceIds(evidence)).toEqual([]);
    expect(getEliminatedEvidenceIds(evidence)).toEqual([]);
  });

  it("cycles a single evidence entry in the map", () => {
    const initial = createInitialEvidenceMap();
    const next = cycleEvidenceEntry(initial, "emf5");
    expect(next.emf5.state).toBe("confirmed");
    expect(next.spiritBox.state).toBe("unknown");
  });

  it("tracks confirmed and eliminated ids", () => {
    let evidence = createInitialEvidenceMap();
    evidence = setEvidenceEntryState(evidence, "emf5", "confirmed");
    evidence = setEvidenceEntryState(evidence, "dots", "eliminated");

    expect(getConfirmedEvidenceIds(evidence)).toEqual(["emf5"]);
    expect(getEliminatedEvidenceIds(evidence)).toEqual(["dots"]);
  });
});
