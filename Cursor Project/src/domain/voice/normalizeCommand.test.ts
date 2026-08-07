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
      durationSeconds: 180,
    });
    expect(resolveVoiceCommand("timer")).toEqual({
      type: "toggle_timing_mode",
    });
  });

  it("ignores unrelated speech", () => {
    expect(resolveUtterance("where is the ghost")).toBeNull();
    expect(resolveVoiceCommand("utterance", "hello there")).toBeNull();
  });
});
