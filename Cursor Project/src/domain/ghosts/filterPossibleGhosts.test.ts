import { describe, expect, it } from "vitest";
import { GHOSTS, GHOSTS_BY_ID } from "../../data/ghosts";
import {
  createInitialEvidenceMap,
  setEvidenceEntryState,
} from "../evidence/evidenceState";
import { buildGhostDisplayItems } from "./buildGhostDisplayItems";
import { filterPossibleGhostIds, isGhostPossible } from "./filterPossibleGhosts";

describe("isGhostPossible", () => {
  const spirit = GHOSTS_BY_ID.spirit;
  const demon = GHOSTS_BY_ID.demon;
  const wraith = GHOSTS_BY_ID.wraith;

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
});

describe("buildGhostDisplayItems", () => {
  it("preserves ghost order and sets isPossible from the id set", () => {
    const possibleIds = new Set(["spirit", "shade"]);
    const items = buildGhostDisplayItems(GHOSTS, possibleIds);

    expect(items).toHaveLength(GHOSTS.length);
    expect(items.map((ghost) => ghost.id)).toEqual(
      GHOSTS.map((ghost) => ghost.id),
    );
    expect(items.find((ghost) => ghost.id === "spirit")?.isPossible).toBe(true);
    expect(items.find((ghost) => ghost.id === "demon")?.isPossible).toBe(false);
  });
});
