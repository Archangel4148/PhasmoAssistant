import { describe, expect, it } from "vitest";
import { GHOSTS, GHOSTS_BY_ID } from "../../data/ghosts";
import {
  createInitialEvidenceMap,
  setEvidenceEntryState,
} from "../evidence/evidenceState";
import { buildGhostDisplayItems } from "./buildGhostDisplayItems";
import { getEffectiveEvidenceIds } from "./evidenceSet";
import { filterPossibleGhostIds, isGhostPossible } from "./filterPossibleGhosts";

describe("dataset integrity", () => {
  it("includes 30 ghosts with unique ids", () => {
    expect(GHOSTS).toHaveLength(30);
    const ids = GHOSTS.map((ghost) => ghost.id);
    expect(new Set(ids).size).toBe(30);
  });

  it("gives every ghost exactly three journal evidence types", () => {
    for (const ghost of GHOSTS) {
      expect(ghost.evidence).toHaveLength(3);
      expect(new Set(ghost.evidence).size).toBe(3);
    }
  });

  it("has unique journal evidence triples", () => {
    const keys = GHOSTS.map((ghost) => [...ghost.evidence].sort().join("|"));
    expect(new Set(keys).size).toBe(GHOSTS.length);
  });

  it("models Mimic fake orbs as always-presented evidence", () => {
    const mimic = GHOSTS_BY_ID.mimic;
    expect(mimic.evidence).toEqual(["spiritBox", "fingerprints", "freezing"]);
    expect(mimic.specialRules?.alwaysPresentsEvidence).toEqual(["ghostOrbs"]);
    expect(getEffectiveEvidenceIds(mimic).sort()).toEqual(
      ["fingerprints", "freezing", "ghostOrbs", "spiritBox"].sort(),
    );
  });

  it("includes newest Winter’s Jest / event ghosts with correct triples", () => {
    expect(GHOSTS_BY_ID.obambo.evidence.sort()).toEqual(
      ["dots", "fingerprints", "ghostWriting"].sort(),
    );
    expect(GHOSTS_BY_ID.gallu.evidence.sort()).toEqual(
      ["emf5", "fingerprints", "spiritBox"].sort(),
    );
    expect(GHOSTS_BY_ID.dayan.evidence.sort()).toEqual(
      ["emf5", "ghostOrbs", "spiritBox"].sort(),
    );
    expect(GHOSTS_BY_ID.kormos.evidence.sort()).toEqual(
      ["fingerprints", "ghostOrbs", "spiritBox"].sort(),
    );
    expect(GHOSTS_BY_ID.aswang.evidence.sort()).toEqual(
      ["dots", "freezing", "ghostWriting"].sort(),
    );
    expect(GHOSTS_BY_ID.deildegast.evidence.sort()).toEqual(
      ["dots", "emf5", "ghostWriting"].sort(),
    );
  });

  it("records forced-evidence markers for Nightmare/Insanity anchors", () => {
    expect(GHOSTS_BY_ID.goryo.specialRules?.forcedEvidence).toEqual(["dots"]);
    expect(GHOSTS_BY_ID.deogen.specialRules?.forcedEvidence).toEqual([
      "spiritBox",
    ]);
    expect(GHOSTS_BY_ID.moroi.specialRules?.forcedEvidence).toEqual([
      "spiritBox",
    ]);
    expect(GHOSTS_BY_ID.hantu.specialRules?.forcedEvidence).toEqual([
      "freezing",
    ]);
    expect(GHOSTS_BY_ID.obake.specialRules?.forcedEvidence).toEqual([
      "fingerprints",
    ]);
  });
});

describe("isGhostPossible", () => {
  const spirit = GHOSTS_BY_ID.spirit;
  const demon = GHOSTS_BY_ID.demon;
  const wraith = GHOSTS_BY_ID.wraith;
  const mimic = GHOSTS_BY_ID.mimic;
  const hantu = GHOSTS_BY_ID.hantu;

  it("returns true when all evidence is unknown", () => {
    const evidence = createInitialEvidenceMap();
    expect(isGhostPossible(spirit, evidence)).toBe(true);
    expect(isGhostPossible(demon, evidence)).toBe(true);
  });

  it("eliminates ghosts missing confirmed evidence", () => {
    const evidence = setEvidenceEntryState(
      createInitialEvidenceMap(),
      "emf5",
      "confirmed",
    );

    expect(isGhostPossible(spirit, evidence)).toBe(true);
    expect(isGhostPossible(demon, evidence)).toBe(false);
  });

  it("eliminates ghosts that have eliminated evidence", () => {
    const evidence = setEvidenceEntryState(
      createInitialEvidenceMap(),
      "ghostWriting",
      "eliminated",
    );

    expect(isGhostPossible(spirit, evidence)).toBe(false);
    expect(isGhostPossible(wraith, evidence)).toBe(true);
  });

  it("respects manually eliminated ghost ids", () => {
    const evidence = createInitialEvidenceMap();
    expect(isGhostPossible(spirit, evidence, ["spirit"])).toBe(false);
  });

  it("keeps Mimic possible when Ghost Orbs are confirmed", () => {
    const evidence = setEvidenceEntryState(
      createInitialEvidenceMap(),
      "ghostOrbs",
      "confirmed",
    );

    expect(isGhostPossible(mimic, evidence)).toBe(true);
    expect(isGhostPossible(spirit, evidence)).toBe(false);
  });

  it("eliminates Mimic when Ghost Orbs are ruled out", () => {
    const evidence = setEvidenceEntryState(
      createInitialEvidenceMap(),
      "ghostOrbs",
      "eliminated",
    );

    expect(isGhostPossible(mimic, evidence)).toBe(false);
    expect(isGhostPossible(spirit, evidence)).toBe(true);
  });

  it("keeps Mimic when its true evidence plus orbs are confirmed", () => {
    let evidence = createInitialEvidenceMap();
    evidence = setEvidenceEntryState(evidence, "spiritBox", "confirmed");
    evidence = setEvidenceEntryState(evidence, "fingerprints", "confirmed");
    evidence = setEvidenceEntryState(evidence, "freezing", "confirmed");
    evidence = setEvidenceEntryState(evidence, "ghostOrbs", "confirmed");

    const possible = filterPossibleGhostIds(GHOSTS, evidence);
    expect(possible.has("mimic")).toBe(true);
    expect(possible.size).toBe(1);
  });

  it("does not confuse Hantu with Mimic when orbs are absent", () => {
    let evidence = createInitialEvidenceMap();
    evidence = setEvidenceEntryState(evidence, "fingerprints", "confirmed");
    evidence = setEvidenceEntryState(evidence, "freezing", "confirmed");
    evidence = setEvidenceEntryState(evidence, "ghostOrbs", "eliminated");

    expect(isGhostPossible(hantu, evidence)).toBe(false);
    expect(isGhostPossible(mimic, evidence)).toBe(false);
  });
});

describe("evidence difficulty filtering", () => {
  const deogen = GHOSTS_BY_ID.deogen;
  const hantu = GHOSTS_BY_ID.hantu;
  const mimic = GHOSTS_BY_ID.mimic;
  const spirit = GHOSTS_BY_ID.spirit;

  it("Nightmare: eliminates forced-evidence ghosts when 2 confirmed omit forced", () => {
    let evidence = createInitialEvidenceMap();
    evidence = setEvidenceEntryState(evidence, "ghostOrbs", "confirmed");
    evidence = setEvidenceEntryState(evidence, "fingerprints", "confirmed");

    expect(
      isGhostPossible(hantu, evidence, [], { evidenceDifficulty: "nightmare" }),
    ).toBe(false);
    expect(
      isGhostPossible(mimic, evidence, [], { evidenceDifficulty: "nightmare" }),
    ).toBe(true);
  });

  it("Nightmare: keeps forced-evidence ghosts when forced is among confirmed", () => {
    let evidence = createInitialEvidenceMap();
    evidence = setEvidenceEntryState(evidence, "freezing", "confirmed");
    evidence = setEvidenceEntryState(evidence, "fingerprints", "confirmed");

    expect(
      isGhostPossible(hantu, evidence, [], { evidenceDifficulty: "nightmare" }),
    ).toBe(true);
  });

  it("Insanity: forced ghosts die when a non-forced journal evidence is confirmed", () => {
    const evidence = setEvidenceEntryState(
      createInitialEvidenceMap(),
      "ghostWriting",
      "confirmed",
    );

    expect(
      isGhostPossible(deogen, evidence, [], { evidenceDifficulty: "insanity" }),
    ).toBe(false);
    expect(
      isGhostPossible(spirit, evidence, [], { evidenceDifficulty: "insanity" }),
    ).toBe(true);
  });

  it("Insanity: Mimic Orbs do not violate filtering and remain always-presented", () => {
    const orbsOnly = setEvidenceEntryState(
      createInitialEvidenceMap(),
      "ghostOrbs",
      "confirmed",
    );
    expect(
      isGhostPossible(mimic, orbsOnly, [], { evidenceDifficulty: "insanity" }),
    ).toBe(true);
    expect(
      isGhostPossible(spirit, orbsOnly, [], { evidenceDifficulty: "insanity" }),
    ).toBe(false);

    let mimicPath = createInitialEvidenceMap();
    mimicPath = setEvidenceEntryState(mimicPath, "ghostOrbs", "confirmed");
    mimicPath = setEvidenceEntryState(mimicPath, "fingerprints", "confirmed");
    expect(
      isGhostPossible(mimic, mimicPath, [], { evidenceDifficulty: "insanity" }),
    ).toBe(true);
  });

  it("Insanity: Deogen stays when its forced Spirit Box is confirmed", () => {
    const evidence = setEvidenceEntryState(
      createInitialEvidenceMap(),
      "spiritBox",
      "confirmed",
    );
    expect(
      isGhostPossible(deogen, evidence, [], { evidenceDifficulty: "insanity" }),
    ).toBe(true);
  });

  it("Apocalypse: ignores confirmed/eliminated evidence", () => {
    let evidence = createInitialEvidenceMap();
    evidence = setEvidenceEntryState(evidence, "emf5", "confirmed");
    evidence = setEvidenceEntryState(evidence, "ghostWriting", "eliminated");

    expect(
      isGhostPossible(spirit, evidence, [], {
        evidenceDifficulty: "apocalypse",
      }),
    ).toBe(true);
    expect(
      isGhostPossible(spirit, evidence, ["spirit"], {
        evidenceDifficulty: "apocalypse",
      }),
    ).toBe(false);
  });
});

describe("filterPossibleGhostIds", () => {
  it("includes all ghosts when evidence is unknown", () => {
    const possible = filterPossibleGhostIds(GHOSTS, createInitialEvidenceMap());
    expect(possible.size).toBe(GHOSTS.length);
  });

  it("narrows results with multiple confirmed and eliminated evidence", () => {
    let evidence = createInitialEvidenceMap();
    evidence = setEvidenceEntryState(evidence, "emf5", "confirmed");
    evidence = setEvidenceEntryState(evidence, "spiritBox", "confirmed");
    evidence = setEvidenceEntryState(evidence, "dots", "eliminated");

    const possible = filterPossibleGhostIds(GHOSTS, evidence);

    expect(possible.has("spirit")).toBe(true);
    expect(possible.has("twins")).toBe(true);
    expect(possible.has("wraith")).toBe(false);
    expect(possible.has("phantom")).toBe(false);
  });

  it("uses corrected Banshee and Jinn evidence triples", () => {
    let evidence = createInitialEvidenceMap();
    evidence = setEvidenceEntryState(evidence, "fingerprints", "confirmed");
    evidence = setEvidenceEntryState(evidence, "ghostOrbs", "confirmed");
    evidence = setEvidenceEntryState(evidence, "dots", "confirmed");

    const possible = filterPossibleGhostIds(GHOSTS, evidence);
    expect(possible.has("banshee")).toBe(true);
    expect(possible.size).toBe(1);
  });
});

describe("buildGhostDisplayItems", () => {
  it("preserves ghost order and sets isPossible from the id set", () => {
    const possibleIds = new Set(["spirit", "shade"]);
    const items = buildGhostDisplayItems(GHOSTS, possibleIds, ["demon"]);

    expect(items).toHaveLength(GHOSTS.length);
    expect(items.map((ghost) => ghost.id)).toEqual(
      GHOSTS.map((ghost) => ghost.id),
    );
    expect(items.find((ghost) => ghost.id === "spirit")?.isPossible).toBe(true);
    expect(items.find((ghost) => ghost.id === "demon")?.isPossible).toBe(false);
    expect(
      items.find((ghost) => ghost.id === "demon")?.isManuallyEliminated,
    ).toBe(true);
  });
});
