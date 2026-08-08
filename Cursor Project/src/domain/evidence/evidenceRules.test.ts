import { describe, expect, it } from "vitest";
import {
  cycleEvidenceState,
  getConfirmedEvidenceIds,
  getEliminatedEvidenceIds,
} from "./evidenceRules";
import {
  createInitialEvidenceMap,
  cycleEvidenceEntry,
  resolveEvidenceMap,
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

describe("resolveEvidenceMap", () => {
  it("returns a fresh initial map for null/invalid roots", () => {
    expect(resolveEvidenceMap(null).emf5.state).toBe("unknown");
    expect(resolveEvidenceMap([]).emf5.state).toBe("unknown");
    expect(resolveEvidenceMap("bad").emf5.state).toBe("unknown");
  });

  it("keeps valid entries and ignores unknown keys / bad shapes", () => {
    const resolved = resolveEvidenceMap({
      emf5: { id: "emf5", state: "confirmed", voiceConfirmed: true },
      spiritBox: { state: "nope" },
      notEvidence: { state: "confirmed" },
      dots: null,
    });

    expect(resolved.emf5).toEqual({
      id: "emf5",
      state: "confirmed",
      voiceConfirmed: true,
    });
    expect(resolved.spiritBox.state).toBe("unknown");
    expect(resolved.dots.state).toBe("unknown");
    expect("notEvidence" in resolved).toBe(false);
  });
});
