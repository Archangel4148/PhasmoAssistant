import { describe, expect, it } from "vitest";
import {
  normalizeEvidencePhrase,
  resolveUtterance,
  resolveVoiceCommand,
  stripWakeWord,
} from "./normalizeCommand";

describe("stripWakeWord", () => {
  it("removes a leading trigger wake word", () => {
    expect(stripWakeWord("trigger emf five")).toBe("emf five");
  });

  it("returns empty when only the wake word is present", () => {
    expect(stripWakeWord("trigger")).toBe("");
  });
});

describe("normalizeEvidencePhrase", () => {
  it("normalizes common EMF variants", () => {
    expect(normalizeEvidencePhrase("EMF five")).toBe("emf5");
    expect(normalizeEvidencePhrase("emf 5")).toBe("emf5");
    expect(normalizeEvidencePhrase("level five emf")).toBe("emf5");
  });

  it("normalizes ultraviolet to fingerprints", () => {
    expect(normalizeEvidencePhrase("ultraviolet")).toBe("fingerprints");
    expect(normalizeEvidencePhrase("uv")).toBe("fingerprints");
  });
});

describe("resolveVoiceCommand", () => {
  it("accepts semantic set_evidence commands", () => {
    expect(resolveVoiceCommand("set_evidence", "spiritBox")).toEqual({
      type: "confirm_evidence",
      evidenceId: "spiritBox",
    });
  });

  it("resolves utterance payloads after wake-word gating", () => {
    expect(resolveVoiceCommand("utterance", "ghost orbs")).toEqual({
      type: "confirm_evidence",
      evidenceId: "ghostOrbs",
    });
  });

  it("maps smudge and timer semantic commands", () => {
    expect(resolveVoiceCommand("smudge")).toEqual({
      type: "start_smudge",
    });
    expect(resolveVoiceCommand("timer")).toEqual({
      type: "toggle_timing_mode",
    });
    expect(resolveUtterance("trigger hunt cooldown")).toEqual({
      type: "start_hunt_cooldown",
    });
  });

  it("eliminates evidence with not/eliminate prefixes", () => {
    expect(resolveUtterance("trigger not emf five")).toEqual({
      type: "eliminate_evidence",
      evidenceId: "emf5",
    });
    expect(resolveUtterance("eliminate spirit box")).toEqual({
      type: "eliminate_evidence",
      evidenceId: "spiritBox",
    });
    expect(resolveVoiceCommand("eliminate_evidence", "dots")).toEqual({
      type: "eliminate_evidence",
      evidenceId: "dots",
    });
  });

  it("resets hunt cooldown without toggling", () => {
    expect(resolveUtterance("reset hunt")).toEqual({
      type: "reset_hunt_cooldown",
    });
    expect(resolveVoiceCommand("reset_hunt")).toEqual({
      type: "reset_hunt_cooldown",
    });
  });

  it("resets the full investigation from clear/reset evidence phrases", () => {
    expect(resolveUtterance("trigger clear evidence")).toEqual({
      type: "reset_investigation",
    });
    expect(resolveUtterance("reset evidence")).toEqual({
      type: "reset_investigation",
    });
    expect(resolveVoiceCommand("reset_evidence")).toEqual({
      type: "reset_investigation",
    });
  });

  it("ignores unrelated speech", () => {
    expect(resolveUtterance("where is the ghost")).toBeNull();
    expect(resolveVoiceCommand("utterance", "hello there")).toBeNull();
  });
});
